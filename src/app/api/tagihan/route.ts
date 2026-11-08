import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import { rateLimit } from "@/lib/security";

// GET /api/tagihan
export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  seedDatabase();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const periode = searchParams.get("periode");
  const status = searchParams.get("status");

  const semua = searchParams.get("semua") === "1";

  let rows = db.prepare(`
    SELECT t.*, p.nama as nama_penyewa, p.no_wa, k.nomor as kamar_nomor
    FROM tagihan t
    JOIN kontrak_sewa ks ON ks.id = t.kontrak_id
    JOIN penyewa p ON p.id = ks.penyewa_id
    JOIN kamar k ON k.id = ks.kamar_id
    ${semua ? "ORDER BY t.jatuh_tempo ASC" : "WHERE ks.status = 'aktif' ORDER BY t.jatuh_tempo ASC"}
  `).all() as Array<Record<string, unknown>>;

  if (periode) rows = rows.filter((r) => r.periode === periode);
  if (status) rows = rows.filter((r) => r.status === status);

  return NextResponse.json(rows);
}
