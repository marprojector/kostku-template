export const BULAN_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const BULAN_ID_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export const HARI_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function formatRupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

export function formatRupiahShort(n: number): string {
  if (n >= 1_000_000) return "Rp " + (n / 1_000_000).toFixed(1).replace(".0", "") + " Jt";
  if (n >= 1_000) return "Rp " + (n / 1_000).toFixed(0) + " Rb";
  return formatRupiah(n);
}

export function tanggalPanjang(d: string | Date): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.getDate() + " " + BULAN_ID[dt.getMonth()] + " " + dt.getFullYear();
}

export function tanggalPendek(d: string | Date): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.getDate() + " " + BULAN_ID_SHORT[dt.getMonth()] + " " + dt.getFullYear();
}

export function hariIniPanjang(d: Date = new Date()): string {
  return HARI_ID[d.getDay()] + ", " + d.getDate() + " " + BULAN_ID[d.getMonth()] + " " + d.getFullYear();
}

export function selisihHari(tanggal: string, dari: Date = new Date()): number {
  const target = new Date(tanggal);
  const a = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const b = new Date(dari.getFullYear(), dari.getMonth(), dari.getDate());
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

export function labelJatuhTempo(hari: number): string {
  if (hari === 0) return "Hari ini";
  if (hari > 0) return `${hari} hari lagi`;
  return `Lewat ${Math.abs(hari)} hari`;
}

/** Normalisasi nomor WhatsApp: terima 08… atau 62…, hasil selalu 62… untuk wa.me */
export function normalisasiWa(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}

/** Kebalikan normalisasiWa: 62… → 08… untuk ditampilkan ke user */
export function tampilWa(noWa: string): string {
  const digits = noWa.replace(/\D/g, "");
  if (digits.startsWith("62")) return "0" + digits.slice(2);
  return digits;
}

export function waLink(noWa: string, pesan: string): string {
  return `https://wa.me/${normalisasiWa(noWa)}?text=${encodeURIComponent(pesan)}`;
}

/** ISO date (YYYY-MM-DD) timezone lokal — bukan UTC */
export function isoDate(d: Date = new Date()): string {
  return d.toLocaleDateString("sv-SE");
}

/** YYYY-MM timezone lokal */
export function isoPeriode(d: Date = new Date()): string {
  return d.toLocaleDateString("sv-SE").slice(0, 7);
}
