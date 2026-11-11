import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.resolve(process.env.KOSTKU_DB_PATH || path.join(process.cwd(), "kostku.db"));

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  _db.pragma("busy_timeout = 5000");
  initSchema(_db);
  return _db;
}

export function closeDb(): void {
  if (!_db) return;
  _db.close();
  _db = null;
}

export function checkpointDb(): void {
  getDb().pragma("wal_checkpoint(TRUNCATE)");
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS kamar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nomor TEXT NOT NULL UNIQUE,
      harga_sewa INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'tersedia' CHECK (status IN ('tersedia','terisi')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS penyewa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      no_wa TEXT,
      kamar_id INTEGER REFERENCES kamar(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS kontrak_sewa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      penyewa_id INTEGER NOT NULL REFERENCES penyewa(id),
      kamar_id INTEGER NOT NULL REFERENCES kamar(id),
      nominal INTEGER NOT NULL,
      tanggal_masuk TEXT NOT NULL,
      tanggal_jatuh_tempo TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','selesai','expired')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tagihan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kontrak_id INTEGER NOT NULL REFERENCES kontrak_sewa(id),
      periode TEXT NOT NULL,
      nominal INTEGER NOT NULL,
      jatuh_tempo TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'belum_lunas' CHECK (status IN ('lunas','belum_lunas')),
      tanggal_bayar TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transaksi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kontrak_id INTEGER REFERENCES kontrak_sewa(id),
      tipe TEXT NOT NULL CHECK (tipe IN ('pemasukan','pengeluaran')),
      kategori TEXT NOT NULL,
      nominal INTEGER NOT NULL,
      tanggal TEXT NOT NULL,
      keterangan TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      nama TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wa_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      penyewa_id INTEGER REFERENCES penyewa(id),
      pesan TEXT NOT NULL,
      wa_url TEXT NOT NULL,
      sent_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_kamar_status ON kamar(status);
    CREATE INDEX IF NOT EXISTS idx_tagihan_status ON tagihan(status, jatuh_tempo);
    CREATE INDEX IF NOT EXISTS idx_kontrak_status ON kontrak_sewa(status);
    CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal ON transaksi(tanggal);
    CREATE INDEX IF NOT EXISTS idx_transaksi_tipe ON transaksi(tipe);
  `);

  // Seed default settings if empty
  const existing = db.prepare("SELECT COUNT(*) as c FROM settings").get() as { c: number };
  if (existing.c === 0) {
    const insert = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
    insert.run("kategori_pengeluaran", JSON.stringify([
      "Listrik", "WiFi / Internet", "Gaji", "Perlengkapan Operasional", "Maintenance"
    ]));
    insert.run("nama_kos", "KostKu");
    insert.run("alamat", "");
    insert.run("nama_pemilik", "");
  }
}
