import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import { requireJson, rateLimit, sanitizeId, sanitizeString } from "@/lib/security";

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

// POST /api/kontrak — check-in penyewa baru
export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  seedDatabase();
  const contentError = requireJson(req);
  if (contentError) return contentError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }

  const input = body as { nama?: unknown; noWa?: unknown; kamarId?: unknown; nominal?: unknown; tanggalMasuk?: unknown; deposit?: unknown };
  const nama = sanitizeString(input.nama, 100);
  const noWa = sanitizeString(input.noWa, 20);
  const kamarId = sanitizeId(input.kamarId);
  const nominalRaw = typeof input.nominal === "number" ? input.nominal : NaN;
  const nominal = Number.isSafeInteger(nominalRaw) && nominalRaw > 0 ? nominalRaw : null;
  const tanggalMasuk = sanitizeString(input.tanggalMasuk, 10);
  const depositRaw = typeof input.deposit === "number" ? input.deposit : NaN;
  const deposit = Number.isSafeInteger(depositRaw) && depositRaw >= 0 ? depositRaw : null;

  if (!nama || !kamarId || !nominal || !tanggalMasuk) {
    return NextResponse.json({ error: "Field wajib: nama, kamarId, nominal, tanggalMasuk" }, { status: 400 });
  }

  // Validasi format tanggal ISO
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalMasuk)) {
    return NextResponse.json({ error: "Format tanggalMasuk tidak valid (YYYY-MM-DD)" }, { status: 400 });
  }

  const db = getDb();

  // Cek kamar tersedia
  const kamar = db.prepare("SELECT * FROM kamar WHERE id = ? AND status = 'tersedia'").get(kamarId) as Record<string, unknown> | undefined;
  if (!kamar) {
    return NextResponse.json({ error: "Kamar tidak ditemukan atau sudah terisi" }, { status: 400 });
  }

  // Hitung jatuh tempo = tanggal masuk + 1 bulan
  const masuk = new Date(tanggalMasuk);
  masuk.setMonth(masuk.getMonth() + 1);
  const jatuhTempo = masuk.toLocaleDateString("sv-SE");

  const insertAll = db.transaction(() => {
    // Tambah penyewa
    const penyewaResult = db.prepare(
      "INSERT INTO penyewa (nama, no_wa, kamar_id, created_at) VALUES (?, ?, ?, datetime('now'))"
    ).run(nama, noWa ?? "", kamarId);

    // Update kamar ke terisi
    db.prepare("UPDATE kamar SET status = 'terisi' WHERE id = ?").run(kamarId);

    // Buat kontrak
    const kontrakResult = db.prepare(
      `INSERT INTO kontrak_sewa (penyewa_id, kamar_id, nominal, tanggal_masuk, tanggal_jatuh_tempo, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'aktif', datetime('now'))`
    ).run(penyewaResult.lastInsertRowid, kamarId, nominal, tanggalMasuk, jatuhTempo);
    const kontrakId = Number(kontrakResult.lastInsertRowid);

    // Buat tagihan pertama untuk bulan ini
    const periode = tanggalMasuk.slice(0, 7);
    db.prepare(
      `INSERT INTO tagihan (kontrak_id, periode, nominal, jatuh_tempo, status, created_at)
       VALUES (?, ?, ?, ?, 'belum_lunas', datetime('now'))`
    ).run(kontrakId, periode, nominal, jatuhTempo);

    // Catat deposit kalau ada
    if (deposit !== null && deposit > 0) {
      db.prepare(
        `INSERT INTO transaksi (kontrak_id, tipe, kategori, nominal, tanggal, keterangan, created_at)
         VALUES (?, 'pemasukan', 'deposit', ?, ?, ?, datetime('now'))`
      ).run(kontrakId, deposit, tanggalMasuk, `Deposit ${nama}`);
    }

    return kontrakId;
  });

  const kontrakId = insertAll();

  const waUrl = noWa
    ? `https://wa.me/${noWa}?text=${encodeURIComponent(
        `Halo ${nama}, selamat datang! Kontrak ${kamar.nomor} sudah aktif. Sewa bulanan ${formatRupiah(nominal)}. Jatuh tempo setiap tanggal ${new Date(tanggalMasuk).getDate()}. Terima kasih.`
      )}`
    : null;

  return NextResponse.json({ kontrakId, jatuhTempo, waUrl, kamarNomor: kamar.nomor }, { status: 201 });
}
