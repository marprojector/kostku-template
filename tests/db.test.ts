import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type * as DbNamespace from "../src/lib/db";

// DB path harus diset SEBELUM src/lib/db di-import, karena modul menghitung
// DB_PATH saat load. Static import akan di-hoist lebih dulu, jadi modul db
// sengaja dimuat lewat dynamic import setelah env var diset.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "kostku-test-"));
const dbPath = path.join(tmpDir, "test.db");
process.env.KOSTKU_DB_PATH = dbPath;

type DbModule = typeof DbNamespace;
let dbModule: DbModule | undefined;

async function loadDb(): Promise<DbModule> {
  if (!dbModule) dbModule = await import("../src/lib/db");
  return dbModule;
}

after(async () => {
  if (dbModule) dbModule.closeDb();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("getDb membuat file database di KOSTKU_DB_PATH", async () => {
  const { getDb } = await loadDb();
  const db = getDb();
  assert.ok(fs.existsSync(dbPath), "file database harus dibuat");
  assert.equal(db.open, true);
});

test("initSchema membuat semua tabel yang dibutuhkan", async () => {
  const { getDb } = await loadDb();
  const db = getDb();

  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all() as { name: string }[];
  const tables = rows.map((r) => r.name);

  for (const tabel of ["kamar", "penyewa", "kontrak_sewa", "tagihan", "transaksi", "settings", "wa_log", "users"]) {
    assert.ok(tables.includes(tabel), `tabel ${tabel} harus ada`);
  }

  const indexes = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%' ORDER BY name")
    .all() as { name: string }[];
  assert.deepEqual(
    indexes.map((r) => r.name),
    [
      "idx_kamar_status",
      "idx_kontrak_status",
      "idx_tagihan_status",
      "idx_transaksi_tanggal",
      "idx_transaksi_tipe",
    ]
  );
});

test("settings default di-seed saat database kosong", async () => {
  const { getDb } = await loadDb();
  const db = getDb();

  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get("nama_kos") as
    | { value: string }
    | undefined;
  assert.ok(row, "settings nama_kos harus ada");
  assert.equal(row.value, "KostKu");

  const kategori = db.prepare("SELECT value FROM settings WHERE key = ?").get("kategori_pengeluaran") as
    | { value: string }
    | undefined;
  assert.ok(kategori);
  assert.deepEqual(JSON.parse(kategori.value), [
    "Listrik",
    "WiFi / Internet",
    "Gaji",
    "Perlengkapan Operasional",
    "Maintenance",
  ]);
});

test("insert dan read kamar berjalan", async () => {
  const { getDb } = await loadDb();
  const db = getDb();

  const info = db
    .prepare("INSERT INTO kamar (nomor, harga_sewa, status) VALUES (?, ?, ?)")
    .run("A-01", 850_000, "tersedia");
  assert.equal(info.changes, 1);

  const id = Number(info.lastInsertRowid);
  assert.ok(Number.isSafeInteger(id) && id > 0);

  const row = db.prepare("SELECT * FROM kamar WHERE id = ?").get(id) as
    | { id: number; nomor: string; harga_sewa: number; status: string; created_at: string }
    | undefined;
  assert.ok(row);
  assert.equal(row.nomor, "A-01");
  assert.equal(row.harga_sewa, 850_000);
  assert.equal(row.status, "tersedia");
  assert.equal(typeof row.created_at, "string");
});

test("nomor kamar unik (unique constraint)", async () => {
  const { getDb } = await loadDb();
  const db = getDb();

  db.prepare("INSERT INTO kamar (nomor, harga_sewa) VALUES (?, ?)").run("B-02", 750_000);

  assert.throws(
    () => db.prepare("INSERT INTO kamar (nomor, harga_sewa) VALUES (?, ?)").run("B-02", 900_000),
    (err: unknown) => {
      const e = err as { code?: string; message?: string };
      assert.equal(e.code, "SQLITE_CONSTRAINT_UNIQUE");
      assert.match(e.message ?? "", /UNIQUE constraint failed: kamar\.nomor/);
      return true;
    }
  );

  const count = db.prepare("SELECT COUNT(*) AS c FROM kamar WHERE nomor = ?").get("B-02") as { c: number };
  assert.equal(count.c, 1);
});

test("status kamar dibatasi CHECK constraint", async () => {
  const { getDb } = await loadDb();
  const db = getDb();

  assert.throws(
    () => db.prepare("INSERT INTO kamar (nomor, harga_sewa, status) VALUES (?, ?, ?)").run("C-03", 700_000, "penuh"),
    (err: unknown) => {
      const e = err as { code?: string };
      assert.equal(e.code, "SQLITE_CONSTRAINT_CHECK");
      return true;
    }
  );
});

test("foreign key ditegakkan (penyewa → kamar)", async () => {
  const { getDb } = await loadDb();
  const db = getDb();

  assert.equal(db.pragma("foreign_keys", { simple: true }), 1);

  assert.throws(
    () => db.prepare("INSERT INTO penyewa (nama, no_wa, kamar_id) VALUES (?, ?, ?)").run("Siti", "0812", 999_999),
    (err: unknown) => {
      const e = err as { code?: string };
      assert.equal(e.code, "SQLITE_CONSTRAINT_FOREIGNKEY");
      return true;
    }
  );
});

test("relasi penyewa + kontrak + tagihan bisa dibaca kembali", async () => {
  const { getDb } = await loadDb();
  const db = getDb();

  const kamarId = Number(
    db.prepare("INSERT INTO kamar (nomor, harga_sewa, status) VALUES (?, ?, ?)").run("D-04", 900_000, "terisi")
      .lastInsertRowid
  );
  const penyewaId = Number(
    db.prepare("INSERT INTO penyewa (nama, no_wa, kamar_id) VALUES (?, ?, ?)").run("Rina", "628111222333", kamarId)
      .lastInsertRowid
  );
  const kontrakId = Number(
    db
      .prepare(
        "INSERT INTO kontrak_sewa (penyewa_id, kamar_id, nominal, tanggal_masuk, tanggal_jatuh_tempo) VALUES (?, ?, ?, ?, ?)"
      )
      .run(penyewaId, kamarId, 900_000, "2026-11-01", "2026-11-10").lastInsertRowid
  );
  db.prepare("INSERT INTO tagihan (kontrak_id, periode, nominal, jatuh_tempo) VALUES (?, ?, ?, ?)").run(
    kontrakId,
    "2026-11",
    900_000,
    "2026-11-10"
  );

  const row = db
    .prepare(
      `SELECT p.nama, k.nomor, ks.nominal AS nominal_kontrak, t.status AS status_tagihan
       FROM tagihan t
       JOIN kontrak_sewa ks ON ks.id = t.kontrak_id
       JOIN penyewa p ON p.id = ks.penyewa_id
       JOIN kamar k ON k.id = ks.kamar_id
       WHERE t.kontrak_id = ?`
    )
    .get(kontrakId) as
    | { nama: string; nomor: string; nominal_kontrak: number; status_tagihan: string }
    | undefined;

  assert.ok(row);
  assert.deepEqual(row, {
    nama: "Rina",
    nomor: "D-04",
    nominal_kontrak: 900_000,
    status_tagihan: "belum_lunas",
  });
});

test("closeDb menutup koneksi dan getDb membuka ulang data yang sama", async () => {
  const { getDb, closeDb } = await loadDb();

  const sebelum = getDb().prepare("SELECT COUNT(*) AS c FROM kamar").get() as { c: number };
  assert.ok(sebelum.c > 0);

  closeDb();
  const sesudah = getDb().prepare("SELECT COUNT(*) AS c FROM kamar").get() as { c: number };
  assert.equal(sesudah.c, sebelum.c);
});
