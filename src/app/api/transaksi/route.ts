import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireJson, rateLimit, sanitizeString } from "@/lib/security";

const VALID_TIPE: Record<string, true> = { pemasukan: true, pengeluaran: true };

// POST /api/transaksi — catat transaksi baru
export async function POST(req: NextRequest) {
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

  const input = body as { tipe?: unknown; kategori?: unknown; nominal?: unknown; tanggal?: unknown; keterangan?: unknown; kontrakId?: unknown };
  const tipe = input.tipe === "pemasukan" || input.tipe === "pengeluaran" ? input.tipe : null;
  const kategori = sanitizeString(input.kategori, 64);
  const nominalRaw = typeof input.nominal === "number" ? input.nominal : NaN;
  const nominal = Number.isSafeInteger(nominalRaw) && nominalRaw >= 0 ? nominalRaw : null;
  const tanggal = sanitizeString(input.tanggal, 10);
  const keterangan = sanitizeString(input.keterangan, 255) ?? "";
  const kontrakId = typeof input.kontrakId === "number" && input.kontrakId > 0 ? input.kontrakId : null;

  if (!tipe || !kategori || nominal === null || !tanggal) {
    return NextResponse.json({ error: "Field wajib: tipe, kategori, nominal, tanggal" }, { status: 400 });
  }
  if (!VALID_TIPE[tipe]) {
    return NextResponse.json({ error: "Tipe harus 'pemasukan' atau 'pengeluaran'" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    return NextResponse.json({ error: "Format tanggal tidak valid (YYYY-MM-DD)" }, { status: 400 });
  }
  if (kontrakId !== null) {
    const contract = getDb().prepare("SELECT id FROM kontrak_sewa WHERE id = ?").get(kontrakId);
    if (!contract) return NextResponse.json({ error: "Kontrak tidak ditemukan" }, { status: 400 });
  }

  const result = getDb().prepare(
    `INSERT INTO transaksi (kontrak_id, tipe, kategori, nominal, tanggal, keterangan, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(kontrakId ?? null, tipe, kategori, nominal, tanggal, keterangan);

  return NextResponse.json({ id: result.lastInsertRowid, ok: true }, { status: 201 });
}

// GET /api/transaksi — list semua transaksi
export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;
  const db = getDb();
  const rows = db.prepare(
    `SELECT t.*, km.nomor as kamar_nomor
     FROM transaksi t
     LEFT JOIN kontrak_sewa k ON k.id = t.kontrak_id
     LEFT JOIN kamar km ON km.id = k.kamar_id
     ORDER BY t.tanggal DESC, t.id DESC`
  ).all();
  return NextResponse.json(rows);
}
