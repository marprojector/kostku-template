import { getDb } from "./db";

export function seedDatabase() {
  if (process.env.NODE_ENV === "production" && process.env.SEED_DATABASE !== "true") return;

  const db = getDb();

  // Only seed if database is empty (no kamar records)
  const existing = db.prepare("SELECT COUNT(*) as c FROM kamar").get() as { c: number };
  if (existing.c > 0) return;
  const insertKamar = db.prepare(
    "INSERT INTO kamar (nomor, harga_sewa, status, created_at) VALUES (?, ?, ?, ?)"
  );
  const insertPenyewa = db.prepare(
    "INSERT INTO penyewa (nama, no_wa, kamar_id, created_at) VALUES (?, ?, ?, ?)"
  );
  const insertKontrak = db.prepare(
    `INSERT INTO kontrak_sewa (penyewa_id, kamar_id, nominal, tanggal_masuk, tanggal_jatuh_tempo, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'aktif', ?)`
  );
  const insertTagihan = db.prepare(
    `INSERT INTO tagihan (kontrak_id, periode, nominal, jatuh_tempo, status, tanggal_bayar, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insertTransaksi = db.prepare(
    "INSERT INTO transaksi (kontrak_id, tipe, kategori, nominal, tanggal, keterangan, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  const insertAll = db.transaction(() => {
    const iso = (s: string) => s; // date-only string, konsisten dengan kolom DATE SQLite
    const now = "2026-01-01";

    // 21 kamar
    const kamarIds: number[] = [];
    for (let i = 1; i <= 21; i++) {
      const harga = i <= 3 ? 650_000 : i <= 7 ? 750_000 : i <= 11 ? 800_000 : 850_000;
      const status = i <= 12 ? "terisi" : "tersedia";
      const result = insertKamar.run(`Kamar ${i}`, harga, status, now);
      kamarIds.push(result.lastInsertRowid as number);
    }

    // 12 penyewa (kamar 1-12)
    const penyewaData = [
      { nama: "Nurul Aini", noWa: "6281234500001" },
      { nama: "Rizky Ramadhan", noWa: "6281234500002" },
      { nama: "Fajar Hidayat", noWa: "6281234500003" },
      { nama: "Dewi Sartika", noWa: "6281234500004" },
      { nama: "Aditya Nugraha", noWa: "6281234500005" },
      { nama: "Eko Prasetyo", noWa: "6281234500006" },
      { nama: "Rina Marlina", noWa: "6281234500007" },
      { nama: "Bayu Setiawan", noWa: "6281234500008" },
      { nama: "Putri Ayu Lestari", noWa: "6281234500009" },
      { nama: "Hendra Gunawan", noWa: "6281234500010" },
      { nama: "Tri Wahyuni", noWa: "6281234500011" },
      { nama: "Agus Saputra", noWa: "6281234500012" },
    ];

    const penyewaIds: number[] = [];
    const kontrakIds: number[] = [];

    for (let i = 0; i < penyewaData.length; i++) {
      const p = penyewaData[i];
      const kamarId = kamarIds[i];
      const result = insertPenyewa.run(p.nama, p.noWa, kamarId, iso("2026-01-15"));
      penyewaIds.push(result.lastInsertRowid as number);
    }

    // Kontrak untuk 12 penyewa
    const hargaSewa = [650_000, 650_000, 750_000, 800_000, 800_000, 800_000, 800_000, 850_000, 850_000, 850_000, 850_000, 850_000];

    for (let i = 0; i < penyewaIds.length; i++) {
      const bulan = i === 7 ? 9 : 10; // Bayu (idx 7) sudah lewat 22 hari
      const hari = i % 2 === 0 ? 8 : 9;
      const nominal = hargaSewa[i];

      const result = insertKontrak.run(
        penyewaIds[i],
        kamarIds[i],
        nominal,
        iso(`2026-0${(i % 8) + 1}-05`),
        iso(`2026-${String(bulan).padStart(2, "0")}-${String(hari).padStart(2, "0")}`),
        iso("2026-01-15")
      );
      kontrakIds.push(result.lastInsertRowid as number);
    }

    // Tagihan November 2026 — 7 lunas, 5 belum lunas (8-12)
    for (let i = 0; i < kontrakIds.length; i++) {
      const sudahLewat = i === 7; // Bayu Setiawan lewat 22 hari
      const jatuhTempo = sudahLewat ? iso("2026-10-15") : iso("2026-11-08");
      const status = i < 7 ? "lunas" : "belum_lunas";
      const tanggalBayar = i < 7 ? iso("2026-11-01") : null;

      insertTagihan.run(kontrakIds[i], "2026-11", hargaSewa[i], jatuhTempo, status, tanggalBayar, iso("2026-10-20"));
    }

    // Transaksi November 2026
    const transaksiData = [
      { kontrak_id: null, tipe: "pengeluaran", kategori: "listrik", nominal: 800_000, tanggal: iso("2026-11-02"), keterangan: "Token listrik November" },
      { kontrak_id: null, tipe: "pengeluaran", kategori: "wifi", nominal: 350_000, tanggal: iso("2026-11-03"), keterangan: "Internet IndiHome" },
      { kontrak_id: null, tipe: "pengeluaran", kategori: "gaji", nominal: 1_600_000, tanggal: iso("2026-11-01"), keterangan: "Gaji penjaga" },
      { kontrak_id: null, tipe: "pengeluaran", kategori: "perlengkapan", nominal: 450_000, tanggal: iso("2026-11-04"), keterangan: "Sabun, tisu, dll" },
      { kontrak_id: null, tipe: "pengeluaran", kategori: "maintenance", nominal: 300_000, tanggal: iso("2026-11-05"), keterangan: "Perbaikan keran kamar 5" },
      { kontrak_id: null, tipe: "pemasukan", kategori: "deposit", nominal: 3_500_000, tanggal: iso("2026-11-01"), keterangan: "Deposit ditahan" },
    ];

    for (const t of transaksiData) {
      insertTransaksi.run(t.kontrak_id, t.tipe, t.kategori, t.nominal, t.tanggal, t.keterangan, t.tanggal);
    }
  });

  insertAll();
  console.log("[KostKu] Database seeded successfully");
}
