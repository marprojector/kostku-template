import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import { rateLimit } from "@/lib/security";

// GET /api/kamar
export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  seedDatabase();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  let rows = db.prepare(`
    SELECT k.id, k.nomor, k.harga_sewa, k.status, k.created_at,
           ks.id AS kontrak_id, ks.nominal AS kontrak_nominal, ks.tanggal_jatuh_tempo,
           p.id AS penyewa_id, p.nama AS nama_penyewa, p.no_wa
    FROM kamar k
    LEFT JOIN kontrak_sewa ks ON ks.kamar_id = k.id AND ks.status = 'aktif'
    LEFT JOIN penyewa p ON p.id = ks.penyewa_id
    ORDER BY CAST(SUBSTR(k.nomor, 7) AS INTEGER)
  `).all() as Array<Record<string, unknown>>;

  if (status) rows = rows.filter((r) => r.status === status);
  if (q) {
    const lower = q.toLowerCase();
    rows = rows.filter((r) =>
      String(r.nomor).toLowerCase().includes(lower) ||
      String(r.nama_penyewa ?? "").toLowerCase().includes(lower)
    );
  }

  return NextResponse.json(rows);
}
