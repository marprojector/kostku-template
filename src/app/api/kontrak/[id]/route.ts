import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireJson, rateLimit, sanitizeId } from "@/lib/security";

// PUT /api/kontrak/:id — perpanjang masa sewa (tambah hari ke jatuh tempo)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = sanitizeId((await params).id);
  if (!id) return NextResponse.json({ error: "ID kontrak tidak valid" }, { status: 400 });

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

  const input = body as { tambahHari?: unknown };
  const tambahHari = input.tambahHari;
  if (typeof tambahHari !== "number" || !Number.isSafeInteger(tambahHari) || tambahHari <= 0 || tambahHari > 3650) {
    return NextResponse.json({ error: "tambahHari harus angka 1-3650" }, { status: 400 });
  }

  const db = getDb();
  const kontrak = db.prepare("SELECT * FROM kontrak_sewa WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!kontrak) return NextResponse.json({ error: "Kontrak tidak ditemukan" }, { status: 404 });
  if (kontrak.status !== "aktif") {
    return NextResponse.json({ error: "Hanya kontrak aktif yang bisa diperpanjang" }, { status: 400 });
  }

  // Tambah hari ke jatuh tempo — date-only, timezone lokal
  const jt = new Date(kontrak.tanggal_jatuh_tempo as string);
  jt.setDate(jt.getDate() + tambahHari);
  const jatuhTempoBaru = jt.toLocaleDateString("sv-SE");

  db.prepare("UPDATE kontrak_sewa SET tanggal_jatuh_tempo = ? WHERE id = ?").run(jatuhTempoBaru, id);

  return NextResponse.json({ ok: true, kontrakId: id, jatuhTempoBaru });
}
