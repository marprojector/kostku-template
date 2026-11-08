import type {
  Kamar,
  KontrakSewa,
  Penyewa,
  Tagihan,
  Transaksi,
} from "./types";

export type { Kamar, KontrakSewa, Penyewa, Tagihan, Transaksi };

export interface RoomRow {
  kamar: Kamar;
  penyewa: Penyewa | null;
  kontrak: KontrakSewa | null;
}

export interface DashboardStats {
  okupansi: { total: number; terisi: number; tersedia: number; persen: number };
  kamar: Array<{ id: number; nomor: string; status: string; penyewa: string | null; penyewaId: number | null; harga: number; tagihanStatus: string | null; tagihanId: number | null }>;
  tagihan: { belumLunas: number; totalBelumLunas: number };
  jatuhTempo: TagihanDetail[];
  lewat: TagihanDetail[];
  arusKas: Array<{ bulan: string; label: string; pendapatan: number; pengeluaran: number }>;
  keuangan: {
    bulan: string;
    pendapatan: number;
    pendapatanSewa: number;
    pendapatanDeposit: number;
    bulanLalu: number;
    pengeluaran: number;
    pengeluaranBulanLalu: number;
    perKategori: Record<string, number>;
    laba: number;
    labaBulanLalu: number;
  };
}

export interface TagihanDetail extends Tagihan {
  nama_penyewa: string;
  no_wa: string;
  kamar_nomor: string;
}

export interface LaporanBulanan {
  periode: string;
  pendapatan: number;
  pendapatanSewa: number;
  pendapatanDeposit: number;
  pengeluaran: number;
  perKategori: Record<string, number>;
  laba: number;
  margin: number;
  bulanLalu: { pendapatan: number; pengeluaran: number; laba: number };
}

export interface LaporanTahunan {
  tahun: string;
  months: Array<{
    nama: string;
    short: string;
    pendapatan: number;
    pengeluaran: number;
    laba: number;
  }>;
  totalSewa: number;
  totalPgp: number;
  arusKas: number;
}

interface RawKamar {
  id: number;
  nomor: string;
  harga_sewa: number;
  status: string;
  created_at: string;
  kontrak_id: number | null;
  kontrak_nominal: number | null;
  tanggal_jatuh_tempo: string | null;
  penyewa_id: number | null;
  nama_penyewa: string | null;
  no_wa: string | null;
}

interface RawPenyewa {
  id: number;
  nama: string;
  no_wa: string;
  kamar_id: number | null;
  created_at: string;
}

interface RawKontrak {
  id: number;
  penyewa_id: number;
  kamar_id: number;
  nominal: number;
  tanggal_masuk: string;
  tanggal_jatuh_tempo: string;
  status: string;
  created_at: string;
}

interface RawTagihan {
  id: number;
  kontrak_id: number;
  periode: string;
  nominal: number;
  jatuh_tempo: string;
  status: string;
  tanggal_bayar: string | null;
  created_at: string;
  nama_penyewa: string;
  no_wa: string;
  kamar_nomor: string;
}

