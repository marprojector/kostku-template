import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rateLimit, sanitizeString } from "@/lib/security";
import { isoPeriode } from "@/lib/format";
import { hitungJatuhTempo } from "@/lib/tagihan";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  let periode = isoPeriode();
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
  const kontrakAktif = db.prepare(
    "SELECT id, kamar_id, nominal, tanggal_masuk FROM kontrak_sewa WHERE status = 'aktif'"
  ).all() as Array<{ id: number; kamar_id: number; nominal: number; tanggal_masuk: string }>;

  const eligible = kontrakAktif.filter((k) => {
    const mulai = typeof k.tanggal_masuk === "string" ? k.tanggal_masuk.slice(0, 7) : "";
    return /^\d{4}-\d{2}$/.test(mulai) && mulai <= periode;
  });

  if (eligible.length === 0) {
    return NextResponse.json({ ok: true, periode, dibuat: 0, dilewati: 0 });
  }

  const placeholders = eligible.map(() => "?");
  const existing = db.prepare(
    `SELECT kontrak_id FROM tagihan WHERE periode = ? AND kontrak_id IN (${placeholders.join(",")})`
  ).all(periode, ...eligible.map((k) => k.id)) as Array<{ kontrak_id: number }>;
  const sudahAda = new Set(existing.map((e) => e.kontrak_id));

  const insert = db.prepare(
    `INSERT INTO tagihan (kontrak_id, periode, nominal, jatuh_tempo, status, created_at)
     VALUES (?, ?, ?, ?, 'belum_lunas', datetime('now'))`
  );
  const generate = db.transaction(() => {
    let dibuat = 0;
    for (const k of eligible) {
      if (sudahAda.has(k.id)) continue;
      insert.run(k.id, periode, k.nominal, hitungJatuhTempo(k.tanggal_masuk, periode));
      dibuat++;
    }
    return dibuat;
  });

  const dibuat = generate();
  const dilewati = eligible.filter((k) => sudahAda.has(k.id)).length;

  return NextResponse.json({
    ok: true,
    periode,
    dibuat,
    dilewati,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const periode = sanitizeString(searchParams.get("periode"), 7) ?? isoPeriode();
  if (!/^\d{4}-\d{2}$/.test(periode)) {
    return NextResponse.json({ error: "Format periode tidak valid (YYYY-MM)" }, { status: 400 });
  }

  const db = getDb();
  const kontrakAktif = db.prepare(
    "SELECT COUNT(*) as c FROM kontrak_sewa WHERE status = 'aktif' AND substr(tanggal_masuk, 1, 7) <= ?"
  ).get(periode) as { c: number };
  const sudahAda = db.prepare(
    `SELECT COUNT(*) as c FROM tagihan t
     JOIN kontrak_sewa ks ON ks.id = t.kontrak_id
     WHERE t.periode = ? AND ks.status = 'aktif' AND substr(ks.tanggal_masuk, 1, 7) <= ?`
  ).get(periode, periode) as { c: number };

  return NextResponse.json({
    periode,
    kontrakAktif: kontrakAktif.c,
    sudahAda: sudahAda.c,
    akanDibuat: Math.max(0, kontrakAktif.c - sudahAda.c),
  });
}