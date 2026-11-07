#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

async function main() {
  const root = process.env.KOSTKU_ROOT || process.cwd();
  const dbPath = path.resolve(process.env.KOSTKU_DB_PATH || path.join(root, "kostku.db"));
  const backupDir = path.resolve(process.env.KOSTKU_BACKUP_DIR || path.join(root, "backups"));
  const retention = Math.max(1, Number.parseInt(process.env.KOSTKU_BACKUP_RETENTION || "14", 10));

  if (!fs.existsSync(dbPath)) throw new Error(`Database tidak ditemukan: ${dbPath}`);

  fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  const db = new Database(dbPath, { readonly: false });
  try {
    db.pragma("wal_checkpoint(TRUNCATE)");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const output = path.join(backupDir, `kostku-${stamp}.db`);
    await db.backup(output);
    const integrity = db.pragma("integrity_check", { simple: true });
    if (integrity !== "ok") throw new Error(`integrity_check: ${integrity}`);
    fs.chmodSync(output, 0o600);
    console.log(`Backup berhasil: ${output}`);
  } finally {
    db.close();
  }

  const backups = fs.readdirSync(backupDir)
    .filter((name) => /^kostku-.*\.db$/.test(name))
    .sort()
    .reverse();
  for (const old of backups.slice(retention)) fs.unlinkSync(path.join(backupDir, old));
  console.log(`Backup dipertahankan: ${Math.min(backups.length, retention)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
