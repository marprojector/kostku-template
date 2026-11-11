import { getDb } from "./db";

export function seedDatabase() {
  if (process.env.SEED_DATABASE !== "true") return;

  const db = getDb();

  // Only seed if database is empty (no kamar records)
  const existing = db.prepare("SELECT COUNT(*) as c FROM kamar").get() as { c: number };
  if (existing.c > 0) return;
  const insertKamar = db.prepare(
    "INSERT INTO kamar (nomor, harga_sewa, status, created_at) VALUES (?, ?, ?, ?)"
  );
  const insertTransaksi = db.prepare(
    "INSERT INTO transaksi (kontrak_id, tipe, kategori, nominal, tanggal, keterangan, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  const insertAll = db.transaction(() => {
    const now = "2026-01-01";

    // 6 kamar, semua kosong — penyewa diisi lewat Check-In
    const kamarIds: number[] = [];
    for (let i = 1; i <= 6; i++) {
      const harga = i <= 2 ? 750_000 : i <= 4 ? 800_000 : 850_000;
      const result = insertKamar.run(`Kamar ${i}`, harga, "tersedia", now);
      kamarIds.push(result.lastInsertRowid as number);
    }

    // Transaksi contoh (tanpa kontrak — pengeluaran operasional)
    const transaksiData = [
      { kontrak_id: null, tipe: "pengeluaran", kategori: "listrik", nominal: 400_000, tanggal: "2026-11-02", keterangan: "Token listrik November" },
      { kontrak_id: null, tipe: "pengeluaran", kategori: "wifi", nominal: 350_000, tanggal: "2026-11-03", keterangan: "Internet IndiHome" },
      { kontrak_id: null, tipe: "pengeluaran", kategori: "maintenance", nominal: 150_000, tanggal: "2026-11-05", keterangan: "Perbaikan keran kamar 3" },
    ];

    for (const t of transaksiData) {
      insertTransaksi.run(t.kontrak_id, t.tipe, t.kategori, t.nominal, t.tanggal, t.keterangan, t.tanggal);
    }
  });

  insertAll();
  console.log("[KostKu] Database seeded successfully");
}
