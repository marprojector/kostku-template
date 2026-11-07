import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireJson, rateLimit, sanitizeId, sanitizeString } from "@/lib/security";

// POST /api/wa-log — catat pengiriman WhatsApp
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

  const input = body as { penyewaId?: unknown; pesan?: unknown; waUrl?: unknown };
  const penyewaId = sanitizeId(input.penyewaId);
  const pesan = sanitizeString(input.pesan, 2000);
  const waUrl = sanitizeString(input.waUrl, 512);

  if (!pesan || !waUrl) {
    return NextResponse.json({ error: "Field wajib: pesan, waUrl" }, { status: 400 });
  }

  // Validasi waUrl adalah format wa.me
  if (!waUrl.startsWith("https://wa.me/")) {
    return NextResponse.json({ error: "URL WhatsApp tidak valid" }, { status: 400 });
  }

  const result = getDb().prepare(
    "INSERT INTO wa_log (penyewa_id, pesan, wa_url, sent_at) VALUES (?, ?, ?, datetime('now'))"
  ).run(penyewaId ?? null, pesan, waUrl);

  return NextResponse.json({ id: result.lastInsertRowid, ok: true }, { status: 201 });
}
