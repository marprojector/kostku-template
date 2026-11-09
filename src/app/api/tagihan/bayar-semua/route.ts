import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rateLimit, sanitizeString } from "@/lib/security";

// POST /api/tagihan/bayar-semua — tandai semua tagihan belum lunas sebagai lunas
// Query opsional: ?periode=YYYY-MM (hanya periode tersebut)
export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const periodeRaw = new URL(req.url).searchParams.get("periode");
  let periode: string | null = null;
  if (periodeRaw) {
    periode = sanitizeString(periodeRaw, 7);
    if (!periode || !/^\d{4}-\d{2}$/.test(periode)) {
      return NextResponse.json({ error: "Format periode tidak valid (YYYY-MM)" }, { status: 400 });
    }
  }

  const db = getDb();
  const belumLunas = (
    periode
      ? db.prepare("SELECT id, kontrak_id, nominal FROM tagihan WHERE status = 'belum_lunas' AND periode = ?").all(periode)
      : db.prepare("SELECT id, kontrak_id, nominal FROM tagihan WHERE status = 'belum_lunas'").all()
  ) as Array<{ id: number; kontrak_id: number; nominal: number }>;

  if (belumLunas.length === 0) {
    return NextResponse.json({ ok: true, dibayar: 0, total: 0 });
  }

  const today = new Date().toLocaleDateString("sv-SE");
  const total = belumLunas.reduce((s, t) => s + t.nominal, 0);

  const bayar = db.transaction(() => {
    const update = db.prepare("UPDATE tagihan SET status = 'lunas', tanggal_bayar = ? WHERE id = ?");
    const insert = db.prepare(
      `INSERT INTO transaksi (kontrak_id, tipe, kategori, nominal, tanggal, keterangan, created_at)
       VALUES (?, 'pemasukan', 'sewa', ?, ?, ?, datetime('now'))`
    );
    for (const t of belumLunas) {
      update.run(today, t.id);
      insert.run(t.kontrak_id, t.nominal, today, `Pembayaran tagihan #${t.id}`);
    }
  });
  bayar();

  return NextResponse.json({ ok: true, dibayar: belumLunas.length, total, tanggalBayar: today });
}
