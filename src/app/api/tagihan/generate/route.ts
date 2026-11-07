import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rateLimit, sanitizeString } from "@/lib/security";

// POST /api/tagihan/generate — buat tagihan untuk semua kontrak aktif pada periode tertentu
export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  let periode = new Date().toISOString().slice(0, 7);
  if (req.headers.get("content-type")?.includes("application/json")) {
    const raw = (await req.json().catch(() => ({}))) as { periode?: unknown };
    const parsed = typeof raw.periode === "string" ? raw.periode.trim() : "";
    if (parsed) {
      if (!/^\d{4}-\d{2}$/.test(parsed)) {
        return NextResponse.json({ error: "Format periode tidak valid (YYYY-MM)" }, { status: 400 });
      }
      periode = parsed;
    }
  }

  const db = getDb();
  const kontrakAktif = db.prepare("SELECT id, kamar_id, nominal FROM kontrak_sewa WHERE status = 'aktif'").all() as Array<{ id: number; kamar_id: number; nominal: number }>;
  if (kontrakAktif.length === 0) {
    return NextResponse.json({ ok: true, dibuat: 0, dilewati: 0, periode });
  }

  const existing = db.prepare(
    `SELECT kontrak_id FROM tagihan WHERE periode = ? AND kontrak_id IN (${kontrakAktif.map(() => "?").join(",")})`
  ).all(periode, ...kontrakAktif.map((k) => k.id)) as Array<{ kontrak_id: number }>;
  const sudahAda = new Set(existing.map((e) => e.kontrak_id));

  // Jatuh tempo: tanggal 8 bulan periode
  const jatuhTempo = `${periode}-08`;

  const insert = db.prepare(
    `INSERT INTO tagihan (kontrak_id, periode, nominal, jatuh_tempo, status, created_at)
     VALUES (?, ?, ?, ?, 'belum_lunas', datetime('now'))`
  );
  const generate = db.transaction(() => {
    let dibuat = 0;
    for (const k of kontrakAktif) {
      if (sudahAda.has(k.id)) continue;
      insert.run(k.id, periode, k.nominal, jatuhTempo);
      dibuat++;
    }
    return dibuat;
  });

  const dibuat = generate();
  return NextResponse.json({
    ok: true,
    periode,
    dibuat,
    dilewati: kontrakAktif.length - dibuat,
  });
}

// GET /api/tagihan/generate — pratinjau kontrak yang akan ditagih
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const periode = sanitizeString(searchParams.get("periode"), 7) ?? new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(periode)) {
    return NextResponse.json({ error: "Format periode tidak valid (YYYY-MM)" }, { status: 400 });
  }

  const db = getDb();
  const kontrakAktif = db.prepare("SELECT COUNT(*) as c FROM kontrak_sewa WHERE status = 'aktif'").get() as { c: number };
  const sudahAda = db.prepare(
    "SELECT COUNT(*) as c FROM tagihan WHERE periode = ?"
  ).get(periode) as { c: number };

  return NextResponse.json({
    periode,
    kontrakAktif: kontrakAktif.c,
    sudahAda: sudahAda.c,
    akanDibuat: Math.max(0, kontrakAktif.c - sudahAda.c),
  });
}
