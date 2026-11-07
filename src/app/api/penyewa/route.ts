import { NextRequest, NextResponse, connection } from "next/server";
import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import { rateLimit } from "@/lib/security";

// GET /api/penyewa
export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  // Wajib: baca DB live, jangan pernah di-prerender statis.
  await connection();
  seedDatabase();
  const db = getDb();
  const rows = db.prepare(`
    SELECT p.*, k.nomor as kamar_nomor, k.harga_sewa, k.status as kamar_status
    FROM penyewa p
    LEFT JOIN kamar k ON k.id = p.kamar_id
    ORDER BY p.id DESC
  `).all();
  return NextResponse.json(rows);
}
