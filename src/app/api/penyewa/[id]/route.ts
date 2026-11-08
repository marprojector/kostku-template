import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rateLimit, requireJson, sanitizeString } from "@/lib/security";
import { normalisasiWa } from "@/lib/format";

// GET /api/penyewa/:id — profil + riwayat
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const id = Number.parseInt((await params).id, 10);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID penyewa tidak valid" }, { status: 400 });
  }

  const db = getDb();
  const penyewa = db.prepare("SELECT * FROM penyewa WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!penyewa) return NextResponse.json({ error: "Penyewa tidak ditemukan" }, { status: 404 });

  const kontrak = db.prepare(`
    SELECT ks.*, k.nomor as kamar_nomor
    FROM kontrak_sewa ks
    JOIN kamar k ON k.id = ks.kamar_id
    WHERE ks.penyewa_id = ?
    ORDER BY ks.id DESC
  `).all(id) as Array<Record<string, unknown>>;

  const tagihan = db.prepare(`
    SELECT t.*
    FROM tagihan t
    JOIN kontrak_sewa ks ON ks.id = t.kontrak_id
    WHERE ks.penyewa_id = ?
    ORDER BY t.periode DESC, t.id DESC
  `).all(id) as Array<Record<string, unknown>>;

  const transaksi = db.prepare(`
    SELECT tr.*
    FROM transaksi tr
    JOIN kontrak_sewa ks ON ks.id = tr.kontrak_id
    WHERE ks.penyewa_id = ?
    ORDER BY tr.tanggal DESC, tr.id DESC
  `).all(id) as Array<Record<string, unknown>>;

  const waLog = db.prepare(`
    SELECT w.*
    FROM wa_log w
    WHERE w.penyewa_id = ?
    ORDER BY w.sent_at DESC
    LIMIT 20
  `).all(id) as Array<Record<string, unknown>>;

  return NextResponse.json({ penyewa, kontrak, tagihan, transaksi, waLog });
}

// PUT /api/penyewa/:id — edit data penyewa (nama, nomor WA)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rawId = Number.parseInt((await params).id, 10);
  if (!Number.isSafeInteger(rawId) || rawId <= 0) {
    return NextResponse.json({ error: "ID penyewa tidak valid" }, { status: 400 });
  }

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

  const input = body as { nama?: unknown; noWa?: unknown };
  const updates: string[] = [];
  const values: Array<string | number> = [];

  if (input.nama !== undefined) {
    const nama = sanitizeString(input.nama, 100);
    if (!nama) return NextResponse.json({ error: "Nama tidak valid" }, { status: 400 });
    updates.push("nama = ?");
    values.push(nama);
  }
  if (input.noWa !== undefined) {
    const noWaRaw = sanitizeString(input.noWa, 20);
    const noWa = noWaRaw ? normalisasiWa(noWaRaw) : "";
    updates.push("no_wa = ?");
    values.push(noWa);
  }
  if (updates.length === 0) {
    return NextResponse.json({ error: "Tidak ada field yang diupdate" }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare(`UPDATE penyewa SET ${updates.join(", ")} WHERE id = ?`).run(...values, rawId);
  if (result.changes === 0) return NextResponse.json({ error: "Penyewa tidak ditemukan" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
