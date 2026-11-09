import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rateLimit } from "@/lib/security";
import { normalizeKategori, readKategoriRaw } from "@/lib/kategori";

// POST /api/pengeluaran/otomatis — posting pengeluaran rutin dari kategori mode "otomatis"
// Idempoten: kategori+periode yang sudah tercatat tidak dibuat ulang.
export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const db = getDb();
  const kategori = normalizeKategori(readKategoriRaw(db));
  const rutin = kategori.filter((k) => k.mode === "otomatis" && k.harga > 0);
  if (rutin.length === 0) {
    return NextResponse.json({ ok: true, dibuat: 0, dilewati: 0 });
  }

  const periode = new Date().toISOString().slice(0, 7);
  const today = new Date().toLocaleDateString("sv-SE");

  let dibuat = 0;
  let dilewati = 0;
  const dibuatNama: string[] = [];

  const posting = db.transaction(() => {
    const cek = db.prepare(
      "SELECT COUNT(*) AS c FROM transaksi WHERE tipe = 'pengeluaran' AND kategori = ? AND tanggal LIKE ?"
    );
    const insert = db.prepare(
      `INSERT INTO transaksi (kontrak_id, tipe, kategori, nominal, tanggal, keterangan, created_at)
       VALUES (NULL, 'pengeluaran', ?, ?, ?, ?, datetime('now'))`
    );
    for (const k of rutin) {
      const existing = cek.get(k.nama, `${periode}-%`) as { c: number };
      if (existing.c > 0) {
        dilewati++;
        continue;
      }
      insert.run(k.nama, k.harga, today, `Pengeluaran rutin ${k.nama} (${periode})`);
      dibuat++;
      dibuatNama.push(k.nama);
    }
  });
  posting();

  return NextResponse.json({ ok: true, dibuat, dilewati, dibuatNama, periode });
}
