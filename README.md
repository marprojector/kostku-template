# KostKu — Template Manajemen Kos

Template aplikasi manajemen kos: kamar, penyewa, kontrak sewa, tagihan bulanan, pengeluaran, laporan keuangan, dan pengingat WhatsApp. Dibuat oleh [Ammar](https://github.com/marprojector).

Template ini self-hosted: setiap instalasi punya database sendiri dan **satu akun owner** yang dibuat lewat halaman registrasi saat pertama kali dibuka.

## Fitur

- Peta kamar dengan status okupansi dan status bayar.
- Check-in penyewa, kontrak, perpanjangan, dan check-out.
- Generate tagihan bulanan per kontrak aktif.
- Pembayaran satu tagihan atau sekaligus; transaksi pemasukan otomatis.
- Tunggakan, jatuh tempo, dan riwayat kontrak selesai.
- Pengeluaran operasional dan kategori otomatis/manual.
- Laporan bulanan/tahunan dan arus kas.
- Pengingat WhatsApp via deep link `wa.me`.
- PWA (manifest + ikon), tema terang/gelap, tampilan desktop & ponsel.
- Autentikasi owner berbasis database (password di-hash dengan scrypt).

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · shadcn-style components · SQLite (`better-sqlite3`) · `jose` (JWT).

## Menjalankan lokal

Prasyarat: Node.js 22+.

```bash
npm ci
cp .env.example .env.local
# isi AUTH_SECRET (minimal 32 karakter):
openssl rand -base64 32
npm run dev
```

Buka `http://localhost:3000`. Karena database masih kosong, halaman menampilkan **registrasi owner pertama**. Isi nama pemilik, nama kos, email, dan password. Setelah akun pertama dibuat, registrasi otomatis ditutup dan halaman berubah menjadi login.

Database default: `./kostku.db` (bisa diubah lewat `KOSTKU_DB_PATH`).

Ingin data contoh (6 kamar + beberapa transaksi)? Set `SEED_DATABASE=true` sebelum pertama kali menjalankan aplikasi.

## Autentikasi

- Akun disimpan di tabel `users`; password memakai `scrypt` + salt acak.
- Hanya ada satu role: `owner`. Akun pertama menjadi owner; setelah itu endpoint registrasi menolak akun baru.
- Sesi berupa JWT `HttpOnly` di cookie `kostku_token` (7 hari) dan diverifikasi di proxy untuk semua `/api/*`.
- `AUTH_SECRET` wajib minimal 32 karakter. Jangan pernah commit `.env.local`/`.env.production`.

## Environment

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `AUTH_SECRET` | ya | Minimal 32 karakter acak untuk menandatangani JWT. |
| `KOSTKU_DB_PATH` | tidak | Lokasi database. Default `./kostku.db`. |
| `KOSTKU_BACKUP_DIR` | tidak | Folder backup. Default `./backups`. |
| `SEED_DATABASE` | tidak | `true` untuk seed data demo. Default `false`. |
| `TRUST_PROXY` | tidak | Penanda deployment di balik reverse proxy. |

Tidak ada `OWNER_USERNAME`/`OWNER_PASSWORD`; kredensial owner dibuat lewat registrasi.

## Script

```bash
npm run dev        # development
npm run build      # typecheck + build produksi
npm run start      # jalankan hasil build
npm run lint
npm run typecheck
npm test           # node:test + tsx
npm run backup     # backup SQLite (integrity check + retensi)
```

## Deploy

### Docker Compose

```bash
cp .env.production.example .env.production
# isi AUTH_SECRET
chmod 600 .env.production
docker compose up -d --build
```

Compose membuka port hanya di `127.0.0.1:3000`; taruh reverse proxy TLS di depannya. Healthcheck memakai `GET /api/auth/me` (401 tanpa cookie). Setelah aplikasi hidup, buka domain dan daftarkan owner pertama.

### systemd

Lihat [`deploy/README.md`](deploy/README.md) dan [`deploy/kostku.service`](deploy/kostku.service). Unit sudah memakai `NODE_ENV=production`, `TZ=Asia/Makassar`, database di `/var/lib/kostku`, dan backup di `/var/backups/kostku`.

### Zona waktu

Aplikasi memakai tanggal lokal server untuk tagihan/pembayaran. Docker, Compose, dan systemd sudah menyetel `TZ=Asia/Makassar`; sesuaikan bila lokasi kos Anda berbeda.

## Backup & restore

```bash
KOSTKU_BACKUP_DIR=/var/backups/kostku npm run backup
```

Script melakukan checkpoint WAL, memakai SQLite online backup, menjalankan `integrity_check`, dan menyimpan maksimal 14 backup. Simpan salinan backup di storage terpisah dan uji restore secara berkala.

Restore: hentikan aplikasi, simpan database lama, ganti dengan backup yang sudah diverifikasi, hapus `-wal`/`-shm` lama bila ada, lalu jalankan ulang.

## Keamanan

- Semua `/api/*` dilindungi JWT kecuali login/registrasi/status/me/logout.
- `Cache-Control: no-store` untuk seluruh API.
- Rate limit per IP+endpoint; login dibatasi 10 percobaan/menit, registrasi 5/menit.
- Validasi JSON, ID, nominal, tanggal, dan key pengaturan.
- Header keamanan (`nosniff`, `DENY`, referrer policy, permissions policy).
- SQLite single-instance (WAL, foreign keys, busy timeout). Jangan scale horizontal.

Untuk produksi: gunakan HTTPS, batasi akses jaringan, amankan `.env.production`, backup off-host, dan pasang monitoring. Kehilangan password owner saat ini harus direset manual di database (fitur reset password belum disediakan).

## Struktur singkat

```
src/app/api/            # auth, kamar, kontrak, tagihan, transaksi, laporan
src/components/         # Shell, LoginGate, halaman, komponen UI
src/lib/                # db, password, seed, format, security, api client
src/proxy.ts            # proteksi /api/*
tests/                  # unit test (format, security, db, password, auth)
```

## Catatan template

- Database tidak disertakan di repository; setiap pengguna membuat database sendiri.
- Ganti nama kos/pemilik lewat halaman **Pengaturan** setelah registrasi.
- Kredit pembuat: **Ammar** (dapat diubah/dihapus saat memakai template ini, mohon pertahankan atribusi bila memungkinkan).
- Untuk versi khusus KostKu milik Anda, gunakan branch/repo terpisah dari template ini.
