import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rateLimit, requireJson, sanitizeId, sanitizeString } from "@/lib/security";

// DELETE /api/kamar/:id — hapus kamar (hanya yang tersedia & tanpa kontrak)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = sanitizeId((await params).id);
  if (!id) return NextResponse.json({ error: "ID kamar tidak valid" }, { status: 400 });

  const limited = rateLimit(req);
  if (limited) return limited;

  const db = getDb();
  const kamar = db.prepare("SELECT * FROM kamar WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!kamar) return NextResponse.json({ error: "Kamar tidak ditemukan" }, { status: 404 });
  if (kamar.status !== "tersedia") {
    return NextResponse.json({ error: "Kamar masih terisi — lakukan check-out dulu" }, { status: 400 });
  }

  const kontrakAktif = db.prepare(
    "SELECT id FROM kontrak_sewa WHERE kamar_id = ? AND status = 'aktif'"
  ).get(id);
  if (kontrakAktif) {
    return NextResponse.json({ error: "Kamar masih punya kontrak aktif" }, { status: 400 });
  }

  db.prepare("DELETE FROM kamar WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}

// PUT /api/kamar/:id — edit kamar
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = sanitizeId((await params).id);
  if (!id) return NextResponse.json({ error: "ID kamar tidak valid" }, { status: 400 });
  const contentError = requireJson(req);
  if (contentError) return contentError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }
  const input = body as { nomor?: unknown; hargaSewa?: unknown; status?: unknown };
  const updates: string[] = [];
  const values: Array<string | number> = [];

  if (input.nomor !== undefined) {
    const nomor = sanitizeString(input.nomor, 64);
    if (!nomor) return NextResponse.json({ error: "Nomor kamar tidak valid" }, { status: 400 });
    updates.push("nomor = ?");
    values.push(nomor);
  }
  if (input.hargaSewa !== undefined) {
    const harga = input.hargaSewa;
    if (typeof harga !== "number" || !Number.isSafeInteger(harga) || harga <= 0) {
      return NextResponse.json({ error: "Harga sewa tidak valid" }, { status: 400 });
    }
    updates.push("harga_sewa = ?");
    values.push(harga);
  }
  if (input.status !== undefined) {
    if (input.status !== "tersedia" && input.status !== "terisi") {
      return NextResponse.json({ error: "Status harus 'tersedia' atau 'terisi'" }, { status: 400 });
    }
    updates.push("status = ?");
    values.push(input.status);
  }
  if (updates.length === 0) {
    return NextResponse.json({ error: "Tidak ada field yang diupdate" }, { status: 400 });
  }

  try {
    const result = getDb().prepare(`UPDATE kamar SET ${updates.join(", ")} WHERE id = ?`).run(...values, id);
    if (result.changes === 0) return NextResponse.json({ error: "Kamar tidak ditemukan" }, { status: 404 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "Nomor kamar sudah digunakan" }, { status: 409 });
    }
    throw err;
  }
  return NextResponse.json({ ok: true });
}
