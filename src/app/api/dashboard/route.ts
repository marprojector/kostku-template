import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import { BULAN_ID_SHORT } from "@/lib/format";
import { rateLimit } from "@/lib/security";

// GET /api/dashboard — stats ringkas untuk dashboard
export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  seedDatabase();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const tanggalParam = searchParams.get("tanggal");
  const now = tanggalParam && /^\d{4}-\d{2}-\d{2}$/.test(tanggalParam)
    ? tanggalParam
    : new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD di timezone server

  // Peta kamar: semua kamar + penyewa aktif + status tagihan periode berjalan
  const bulan = now.slice(0, 7);
  const kamarRows = db.prepare(`
    SELECT k.id, k.nomor, k.status, k.harga_sewa, p.nama as penyewa, p.id as penyewa_id,
           (SELECT t.id FROM tagihan t
            JOIN kontrak_sewa ks2 ON ks2.id = t.kontrak_id
            WHERE ks2.kamar_id = k.id AND t.periode = ?
            ORDER BY t.id DESC LIMIT 1) as tagihan_id,
           (SELECT t.status FROM tagihan t
            JOIN kontrak_sewa ks2 ON ks2.id = t.kontrak_id
            WHERE ks2.kamar_id = k.id AND t.periode = ?
            ORDER BY t.id DESC LIMIT 1) as tagihan_status
    FROM kamar k
    LEFT JOIN kontrak_sewa ks ON ks.kamar_id = k.id AND ks.status = 'aktif'
    LEFT JOIN penyewa p ON p.id = ks.penyewa_id
    ORDER BY CAST(SUBSTR(k.nomor, 7) AS INTEGER)
  `).all(bulan, bulan) as Array<{ id: number; nomor: string; status: string; harga_sewa: number; penyewa: string | null; penyewa_id: number | null; tagihan_id: number | null; tagihan_status: string | null }>;
  const totalKamar = db.prepare("SELECT COUNT(*) as c FROM kamar").get() as { c: number };
  const kamarTerisi = db.prepare("SELECT COUNT(*) as c FROM kamar WHERE status = 'terisi'").get() as { c: number };

  // Tagihan belum lunas
  const belumLunas = db.prepare("SELECT COUNT(*) as c FROM tagihan WHERE status = 'belum_lunas'").get() as { c: number };
  const totalTagihan = db.prepare(
    "SELECT COALESCE(SUM(nominal), 0) as total FROM tagihan WHERE status = 'belum_lunas'"
  ).get() as { total: number };

  // Hitung jatuh tempo 30 hari ke depan
  const jatuhTempo = db.prepare(`
    SELECT t.*, p.nama as nama_penyewa, p.no_wa, k.nomor as kamar_nomor
    FROM tagihan t
    JOIN kontrak_sewa ks ON ks.id = t.kontrak_id
    JOIN penyewa p ON p.id = ks.penyewa_id
    JOIN kamar k ON k.id = ks.kamar_id
    WHERE date(t.jatuh_tempo) >= date(?) AND date(t.jatuh_tempo) <= date(?, '+30 days')
    AND t.status = 'belum_lunas'
    ORDER BY t.jatuh_tempo ASC
    LIMIT 10
  `).all(now, now) as Array<Record<string, unknown>>;

  // Tagihan lewat (jatuh tempo sebelum sekarang)
  const lewat = db.prepare(`
    SELECT t.*, p.nama as nama_penyewa, p.no_wa, k.nomor as kamar_nomor
    FROM tagihan t
    JOIN kontrak_sewa ks ON ks.id = t.kontrak_id
    JOIN penyewa p ON p.id = ks.penyewa_id
    JOIN kamar k ON k.id = ks.kamar_id
    WHERE date(t.jatuh_tempo) < date(?) AND t.status = 'belum_lunas'
    ORDER BY t.jatuh_tempo ASC
  `).all(now) as Array<Record<string, unknown>>;

  // Pendapatan & pengeluaran bulan berjalan
  const pdp = db.prepare(`
    SELECT COALESCE(SUM(nominal), 0) as total FROM transaksi
    WHERE tipe = 'pemasukan' AND tanggal LIKE ?
  `).get(bulan + "%") as { total: number };

  const pdpSewa = db.prepare(`
    SELECT COALESCE(SUM(nominal), 0) as total FROM transaksi
    WHERE tipe = 'pemasukan' AND kategori = 'sewa' AND tanggal LIKE ?
  `).get(bulan + "%") as { total: number };

  const pdpDeposit = db.prepare(`
    SELECT COALESCE(SUM(nominal), 0) as total FROM transaksi
    WHERE tipe = 'pemasukan' AND kategori = 'deposit' AND tanggal LIKE ?
  `).get(bulan + "%") as { total: number };

  const pgp = db.prepare(`
    SELECT COALESCE(SUM(nominal), 0) as total FROM transaksi
    WHERE tipe = 'pengeluaran' AND tanggal LIKE ?
  `).get(bulan + "%") as { total: number };

  // Pengeluaran per kategori
  const kategoriRows = db.prepare(`
    SELECT kategori, SUM(nominal) as total FROM transaksi
    WHERE tipe = 'pengeluaran' AND tanggal LIKE ?
    GROUP BY kategori ORDER BY total DESC
  `).all(bulan + "%") as Array<{ kategori: string; total: number }>;
  const perKategori: Record<string, number> = {};
  for (const row of kategoriRows) perKategori[row.kategori] = row.total;

  // Bulan lalu untuk perbandingan
  const [nowTahun, nowBulan] = now.split("-").map(Number);
  const bl = new Date(Number(nowTahun), Number(nowBulan) - 2, 1);
  const bulanLalu = `${bl.getFullYear()}-${String(bl.getMonth() + 1).padStart(2, "0")}`;
  const pdpBulanLalu = db.prepare(`
    SELECT COALESCE(SUM(nominal), 0) as total FROM transaksi
    WHERE tipe = 'pemasukan' AND tanggal LIKE ?
  `).get(bulanLalu + "%") as { total: number };
  const pgpBulanLalu = db.prepare(`
    SELECT COALESCE(SUM(nominal), 0) as total FROM transaksi
    WHERE tipe = 'pengeluaran' AND tanggal LIKE ?
  `).get(bulanLalu + "%") as { total: number };

  // Arus kas 6 bulan terakhir untuk chart dashboard
  const [tahunNum, bulanNum] = bulan.split("-").map(Number);
  const arusKas: Array<{ bulan: string; label: string; pendapatan: number; pengeluaran: number }> = [];
  const stmtPdp = db.prepare("SELECT COALESCE(SUM(nominal), 0) as total FROM transaksi WHERE tipe = 'pemasukan' AND tanggal LIKE ?");
  const stmtPgp = db.prepare("SELECT COALESCE(SUM(nominal), 0) as total FROM transaksi WHERE tipe = 'pengeluaran' AND tanggal LIKE ?");
  for (let i = 6; i >= 1; i--) {
    const d = new Date(tahunNum, bulanNum - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const pdpRow = stmtPdp.get(key + "%") as { total: number };
    const pgpRow = stmtPgp.get(key + "%") as { total: number };
    arusKas.push({
      bulan: key,
      label: BULAN_ID_SHORT[d.getMonth()],
      pendapatan: pdpRow.total,
      pengeluaran: pgpRow.total,
    });
  }

  return NextResponse.json({
    okupansi: {
      total: totalKamar.c,
      terisi: kamarTerisi.c,
      tersedia: totalKamar.c - kamarTerisi.c,
      persen: Math.round((kamarTerisi.c / totalKamar.c) * 100),
    },
    kamar: kamarRows.map((r) => ({
      id: r.id,
      nomor: r.nomor,
      status: r.status,
      penyewa: r.penyewa,
      penyewaId: r.penyewa_id,
      harga: r.harga_sewa,
      tagihanStatus: r.tagihan_status,
      tagihanId: r.tagihan_id,
    })),
    tagihan: {
      belumLunas: totalTagihan.total,
      totalBelumLunas: belumLunas.c,
    },
    jatuhTempo,
    lewat,
    arusKas,
    keuangan: {
      bulan,
      pendapatan: pdp.total,
      pendapatanSewa: pdpSewa.total,
      pendapatanDeposit: pdpDeposit.total,
      bulanLalu: pdpBulanLalu.total,
      pengeluaran: pgp.total,
      pengeluaranBulanLalu: pgpBulanLalu.total,
      perKategori,
      laba: pdp.total - pgp.total,
      labaBulanLalu: pdpBulanLalu.total - pgpBulanLalu.total,
    },
  });
}
