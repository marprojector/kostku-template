import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import { rateLimit } from "@/lib/security";

// GET /api/laporan/tahunan?tahun=2026
export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  seedDatabase();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const tahunParam = searchParams.get("tahun");
  const tahun = tahunParam && /^\d{4}$/.test(tahunParam)
    ? tahunParam
    : String(new Date().getFullYear());

  const bulanList = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];

  const months = bulanList.map((nama, i) => {
    const bulan = String(i + 1).padStart(2, "0");
    const prefix = `${tahun}-${bulan}`;

    const pdp = db.prepare(`
      SELECT COALESCE(SUM(nominal), 0) as total FROM transaksi
      WHERE tipe = 'pemasukan' AND tanggal LIKE ?
    `).get(prefix + "%") as { total: number };

    const pgp = db.prepare(`
      SELECT COALESCE(SUM(nominal), 0) as total FROM transaksi
      WHERE tipe = 'pengeluaran' AND tanggal LIKE ?
    `).get(prefix + "%") as { total: number };

    return {
      nama: nama + " " + tahun,
      short: nama,
      pendapatan: pdp.total,
      pengeluaran: pgp.total,
      laba: pdp.total - pgp.total,
    };
  });

  const totalSewa = months.reduce((s, m) => s + m.pendapatan, 0);
  const totalPgp = months.reduce((s, m) => s + m.pengeluaran, 0);
  const arusKas = totalSewa - totalPgp;

  return NextResponse.json({ tahun, months, totalSewa, totalPgp, arusKas });
}
