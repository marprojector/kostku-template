import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rateLimit, sanitizeId } from "@/lib/security";

// POST /api/kontrak/:id/selesai — check-out penyewa
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = sanitizeId((await params).id);
  if (!id) return NextResponse.json({ error: "ID kontrak tidak valid" }, { status: 400 });

  const limited = rateLimit(req);
  if (limited) return limited;

  const db = getDb();
  const kontrak = db.prepare("SELECT * FROM kontrak_sewa WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!kontrak) return NextResponse.json({ error: "Kontrak tidak ditemukan" }, { status: 404 });
  if (kontrak.status !== "aktif") return NextResponse.json({ error: "Kontrak sudah tidak aktif" }, { status: 400 });

  db.prepare("UPDATE kontrak_sewa SET status = 'selesai' WHERE id = ?").run(id);
  db.prepare("UPDATE kamar SET status = 'tersedia' WHERE id = ?").run(kontrak.kamar_id);
  // Lepas kamar dari penyewa — kalau tidak, profil lama masih "pegang" kamar
  db.prepare("UPDATE penyewa SET kamar_id = NULL WHERE id = ? AND kamar_id = ?").run(kontrak.penyewa_id, kontrak.kamar_id);

  return NextResponse.json({ ok: true, kontrakId: id });
}
