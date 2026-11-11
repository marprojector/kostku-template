# PRD — KostKu: Template Website Manajemen Kos

> Versi: 2.0 (lengkap) | Tanggal: 6 November 2026 | Author: Ammar
> Basis: reverse-engineering 4 screenshot aplikasi kos existing

---

## 1. Overview

### 1.1 Tujuan Produk
Platform web untuk mengelola kos. Fungsi utama:
- Monitoring okupansi & keuangan real-time
- Manajemen kamar & penyewa
- Pengingat tagihan otomatis via WhatsApp
- Laporan keuangan bulanan & tahunan

### 1.2 Problem Statement
Pengelolaan kos saat ini masih manual (spreadsheet/notes), menyebabkan:
- Sulit track tunggakan & jatuh tempo
- Reporting keuangan manual & error-prone
- Tidak ada notifikasi otomatis ke penyewa
- Kesulitan monitoring okupansi per bulan

### 1.3 Target Users
- **Primary:** Owner kos — untuk management daily
- **Secondary:** Penyewa kos — untuk melihat tagihan & histori

---

## 2. Design Language

### 2.1 Visual Style
- **Theme:** Professional, clean, modern dashboard
- **Vibe:** Mirip aplikasi mobile yang sekarang dipakai (bukan generic dashboard)
- **Primary Color:** Indigo (#4f46e5) sebagai placeholder — ganti kalau sudah ada brand color fix

### 2.2 Typography
- Font: System font (San Francisco / Inter)
- Heading: Bold, sizing jelas
- Body: Regular, readable

### 2.3 Layout
- **Sidebar navigation** (kiri) — tetap, collapsible di mobile
- **Main content area** (kanan) — scrollable
- **Top bar** — tanggal sekarang, quick search
- **Responsive:** Mobile-first (kos owner sering cek dari HP)

---

## 3. Page Breakdown

### 3.1 Sidebar / Navigation Menu

```
□ Menu Utama
□ Dashboard
□ Input Data
□ + Input Sewa / Check-In
□ Database (kamar + penyewa)
□ Riwayat Transaksi
□ Laporan Bulanan
□ Laporan Tahunan
□ Tunggakan & Masa Sewa
□ WhatsApp Tagihan
□ Pengaturan
  • Gaji
  • Listrik
  • WiFi / Internet
  • Perlengkapan Operasional
  • Setup Aplikasi Mobile
□ Maintenance
□ Sistem
  • Sinkron Data
  • Konfirmasi
```

> Catatan: Menu "Sistem" dan "Konfirmasi" perlu klarifikasi fungsinya.

---

### 3.2 Page 1: Menu Utama (Home)

```
┌─────────────────────────────────────────┐
│ [Logo/Brand]           Jumat, 6 Nov 2026│
├────────┬────────────────────────────────┤
│        │  [Search: Cari penyewa / kamar]│
│  Menu  ├────────────────────────────────┤
│  ----  │  ┌─────────┐ ┌─────────┐       │
│  Main  │  │  Okupansi│ │ Kamar  │       │
│  Menu  │  │   57%   │ │12/21   │       │
│        │  │ 12 Aktif│ │ 9 Tersedia│     │
│        │  └─────────┘ └─────────┘       │
│        ├────────────────────────────────┤
│        │  Pendapatan   Pengeluaran      │
│        │  Bulanan      Bulanan          │
│        │  Rp 13.815.000 Rp 3.500.000   │
│        │  vs Okt       vs Okt           │
│        │  (Rp 15.175.000)(Rp 4.100.000)│
│        ├────────────────────────────────┤
│        │  Jatuh Tempo Nov 2026          │
│        │  • 5 Nov 2026 — Kamar ...      │
│        │  • 8 Nov 2026 — Kamar ...      │
│        │  • Jatuh tempo 1 Des 2026     │
│        │  • Jatuh tempo 2 Des 2026      │
│        ├────────────────────────────────┤
│        │  Tunggakan                     │
│        │  • Bayu Setiawan — Kamar 8     │
│        │    Belum Lunas (Lewat 22 hari)  │
│        │  • Hendra Gunawan — Kamar 10   │
│        │    Belum Lunas                  │
│        │  [Kirim WhatsApp Tagihan]       │
└────────┴────────────────────────────────┘
```

---

### 3.3 Page 2: Dashboard

**Stats Cards (atas):**
- **Kamar Terisi:** 12
- **Kamar Tersedia:** 9
- **Total Kamar:** 21
- **Okupansi:** 57%

**Pendapatan Bulanan:**
- Nilai: Rp 13.815.000
- Breakdown: Sewa Rp 10.315.000 + Deposit Ditahan Rp 3.500.000
- vs Oktober: Rp 15.175.000

**Pengeluaran Bulanan:**
- Nilai: Rp 3.500.000
- Breakdown per kategori dari Pengaturan
- vs Oktober: Rp 4.100.000

**Laba Bersih Bulanan:**
- Nilai: Rp 10.315.000
- vs Oktober: Rp 11.075.000

**Jumlah Sewa Bulanan:** Rp 8.000.000
**Total Belum Tertagih:** Rp 1.500.000 (43%)

**Quick Actions:**
- Q+ Sewa / Check-In
- C Sinkron Data
- WA WhatsApp Tagihan

---

### 3.4 Page 3: Database (Daftar Kamar & Penyewa)

**Filter/Sort:**
- Q Cari penyewa / kamar...
- Filter: Semua (21) / Terisi (12) / Tersedia (9)

**Table columns:**
| Kamar | Nama Penyewa | Harga Sewa | Status |
|-------|-------------|-----------|--------|
| Kamar 1 | Nurul Aini | Rp 650.000/bln | Terisi |
| Kamar 2 | Rizky Ramadhan | Rp 650.000/bln | Terisi |
| Kamar 3 | Fajar Hidayat | Rp 750.000/bln | Terisi |
| Kamar 4 | Dewi Sartika | Rp 800.000/bln | Terisi |
| Kamar 5 | Aditya Nugraha | Rp 800.000/bln | Terisi |
| Kamar 6 | Eko Prasetyo | Rp 800.000/bln | Terisi |
| Kamar 7 | Rina Marlina | Rp 800.000/bln | Terisi |
| Kamar 8 | Bayu Setiawan | Rp 850.000/bln | Terisi |
| Kamar 9 | Putri Ayu Lestari | Rp 850.000/bln | Terisi |
| Kamar 10 | Hendra Gunawan | Rp 850.000/bln | Terisi |
| Kamar 11 | Tri Wahyuni | Rp 850.000/bln | Terisi |
| Kamar 12 | - | - | Tersedia |
| Kamar 13 | - | - | Tersedia |
| ... | ... | ... | ... |

**Rentang harga sewa:**
- Rp 650.000/bln (kamar 1-3)
- Rp 750.000/bln (kamar 4+)
- Ada kontrak dengan tanggal mulai & selesai (s/d 1 Nov 2027, s/d 9 Nov 2026, dll)

**Aksi per row:**
- Kirim WhatsApp
- Edit
- View Detail

---

### 3.5 Page 4: Input Sewa / Check-In

**Form fields:**
- **Nama Penyewa:** Text input
- **Kamar:** Dropdown / picker
- **Nominal Tagihan:** Number input (Rp)
- **Tanggal Masuk:** Date picker
- **Durasi:** Dropdown (Bulanan)
- **Deposit:** Number input (optional)
- **Status:** Radio (Lunas / Belum Lunas)

**Kontrak sewa:**
- Tampilkan tanggal jatuh tempo
- Kontrak berjalan
- Habis sewa bulan ini (highlight)

**Actions:**
- Konfirmasi
- Kirim WhatsApp

---

### 3.6 Page 5: Tagihan & Jatuh Tempo

**Table:**
| Kamar | Nama | Nominal | Jatuh Tempo | Status |
|-------|------|---------|-------------|--------|
| 8 | Bayu Setiawan | Rp 850.000 | 8 Nov 2026 | Belum Lunas |
| 9 | Putri Ayu Lestari | Rp 850.000 | 9 Nov 2026 | Belum Lunas |
| 7 | Rina Marlina | Rp 800.000 | 2 Des 2026 | 2 hari lagi |
| ... | ... | ... | ... | ... |

**Status tags:**
- ✅ Lunas — hijau
- ⚠️ Belum Lunas — merah
- ⏰ X hari lagi — kuning

**Bulk actions:**
- Kirim WhatsApp (all)
- Filter by status

---

### 3.7 Page 6: Laporan Bulanan

**Periode:** November 2026 (dropdown bulan/tahun)

**Summary:**
- Pendapatan: Rp 13.815.000
- Pengeluaran: Rp 3.500.000
- Laba Bersih: Rp 10.315.000
- Margin: 64.4%

**Breakdown pie/bar chart:**
- Pendapatan breakdown: Sewa + Deposit Ditahan
- Pengeluaran breakdown: Listrik + WiFi + Gaji + Perlengkapan

**vs Oktober comparison:**
- Pendapatan turun 9.0%
- Pengeluaran turun 14.6%
- Laba turun 6.9%

---

### 3.8 Page 7: Laporan Tahunan

**Periode:** 2026 (Januari — Desember)

**Summary:**
- Akumulasi 12 bulan
- Total Sewa 2026: Rp 29.740.000
- Arus Kas 12 Bulan: Rp 19.160.000

**Chart:**
- Line/bar chart monthly dari Jan–Des 2026
- Kas Masuk vs Pengeluaran
- Akumulasi

**Monthly breakdown table:**
| Bulan | Pendapatan | Pengeluaran | Laba Bersih |
|-------|-----------|-------------|-------------|
| Jan | ... | ... | ... |
| Feb | ... | ... | ... |
| ... | ... | ... | ... |
| Nov | Rp 13.815.000 | Rp 3.500.000 | Rp 10.315.000 |

---

### 3.9 Page 8: Tunggakan & Masa Sewa

**Tunggakan List:**
- Nama, Kamar, Nominal, Hari lewat

**Masa Sewa / Kontrak:**
- Habis sewa bulan ini (Nov 2026)
- Habis Bln Ini
- Kontrak sewa berjalan
- Deposit Ditahan

---

### 3.10 Page 9: WhatsApp Tagihan

**Fitur:**
- Auto-generate pesan tagihan
- Kirim via WhatsApp API / wa.me link
- Template pesan customizable
- Log pengiriman

---

### 3.11 Page 10: Pengaturan

**Sub-menu:**
- Gaji — expense category
- Listrik — expense category
- WiFi / Internet — expense category
- Perlengkapan Operasional — expense category
- Laporan Bulanan — configuration
- Setup Aplikasi Mobile — link/notes
- Pengembalian Deposit

---

## 4. Data Model

### 4.1 Kamar
```
Kamar {
  id: int
  nomor: string ("Kamar 1")
  harga_sewa: int (Rp)
  status: enum (tersedia, terisi)
  created_at: timestamp
}
```

### 4.2 Penyewa
```
Penyewa {
  id: int
  nama: string
  kamar_id: int (FK)
  no_wa: string
  created_at: timestamp
}
```

### 4.3 Kontrak Sewa
```
KontrakSewa {
  id: int
  penyewa_id: int (FK)
  kamar_id: int (FK)
  nominal: int (Rp)
  tanggal_masuk: date
  tanggal_jatuh_tempo: date
  status: enum (aktif, selesai, expired)
  created_at: timestamp
}
```

### 4.4 Transaksi
```
Transaksi {
  id: int
  kontrak_id: int (FK)
  type: enum (pemasukan, pengeluaran)
  kategori: enum (sewa, deposit, listrik, wifi, gaji, perlengkapan)
  nominal: int (Rp)
  tanggal: date
  keterangan: string
  created_at: timestamp
}
```

### 4.5 Pengaturan
```
Pengaturan {
  id: int
  key: string
  value: string/number
}
```

---

## 5. Tech Stack

### 5.1 Recommended Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend:** Next.js API Routes atau Bun API
- **Database:** SQLite (local/simple) atau Supabase (gratis tier, sync-friendly)
- **Auth:** Basic (single user, local storage / simple login)
- **Hosting:** Vercel (gratis) atau Railway

### 5.2 Alternative Stack (If Simpler)
- **Single HTML file:** Vanilla JS + LocalStorage (offline-first)
- **Pros:** Instant deploy, no backend, offline-capable
- **Cons:** No multi-device sync

### 5.3 WhatsApp Integration
- wa.me deep link (free, no API cost)
- Atau Twilio WhatsApp API (paid, programmable)

---

## 6. Roadmap

### Phase 1 — MVP (1-2 minggu)
- [ ] Setup project (Next.js + Tailwind)
- [ ] Database schema (Kamar, Penyewa, Kontrak, Transaksi)
- [ ] CRUD Kamar & Penyewa
- [ ] Dashboard dengan stats cards
- [ ] Input Sewa / Check-In
- [ ] View daftar kamar dengan filter

### Phase 2 — Keuangan (1 minggu)
- [ ] Logging transaksi (pemasukan & pengeluaran)
- [ ] Laporan Bulanan
- [ ] Laporan Tahunan
- [ ] Chart (Chart.js atau Recharts)

### Phase 3 — Automasi (1 minggu)
- [ ] WhatsApp deep link generation
- [ ] Auto-reminder jatuh tempo
- [ ] Tagihan status tracking

### Phase 4 — Polish (ongoing)
- [ ] Mobile responsive
- [ ] Dark mode
- [ ] Data export (CSV/PDF)
- [ ] Multi-user (kalau needed)

---

## 7. Open Questions

1. **Hosting preference?** Vercel gratis, tapi data lokal. Atau mau cloud sync?
2. **WhatsApp integration level?** Deep link aja (free), atau WhatsApp API (bayar)?
3. **Data migration?** Ada data existing yang perlu di-migrate dari Excel/app sekarang?
4. **Multi-device?** Apakah perlu bisa buka dari HP + PC gleichzeitig dengan data sama?
5. **Branding:** Ada logo/brand color yang sudah fixed?
6. **Menu "Sistem" & "Konfirmasi"** — apa fungsinya? Perlu clarify sebelum building.

---

*PRD ini dibuat berdasarkan reverse-engineering screenshot aplikasi existing. Detail harga, nama, dan data adalah contoh dari screenshot asli.*

---

## 8. User Stories & Acceptance Criteria

### US-01: Melihat ringkasan okupansi
- **Sebagai** owner, **saya ingin** melihat persentase okupansi, jumlah kamar terisi/tersedia di satu layar, **sehingga** saya tahu kondisi kos saat ini tanpa menghitung manual.
- **AC:**
  - Kartu "Okupansi" menampilkan persen (57%), terisi (12), tersedia (9), total (21).
  - Angka berubah otomatis setiap ada perubahan status kamar.
  - Progress bar visual mendampingi angka.

### US-02: Mencatat penyewa baru (check-in)
- **Sebagai** owner, **saya ingin** menginput penyewa baru beserta kamar, harga, tanggal masuk, dan deposit, **sehingga** kontrak tercatat dan tagihan mulai dihasilkan.
- **AC:**
  - Form Input Sewa punya field: nama, kamar (dropdown kamar kosong aja), nominal, tanggal masuk, durasi (bulanan), deposit (opsional), status awal.
  - Kamar terpilih otomatis berubah status jadi "terisi".
  - Kontrak aktif dibuat dengan jatuh tempo = tanggal masuk + 1 bulan.
  - "Konfirmasi" menyimpan data; "Kirim WhatsApp" membuka wa.me dengan pesan selamat datang.
  - Validasi: nama wajib, kamar wajib, nominal > 0, tidak dobel-book kamar.

### US-03: Melihat & memproses tagihan jatuh tempo
- **Sebagai** owner, **saya ingin** daftar tagihan jatuh tempo beserta statusnya (lunas / belum lunas / lewat X hari), **sehingga** saya bisa follow-up cepat.
- **AC:**
  - Tabel: kamar, nama, nominal, jatuh tempo, status.
  - Warna status: hijau=lunas, kuning=X hari lagi, merah=lewat/tempo.
  - Badge "Lewat 22 hari" untuk tunggakan lama.
  - Filter status dan pencarian nama/kamar berfungsi.
  - Tombol "Kirim WhatsApp" per baris membuka wa.me dengan template terisi (nama, kamar, nominal, jatuh tempo).

### US-04: Mengirim pengingat WhatsApp massal
- **Sebagai** owner, **saya ingin** mengirim pengingat ke semua penyewa belum lunas dalam satu aksi, **sehingga** tidak perlu chat satu per satu.
- **AC:**
  - Halaman "WhatsApp Tagihan" merangkum semua penyewa belum lunas.
  - Tombol "Kirim ke Semua" membuka wa.me berurutan per penyewa (wa.me tidak dukung bulk API).
  - Template pesan bisa diedit dan tersimpan.
  - Riwayat pengiriman tercatat (tanggal, penyewa, status).

### US-05: Melihat laporan keuangan bulanan
- **Sebagai** owner, **saya ingin** laporan bulanan: pendapatan, pengeluaran, laba bersih, dan perbandingan vs bulan sebelumnya, **sehingga** saya bisa evaluasi performa kos.
- **AC:**
  - Dropdown periode bulan/tahun.
  - Kartu ringkasan: Pendapatan, Pengeluaran, Laba Bersih, Margin %.
  - Breakdown pendapatan (sewa vs deposit) dan pengeluaran per kategori.
  - Perbandingan vs bulan lalu dengan indikator naik/turun %.
  - Grafik batang untuk visualisasi.

### US-06: Melihat laporan tahunan
- **Sebagai** owner, **saya ingin** akumulasi 12 bulan (arus kas, total sewa, grafik per bulan), **sehingga** saya bisa rencanakan tahun depan.
- **AC:**
  - Grafik garis/batang Jan-Des.
  - Tabel breakdown per bulan.
  - Kartu ringkasan: Total Sewa, Arus Kas, Akumulasi.

### US-07: Mengelola database kamar & penyewa
- **Sebagai** owner, **saya ingin** CRUD kamar dan penyewa di satu halaman, **sehingga** data selalu up-to-date.
- **AC:**
  - Tabel semua kamar (21) dengan filter Semua/Terisi/Tersedia.
  - Pencarian instan by nama atau nomor kamar.
  - Edit kamar (nomor, harga, status).
  - Edit penyewa (nama, no WA).
  - Hapus penyewa dengan konfirmasi; kamar otomatis jadi tersedia.

### US-08: Mencatat pengeluaran operasional
- **Sebagai** owner, **saya ingin** mencatat pengeluaran per kategori, **sehingga** laporan laba rugi akurat.
- **AC:**
  - Form input: tanggal, kategori, nominal, keterangan.
  - Kategori dapat ditambah/diubah di Pengaturan.
  - Riwayat transaksi dapat difilter per bulan & kategori.

### US-09: Melihat tunggakan & kontrak habis
- **Sebagai** owner, **saya ingin** daftar tunggakan dan kontrak yang habis bulan ini, **sehingga** tidak ada pendapatan yang bocor.
- **AC:**
  - Daftar penyewa belum lunas + jumlah hari lewat.
  - Daftar kontrak yang berakhir bulan ini dengan highlight.
  - Deposit ditahan ditampilkan terpisah.

### US-10: Autentikasi owner
- **Sebagai** owner, **saya ingin** login sederhana, **sehingga** data keuangan tidak terbaca orang lain.
- **AC:**
  - Login email/password (single user).
  - Session token aman (httpOnly cookie).
  - Logout berfungsi.

---

## 9. Functional Requirements (FR)

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-01 | Dashboard stats okupansi, pendapatan, pengeluaran, laba | Must |
| FR-02 | CRUD Kamar | Must |
| FR-03 | CRUD Penyewa | Must |
| FR-04 | CRUD Kontrak Sewa | Must |
| FR-05 | Input Sewa / Check-In flow | Must |
| FR-06 | Generate tagihan bulanan otomatis dari kontrak | Must |
| FR-07 | Tracking status pembayaran (lunas/belum) | Must |
| FR-08 | Kalkulasi tunggakan & hari lewat | Must |
| FR-09 | Laporan Bulanan dengan breakdown & vs bulan lalu | Must |
| FR-10 | Laporan Tahunan dengan chart 12 bulan | Must |
| FR-11 | Integrasi wa.me deep link dengan template pesan | Must |
| FR-12 | Kategori pengeluaran configurable | Should |
| FR-13 | Riwayat transaksi lengkap | Must |
| FR-14 | Pencarian global (penyewa/kamar) | Should |
| FR-15 | Export CSV laporan | Could |
| FR-16 | Notifikasi in-app jatuh tempo dekat | Could |
| FR-17 | Multi-property (beberapa kos, satu akun) | Won't (v1) |
| FR-18 | Portal penyewa (lihat tagihan sendiri) | Won't (v1) |

---

## 10. Non-Functional Requirements (NFR)

| ID | Requirement |
|----|-------------|
| NFR-01 | Load time < 2 detik di koneksi 3G |
| NFR-02 | Mobile-first: layar 360px ke atas tetap usable |
| NFR-03 | Semua nilai uang diformat Rupiah (locale id-ID) |
| NFR-04 | Tanggal & hari dalam Bahasa Indonesia |
| NFR-05 | Data persisten, tidak hilang saat refresh |
| NFR-06 | Tidak ada kebocoran data ke pihak ketiga |
| NFR-07 | Backup data otomatis harian (jika cloud) |
| NFR-08 | Akses hanya owner (auth), tanpa multi-tenant di v1 |

---

## 11. API Design (REST)

Base: 

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | /kamar | List kamar (filter: status, q) |
| POST | /kamar | Tambah kamar |
| PUT | /kamar/:id | Edit kamar |
| DELETE | /kamar/:id | Hapus kamar |
| GET | /penyewa | List penyewa |
| POST | /penyewa | Tambah penyewa |
| PUT | /penyewa/:id | Edit penyewa |
| DELETE | /penyewa/:id | Hapus penyewa |
| GET | /kontrak | List kontrak (filter: status) |
| POST | /kontrak | Buat kontrak (check-in) |
| PUT | /kontrak/:id | Edit kontrak |
| POST | /kontrak/:id/selesai | Akhiri kontrak (check-out) |
| GET | /tagihan | List tagihan (filter: periode, status) |
| POST | /tagihan/generate | Generate tagihan bulan depan |
| PUT | /tagihan/:id/bayar | Tandai lunas |
| GET | /transaksi | List transaksi (filter: bulan, kategori, tipe) |
| POST | /transaksi | Catat transaksi |
| DELETE | /transaksi/:id | Hapus transaksi |
| GET | /laporan/bulanan?periode=YYYY-MM | Data laporan bulanan |
| GET | /laporan/tahunan?tahun=YYYY | Data laporan tahunan |
| GET | /pengaturan | Ambil semua pengaturan |
| PUT | /pengaturan/:key | Ubah pengaturan |
| POST | /auth/login | Login owner |
| POST | /auth/logout | Logout |

Contoh payload :


Response :


---

## 12. Database Schema (SQLite)



---

## 13. Success Metrics

| Metric | Target |
|--------|--------|
| Waktu input penyewa baru | < 2 menit |
| Waktu kirim pengingat ke 1 penyewa | < 30 detik |
| Akurasi laporan (selisih vs hitung manual) | 0% |
| Bulan pertama tanpa tunggakan terlewat | 100% tagihan ter-monitor |
| Retensi pemakaian mingguan owner | >= 3x/minggu |

---

## 14. Risks & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| wa.me tidak dukung bulk API | Pengingat massal manual per orang | Iterasi link satu per satu; v2 pertimbangkan WhatsApp Business API |
| Kehilangan data (hosting gratis) | Data keuangan hilang | Backup otomatis + export CSV berkala |
| Salah input nominal | Laporan salah | Konfirmasi sebelum simpan + edit tersedia |
| Browser lama di HP owner | UI rusak | Target evergreen browser; test Chrome/Safari mobile |
| Deposit tidak ter-track | Kerugian saat check-out | Field deposit wajib + kartu "Deposit Ditahan" di dashboard |

---

## 15. Milestone & Timeline

| Milestone | Durasi | Deliverable |
|-----------|--------|-------------|
| M1: Fondasi | Minggu 1 | Project setup, DB, auth, layout sidebar |
| M2: Core CRUD | Minggu 2 | Kamar, Penyewa, Kontrak, Input Sewa |
| M3: Tagihan | Minggu 3 | Generate tagihan, status, tunggakan |
| M4: Laporan | Minggu 4 | Laporan bulanan + tahunan + chart |
| M5: WhatsApp | Minggu 5 | Template + wa.me + riwayat kirim |
| M6: Polish | Minggu 6 | Responsive fine-tune, export CSV, deployment |

---

## 16. Out of Scope (v1)

- Aplikasi mobile native (iOS/Android)
- Portal/login untuk penyewa
- Pembayaran online (payment gateway)
- Multi-property management
- AI/ML forecasting
- Bahasa selain Indonesia

---

*PRD ini dibuat berdasarkan reverse-engineering screenshot aplikasi kos yang sedang dipakai. Nama, harga, dan angka adalah data contoh dari screenshot asli.*
