export type KamarStatus = 'tersedia' | 'terisi';

export interface Kamar {
  id: number;
  nomor: string; // "Kamar 1"
  hargaSewa: number; // dalam Rupiah
  status: KamarStatus;
  createdAt: string; // ISO
}

export interface Penyewa {
  id: number;
  nama: string;
  kamarId: number | null;
  noWa: string;
  createdAt: string;
}

export type KontrakStatus = 'aktif' | 'selesai' | 'expired';

export interface KontrakSewa {
  id: number;
  penyewaId: number;
  kamarId: number;
  nominal: number;
  tanggalMasuk: string; // ISO date
  tanggalJatuhTempo: string; // ISO date
  status: KontrakStatus;
  createdAt: string;
}

export type TipeTransaksi = 'pemasukan' | 'pengeluaran';
export type KategoriPemasukan = 'sewa' | 'deposit';
export type KategoriPengeluaran = 'listrik' | 'wifi' | 'gaji' | 'perlengkapan' | 'maintenance' | 'lainnya';
export type KategoriTransaksi = KategoriPemasukan | KategoriPengeluaran;

export interface Transaksi {
  id: number;
  kontrakId: number | null;
  tipe: TipeTransaksi;
  kategori: KategoriTransaksi;
  nominal: number;
  tanggal: string; // ISO date
  keterangan: string;
  createdAt: string;
}

export type StatusPembayaran = 'lunas' | 'belum_lunas';

export interface Tagihan {
  id: number;
  kontrakId: number;
  periode: string; // "2026-11"
  nominal: number;
  jatuhTempo: string; // ISO date
  status: StatusPembayaran;
  tanggalBayar: string | null;
  createdAt: string;
}
