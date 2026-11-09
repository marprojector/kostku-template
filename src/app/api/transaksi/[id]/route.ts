import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rateLimit, requireJson, sanitizeId, sanitizeString } from "@/lib/security";

const VALID_TIPE: Record<string, true> = { pemasukan: true, pengeluaran: true };

// PUT /api/transaksi/:id — edit transaksi (ganti harga/kategori/tanggal/keterangan)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = sanitizeId((await params).id);
  if (!id) return NextResponse.json({ error: "ID transaksi tidak valid" }, { status: 400 });

  const limited = rateLimit(req);
  if (limited) return limited;

  const contentError = requireJson(req);
  if (contentError) return contentError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare("SELECT * FROM transaksi WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!existing) return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });

  const input = body as { tipe?: unknown; kategori?: unknown; nominal?: unknown; tanggal?: unknown; keterangan?: unknown };

  const tipe = input.tipe === undefined ? (existing.tipe as string) : input.tipe;
  if (typeof tipe !== "string" || !VALID_TIPE[tipe]) {
    return NextResponse.json({ error: "Tipe harus 'pemasukan' atau 'pengeluaran'" }, { status: 400 });
  }

  const kategori =
    input.kategori === undefined ? sanitizeString(existing.kategori, 64) : sanitizeString(input.kategori, 64);
  if (!kategori) return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });

  const nominalRaw = input.nominal === undefined ? Number(existing.nominal) : input.nominal;
  const nominal = typeof nominalRaw === "number" && Number.isSafeInteger(nominalRaw) && nominalRaw >= 0 ? nominalRaw : null;
  if (nominal === null) return NextResponse.json({ error: "Nominal harus angka >= 0" }, { status: 400 });

  const tanggal = input.tanggal === undefined ? sanitizeString(existing.tanggal, 10) : sanitizeString(input.tanggal, 10);
  if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    return NextResponse.json({ error: "Format tanggal tidak valid (YYYY-MM-DD)" }, { status: 400 });
  }

  const keterangan = input.keterangan === undefined ? sanitizeString(existing.keterangan, 255) ?? "" : sanitizeString(input.keterangan, 255) ?? "";

  db.prepare(
    "UPDATE transaksi SET tipe = ?, kategori = ?, nominal = ?, tanggal = ?, keterangan = ? WHERE id = ?"
  ).run(tipe, kategori, nominal, tanggal, keterangan, id);

  return NextResponse.json({ ok: true });
}

// DELETE /api/transaksi/:id — hapus transaksi
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = sanitizeId((await params).id);
  if (!id) return NextResponse.json({ error: "ID transaksi tidak valid" }, { status: 400 });

  const limited = rateLimit(req);
  if (limited) return limited;

  const result = getDb().prepare("DELETE FROM transaksi WHERE id = ?").run(id);
  if (result.changes === 0) return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
