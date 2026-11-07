import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireJson, rateLimit, sanitizeString } from "@/lib/security";

const ALLOWED_KEYS: Record<string, true> = {
  nama_kos: true,
  alamat: true,
  nama_pemilik: true,
  kategori_pengeluaran: true,
};

// GET /api/pengaturan — semua setting dalam satu object
export async function GET(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const rows = getDb().prepare("SELECT key, value FROM settings").all() as Array<{ key: string; value: string }>;
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    if (!ALLOWED_KEYS[row.key]) continue;
    try {
      result[row.key] = JSON.parse(row.value) as unknown;
    } catch {
      result[row.key] = row.value;
    }
  }
  return NextResponse.json(result);
}

// PUT /api/pengaturan?key=<name> — update satu setting
export async function PUT(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Query param 'key' wajib" }, { status: 400 });
  if (!ALLOWED_KEYS[key]) return NextResponse.json({ error: "Key tidak diizinkan" }, { status: 403 });

  const contentError = requireJson(req);
  if (contentError) return contentError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }

  const input = body as { value?: unknown };
  let parsedValue: string | string[];
  if (key === "kategori_pengeluaran") {
    if (!Array.isArray(input.value) || input.value.some((item) => typeof item !== "string")) {
      return NextResponse.json({ error: "Kategori harus berupa array teks" }, { status: 400 });
    }
    parsedValue = input.value
      .map((item) => sanitizeString(item, 80))
      .filter((item): item is string => item !== null)
      .slice(0, 100);
  } else {
    const value = sanitizeString(input.value, 500);
    if (!value) return NextResponse.json({ error: "Nilai setting tidak valid" }, { status: 400 });
    parsedValue = value;
  }

  const encoded = JSON.stringify(parsedValue);
  getDb().prepare(
    "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))"
  ).run(key, encoded);

  return NextResponse.json({ ok: true, key, value: parsedValue });
}