interface RawTransaksi {
  id: number;
  kontrak_id: number | null;
  tipe: string;
  kategori: string;
  nominal: number;
  tanggal: string;
  keterangan: string | null;
  created_at: string;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Request gagal (${res.status}) untuk ${url}`);
  return (await res.json()) as T;
}

export async function fetchKamar(): Promise<RoomRow[]> {
  const raw = await getJson<RawKamar[]>("/api/kamar");
  return raw.map((r) => ({
    kamar: {
      id: r.id,
      nomor: r.nomor,
      hargaSewa: r.harga_sewa,
      status: r.status === "terisi" ? "terisi" : "tersedia",
      createdAt: r.created_at,
    },
    penyewa:
      r.penyewa_id === null || r.nama_penyewa === null
        ? null
        : {
            id: r.penyewa_id,
            nama: r.nama_penyewa,
            kamarId: r.id,
            noWa: r.no_wa ?? "",
            createdAt: r.created_at,
          },
    kontrak:
      r.kontrak_id === null
        ? null
        : {
            id: r.kontrak_id,
            penyewaId: r.penyewa_id ?? 0,
            kamarId: r.id,
            nominal: r.kontrak_nominal ?? r.harga_sewa,
            tanggalMasuk: r.created_at,
            tanggalJatuhTempo: r.tanggal_jatuh_tempo ?? "",
            status: "aktif",
            createdAt: r.created_at,
          },
  }));
}

export async function fetchPenyewa(): Promise<Penyewa[]> {
  const raw = await getJson<RawPenyewa[]>("/api/penyewa");
  return raw.map((r) => ({
    id: r.id,
    nama: r.nama,
    kamarId: r.kamar_id,
    noWa: r.no_wa,
    createdAt: r.created_at,
  }));
}

export async function fetchKontrak(status?: string): Promise<KontrakSewa[]> {
  const raw = await getJson<RawKontrak[]>(
    status ? `/api/kontrak?status=${status}` : "/api/kontrak"
  );
  return raw.map((r) => ({
    id: r.id,
    penyewaId: r.penyewa_id,
    kamarId: r.kamar_id,
    nominal: r.nominal,
    tanggalMasuk: r.tanggal_masuk,
    tanggalJatuhTempo: r.tanggal_jatuh_tempo,
    status: r.status as KontrakSewa["status"],
    createdAt: r.created_at,
  }));
}

export async function fetchTagihan(params?: {
  periode?: string;
  status?: string;
  semua?: string;
}): Promise<TagihanDetail[]> {
  const qs = new URLSearchParams();
  if (params?.periode) qs.set("periode", params.periode);
  if (params?.status) qs.set("status", params.status);
  if (params?.semua) qs.set("semua", params.semua);
  const raw = await getJson<RawTagihan[]>(
    "/api/tagihan" + (qs.size > 0 ? `?${qs}` : "")
  );
  return raw.map((r) => ({
    id: r.id,
    kontrakId: r.kontrak_id,
    periode: r.periode,
    nominal: r.nominal,
    jatuhTempo: r.jatuh_tempo,
    status: r.status === "lunas" ? "lunas" : "belum_lunas",
    tanggalBayar: r.tanggal_bayar,
    createdAt: r.created_at,
    nama_penyewa: r.nama_penyewa,
    no_wa: r.no_wa,
    kamar_nomor: r.kamar_nomor,
  }));
}

export async function fetchTransaksi(params?: {
  bulan?: string;
  tipe?: string;
}): Promise<Transaksi[]> {
  const qs = new URLSearchParams();
  if (params?.bulan) qs.set("bulan", params.bulan);
  if (params?.tipe) qs.set("tipe", params.tipe);
  const raw = await getJson<RawTransaksi[]>(
    "/api/transaksi" + (qs.size > 0 ? `?${qs}` : "")
  );
  return raw.map((r) => ({
    id: r.id,
    kontrakId: r.kontrak_id,
    tipe: r.tipe as Transaksi["tipe"],
    kategori: r.kategori as Transaksi["kategori"],
    nominal: r.nominal,
    tanggal: r.tanggal,
    keterangan: r.keterangan ?? "",
    createdAt: r.created_at,
  }));
}

export async function fetchDashboard(tanggal?: string): Promise<DashboardStats> {
  const raw = await getJson<{
    okupansi: DashboardStats["okupansi"];
    kamar: DashboardStats["kamar"];
    tagihan: DashboardStats["tagihan"];
    jatuhTempo: RawTagihan[];
    lewat: RawTagihan[];
    arusKas: DashboardStats["arusKas"];
    keuangan: DashboardStats["keuangan"];
  }>("/api/dashboard" + (tanggal ? `?tanggal=${tanggal}` : ""));

  const mapTagihan = (r: RawTagihan): TagihanDetail => ({
    id: r.id,
    kontrakId: r.kontrak_id,
    periode: r.periode,
    nominal: r.nominal,
    jatuhTempo: r.jatuh_tempo,
    status: r.status === "lunas" ? "lunas" : "belum_lunas",
    tanggalBayar: r.tanggal_bayar,
    createdAt: r.created_at,
    nama_penyewa: r.nama_penyewa,
    no_wa: r.no_wa,
    kamar_nomor: r.kamar_nomor,
  });

  return {
    ...raw,
    jatuhTempo: raw.jatuhTempo.map(mapTagihan),
    lewat: raw.lewat.map(mapTagihan),
  };
}

export function fetchLaporanBulanan(periode: string): Promise<LaporanBulanan> {
  return getJson<LaporanBulanan>(`/api/laporan/bulanan?periode=${periode}`);
}

export function fetchLaporanTahunan(tahun: string): Promise<LaporanTahunan> {
  return getJson<LaporanTahunan>(`/api/laporan/tahunan?tahun=${tahun}`);
}

export async function checkIn(payload: {
  nama: string;
  noWa: string;
  kamarId: number;
  nominal: number;
  tanggalMasuk: string;
  deposit?: number;
}): Promise<{ kontrakId: number; jatuhTempo: string; waUrl: string | null; kamarNomor: string }> {
  const res = await fetch("/api/kontrak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Gagal membuat kontrak");
  return json;
}

export async function bayarTagihan(id: number) {
  const res = await fetch(`/api/tagihan/${id}/bayar`, { method: "PUT", headers: { "Content-Type": "application/json" } });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Gagal menandai lunas");
  return json;
}

export async function createKamar(payload: { nomor: string; hargaSewa: number }): Promise<{ ok: boolean; id: number }> {
  const res = await fetch("/api/kamar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Gagal menambah kamar");
  return json;
}

export async function updateKamar(
  id: number,
  payload: { nomor?: string; hargaSewa?: number }
): Promise<{ ok: boolean }> {
  const res = await fetch(`/api/kamar/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Gagal mengubah kamar");
  return json;
}

