export interface KategoriItem {
  nama: string;
  harga: number;
  mode: "manual" | "otomatis";
}

/** Normalisasi nilai kategori (lama: array string; baru: array objek) → array objek. */
export function normalizeKategori(raw: unknown): KategoriItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): KategoriItem | null => {
      if (typeof item === "string") {
        const nama = item.trim();
        return nama ? { nama, harga: 0, mode: "manual" } : null;
      }
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const nama = typeof o.nama === "string" ? o.nama.trim() : "";
        if (!nama) return null;
        const harga = typeof o.harga === "number" && Number.isSafeInteger(o.harga) && o.harga >= 0 ? o.harga : 0;
        const mode = o.mode === "otomatis" ? "otomatis" : "manual";
        return { nama, harga, mode };
      }
      return null;
    })
    .filter((k): k is KategoriItem => k !== null);
}

/** Baca kategori mentah dari settings (sudah di-parse). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readKategoriRaw(db: { prepare: (sql: string) => any }): unknown {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'kategori_pengeluaran'").get() as { value: string } | undefined;
  if (!row) return [];
  try {
    return JSON.parse(row.value) as unknown;
  } catch {
    return [];
  }
}
