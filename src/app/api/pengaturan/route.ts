import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireJson, rateLimit, sanitizeString } from "@/lib/security";
import { normalizeKategori, readKategoriRaw, type KategoriItem } from "@/lib/kategori";

export type { KategoriItem };

const ALLOWED_KEYS: Record<string, true> = {
  nama_kos: true,
  alamat: true,
  nama_pemilik: true,
  kategori_pengeluaran: true,
  rename_kategori: true, // pseudo-key khusus PUT: ganti nama kategori + update transaksi
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
      const parsed = JSON.parse(row.value) as unknown;
      result[row.key] = row.key === "kategori_pengeluaran" ? normalizeKategori(parsed) : parsed;
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

  // PUT ?key=rename_kategori — ganti nama kategori + update transaksi lama
  if (key === "rename_kategori") {
    const { dari, ke } = (input.value ?? {}) as { dari?: unknown; ke?: unknown };
    const dariS = sanitizeString(dari, 80);
    const keS = sanitizeString(ke, 80);
    if (!dariS || !keS) return NextResponse.json({ error: "Field 'dari' dan 'ke' wajib" }, { status: 400 });
    if (dariS === keS) {
      const current = normalizeKategori(readKategoriRaw(getDb()));
      return NextResponse.json({ ok: true, kategori_pengeluaran: current });
    }

    const db = getDb();
    const kategori = normalizeKategori(readKategoriRaw(db));
    const idx = kategori.findIndex((k) => k.nama === dariS);
    if (idx === -1) return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    if (kategori.some((k) => k.nama === keS)) return NextResponse.json({ error: "Kategori tujuan sudah ada" }, { status: 400 });

    kategori[idx] = { ...kategori[idx], nama: keS };
    const rename = db.transaction(() => {
      db.prepare(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('kategori_pengeluaran', ?, datetime('now'))"
      ).run(JSON.stringify(kategori));
      db.prepare("UPDATE transaksi SET kategori = ? WHERE kategori = ?").run(keS, dariS);
    });
    rename();
    return NextResponse.json({ ok: true, kategori_pengeluaran: kategori });
  }

  let parsedValue: string | KategoriItem[];
  if (key === "kategori_pengeluaran") {
    if (!Array.isArray(input.value)) {
      return NextResponse.json({ error: "Kategori harus berupa array" }, { status: 400 });
    }
    const items: KategoriItem[] = [];
    const seen = new Set<string>();
    for (const raw of input.value) {
      const o = (raw ?? {}) as Record<string, unknown>;
      const nama = typeof o.nama === "string" ? sanitizeString(o.nama, 80) : null;
      if (!nama || seen.has(nama)) continue;
      const hargaRaw = typeof o.harga === "number" ? o.harga : Number(o.harga);
      const harga = Number.isSafeInteger(hargaRaw) && hargaRaw >= 0 ? hargaRaw : 0;
      const mode = o.mode === "otomatis" ? "otomatis" : "manual";
      seen.add(nama);
      items.push({ nama, harga, mode });
    }
    parsedValue = items.slice(0, 100);
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
