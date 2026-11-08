import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rateLimit, requireJson, sanitizeId } from "@/lib/security";

// PUT /api/tagihan/:id/bayar — tandai lunas
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = sanitizeId((await params).id);
  if (!id) return NextResponse.json({ error: "ID tagihan tidak valid" }, { status: 400 });

  const limited = rateLimit(req);
  if (limited) return limited;

  const contentError = requireJson(req);
  if (contentError) return contentError;

  const db = getDb();
  const tagihan = db.prepare("SELECT * FROM tagihan WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!tagihan) return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
  if (tagihan.status === "lunas") return NextResponse.json({ error: "Tagihan sudah lunas" }, { status: 400 });

  const today = new Date().toLocaleDateString("sv-SE");

  db.prepare("UPDATE tagihan SET status = 'lunas', tanggal_bayar = ? WHERE id = ?").run(today, id);
  db.prepare(
    `INSERT INTO transaksi (kontrak_id, tipe, kategori, nominal, tanggal, keterangan, created_at)
     VALUES (?, 'pemasukan', 'sewa', ?, ?, ?, datetime('now'))`
  ).run(tagihan.kontrak_id, tagihan.nominal, today, `Pembayaran tagihan #${id}`);

  return NextResponse.json({ ok: true, tagihanId: id, tanggalBayar: today });
}