export async function perpanjangKontrak(
  id: number,
  tambahHari: number
): Promise<{ ok: boolean; kontrakId: number; jatuhTempoBaru: string }> {
  const res = await fetch(`/api/kontrak/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tambahHari }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Gagal memperpanjang kontrak");
  return json;
}

export async function deleteKamar(id: number): Promise<{ ok: boolean }> {
  const res = await fetch(`/api/kamar/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Gagal menghapus kamar");
  return json;
}

export async function checkoutKontrak(id: number): Promise<{ ok: boolean }> {
  const res = await fetch(`/api/kontrak/${id}/selesai`, { method: "POST" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Gagal check-out");
  return json;
}

export async function updatePenyewa(
  id: number,
  payload: { nama?: string; noWa?: string }
): Promise<{ ok: boolean }> {
  const res = await fetch(`/api/penyewa/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Gagal mengubah data penyewa");
  return json;
}

export async function logWhatsApp(payload: {
  penyewaId: number;
  pesan: string;
  waUrl: string;
}) {
  await fetch("/api/wa-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function formatRupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

export function waLink(noWa: string, pesan: string): string {
  return `https://wa.me/${noWa}?text=${encodeURIComponent(pesan)}`;
}

export interface PenyewaProfil {
  penyewa: { id: number; nama: string; no_wa: string; kamar_id: number | null; created_at: string };
  kontrak: Array<Record<string, unknown>>;
  tagihan: Array<Record<string, unknown>>;
  transaksi: Array<Record<string, unknown>>;
  waLog: Array<Record<string, unknown>>;
}

export function fetchPenyewaProfil(id: number): Promise<PenyewaProfil> {
  return getJson<PenyewaProfil>(`/api/penyewa/${id}`);
}

export async function generateTagihan(periode: string): Promise<{ ok: boolean; periode: string; dibuat: number; dilewati: number }> {
  const res = await fetch("/api/tagihan/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ periode }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Gagal generate tagihan");
  return json;
}
