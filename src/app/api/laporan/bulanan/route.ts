import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import { rateLimit } from "@/lib/security";
import { isoPeriode } from "@/lib/format";

// GET /api/laporan/bulanan?periode=2026-11
export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  seedDatabase();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const periodeParam = searchParams.get("periode");
  const periode = periodeParam && /^\d{4}-\d{2}$/.test(periodeParam)
    ? periodeParam
    : isoPeriode();
  const [tahun, bulan] = periode.split("-");

  // Pendapatan
  const pdp = db.prepare(`
    SELECT COALESCE(SUM(nominal), 0) as total FROM transaksi
    WHERE tipe = 'pemasukan' AND tanggal LIKE ?
  `).get(periode + "%") as { total: number };

  const pdpSewa = db.prepare(`
    SELECT COALESCE(SUM(nominal), 0) as total FROM transaksi
    WHERE tipe = 'pemasukan' AND kategori = 'sewa' AND tanggal LIKE ?
  `).get(periode + "%") as { total: number };

  const pdpDeposit = db.prepare(`
    SELECT COALESCE(SUM(nominal), 0) as total FROM transaksi
    WHERE tipe = 'pemasukan' AND kategori = 'deposit' AND tanggal LIKE ?
  `).get(periode + "%") as { total: number };

  // Pengeluaran per kategori
  const pgp = db.prepare(`
    SELECT COALESCE(SUM(nominal), 0) as total FROM transaksi
    WHERE tipe = 'pengeluaran' AND tanggal LIKE ?
  `).get(periode + "%") as { total: number };

  const katRows = db.prepare(`
    SELECT kategori, SUM(nominal) as total FROM transaksi
    WHERE tipe = 'pengeluaran' AND tanggal LIKE ?
    GROUP BY kategori ORDER BY total DESC
  `).all(periode + "%") as Array<{ kategori: string; total: number }>;
  const perKategori: Record<string, number> = {};
  for (const r of katRows) perKategori[r.kategori] = r.total;

  // Bulan lalu
  const bl = new Date(Number(tahun), Number(bulan) - 2, 1);
  const blStr = isoPeriode(bl);
  const pdpBl = db.prepare(`
    SELECT COALESCE(SUM(nominal), 0) as total FROM transaksi
    WHERE tipe = 'pemasukan' AND tanggal LIKE ?
  `).get(blStr + "%") as { total: number };
  const pgpBl = db.prepare(`
    SELECT COALESCE(SUM(nominal), 0) as total FROM transaksi
    WHERE tipe = 'pengeluaran' AND tanggal LIKE ?
  `).get(blStr + "%") as { total: number };

  const laba = pdp.total - pgp.total;
  const margin = pdp.total > 0 ? Math.round((laba / pdp.total) * 100) : 0;

  return NextResponse.json({
    periode,
    pendapatan: pdp.total,
    pendapatanSewa: pdpSewa.total,
    pendapatanDeposit: pdpDeposit.total,
    pengeluaran: pgp.total,
    perKategori,
    laba,
    margin,
    bulanLalu: { pendapatan: pdpBl.total, pengeluaran: pgpBl.total, laba: pdpBl.total - pgpBl.total },
  });
}
