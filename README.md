# KostKu

Dashboard manajemen kos untuk **Kos Perajin** (6 kamar). Mengelola kamar, penyewa, kontrak sewa, tagihan bulanan, pengeluaran, dan laporan keuangan — dengan pengingat tagihan lewat WhatsApp.

Dokumen produk lengkap: [`PRD.md`](./PRD.md).

## Stack

| Lapisan | Teknologi |
|---------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Bahasa | TypeScript (strict) |
| Database | SQLite via `better-sqlite3` (WAL) |
| Auth | JWT HS256 di cookie httpOnly (`jose`) |
| Styling | CSS variables + inline style, tema terang/gelap |

## Menjalankan

```bash
npm install
cp .env.example .env.local   # isi AUTH_SECRET, OWNER_EMAIL, OWNER_PASSWORD
npm run dev                  # http://localhost:3000
```

Database `kostku.db` dibuat dan di-seed otomatis pada request pertama (6 kamar kosong, transaksi contoh — penyewa diisi lewat Check-In).

Produksi:

```bash
npm run build
npm run start
```

> `better-sqlite3` adalah modul native — pastikan `npm rebuild better-sqlite3` dijalankan pada arsitektur target (mis. server Linux) setelah instalasi.

## Kredensial

Login memakai `OWNER_EMAIL` / `OWNER_PASSWORD` dari environment. Default pengembangan ada di `.env.example`; **wajib diganti sebelum production**.

## Struktur

```
src/
├── app/
│   ├── page.tsx              # entry: LoginGate → Shell
│   ├── layout.tsx            # metadata + font
│   ├── globals.css           # token tema, tabel, form, layout
│   └── api/
│       ├── auth/{login,logout,me}/
│       ├── dashboard/        # agregat KPI
│       ├── kamar/            # list + [id] edit
│       ├── kontrak/          # list + create + [id]/selesai
│       ├── tagihan/          # list + [id]/bayar
│       ├── transaksi/        # list + create
│       ├── laporan/{bulanan,tahunan}/
│       ├── pengaturan/       # GET + PUT?key=
│       ├── penyewa/
│       └── wa-log/           # riwayat pengiriman WhatsApp
├── components/
│   ├── Shell.tsx             # sidebar, header, tema, logout
│   ├── LoginGate.tsx         # gate autentikasi
│   ├── nav.tsx               # konfigurasi menu + ikon SVG
│   ├── ui.tsx                # Card, Stat, Badge, Button, dll
│   └── pages/                # 9 halaman
├── lib/
│   ├── api.ts                # client HTTP + mapper snake→camel
│   ├── db.ts                 # koneksi + skema SQLite
│   ├── seed.ts               # data awal
│   ├── format.ts             # Rupiah, tanggal Indonesia
│   ├── types.ts              # tipe domain
│   ├── useApi.ts             # fetch hook (loading/error/reload)
│   └── useTheme.ts           # tema terang/gelap persisten
└── middleware.ts             # proteksi seluruh /api/*
```

## Halaman

| Halaman | Fungsi |
|---------|--------|
| Menu Utama | Okupansi, KPI keuangan, jatuh tempo, tunggakan dengan aksi cepat |
| Database Kamar | Daftar kamar, filter status, pencarian, tombol WhatsApp |
| Check-In Penyewa | Form kontrak baru → membuat penyewa, kontrak, tagihan pertama, deposit |
| Tagihan & WhatsApp | Daftar tagihan, filter status, tandai lunas, kirim pengingat |
| Tunggakan & Masa Sewa | Tagihan lewat tempo + kontrak berakhir bulan ini |
| Riwayat Transaksi | Log pemasukan/pengeluaran per bulan & tipe |
| Laporan Bulanan | Pendapatan, pengeluaran per kategori, laba, margin, vs bulan lalu |
| Laporan Tahunan | Arus kas 12 bulan + tabel rincian |
| Pengaturan | Identitas kos + kategori pengeluaran |

## API

Semua endpoint `/api/*` dilindungi JWT cookie kecuali `auth/login`, `auth/logout`, `auth/me`.

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET/POST | `/api/kamar` | List kamar (join penyewa & kontrak aktif) |
| PUT | `/api/kamar/:id` | Ubah nomor/harga/status kamar |
| GET | `/api/penyewa` | List penyewa |
| GET/POST | `/api/kontrak` | List; POST = check-in (buat kontrak + tagihan + deposit) |
| POST | `/api/kontrak/:id/selesai` | Check-out; kamar jadi tersedia |
| GET | `/api/tagihan` | List tagihan (filter `periode`, `status`) |
| PUT | `/api/tagihan/:id/bayar` | Tandai lunas + catat pemasukan |
| GET/POST | `/api/transaksi` | List (filter `bulan`, `tipe`); POST catat transaksi |
| GET | `/api/dashboard` | Agregat okupansi, tagihan, keuangan |
| GET | `/api/laporan/bulanan?periode=YYYY-MM` | Laporan bulanan |
| GET | `/api/laporan/tahunan?tahun=YYYY` | Laporan tahunan |
| GET/PUT | `/api/pengaturan` | Semua setting; PUT `?key=` ubah satu |
| GET/POST | `/api/wa-log` | Riwayat pengiriman WhatsApp |
| POST | `/api/auth/login` | Set cookie sesi (7 hari) |
| POST | `/api/auth/logout` | Hapus cookie |
| GET | `/api/auth/me` | Cek status sesi |

## Catatan produksi

- `AUTH_SECRET` wajib diganti; default hanya untuk pengembangan.
- `kostku.db` sudah masuk `.gitignore` — backup berkala file ini (plus `-wal`/`-shm`) untuk keamanan data.
- WhatsApp memakai deep link `wa.me` (tanpa API berbayar); pengiriman bulk dilakukan satu per satu.
- Belum ada multi-user, payment gateway, atau portal penyewa (lihat §16 PRD).
### Production hardening

Runtime protections included:

- Production refuses the development JWT fallback; `AUTH_SECRET`, `OWNER_EMAIL`, and `OWNER_PASSWORD` are required.
- Login requests are rate-limited per IP on a single-server deployment.
- JSON mutation requests, IDs, money fields, dates, and setting keys are validated.
- Check-in runs in one SQLite transaction; payment and checkout reject duplicate/inactive operations.
- Production does not seed sample data unless `SEED_DATABASE=true` is explicitly set.
- Security headers are emitted by Next.js. Put the app behind HTTPS; the app port is not a TLS endpoint.
- SQLite uses WAL, foreign keys, a busy timeout, and a configurable `KOSTKU_DB_PATH`.

### Production deployment

1. Create a dedicated application user and a persistent data directory. Do not run as root.
2. Create a production env file outside Git:

   ```bash
   cp .env.example .env.production
   openssl rand -base64 32
   chmod 600 .env.production
   ```

   Set a unique `AUTH_SECRET` (at least 32 random characters), a non-default owner email/password, `NODE_ENV=production`, and `SEED_DATABASE=false`.
3. Install on the target architecture and rebuild the native SQLite module:

   ```bash
   npm ci
   npm run rebuild-native
   npm run lint
   npm run typecheck
   npm run build
   ```

4. Start one application instance. SQLite is intentionally single-writer/local-storage; do not scale this deployment horizontally:

   ```bash
   PORT=3000 npm run start
   ```

   For a standalone Docker image, the image uses `node server.js` from `.next/standalone`; do not run `next start` inside that image.

   ```bash
   PORT=3000 npm run start
   ```

   For Docker, use `docker compose up -d --build`. The compose file persists `/app/data` and `/app/backups` and runs as a non-root user. For systemd, install `deploy/kostku.service`, adjust paths/user, then run `systemctl enable --now kostku`.
5. Terminate TLS at Nginx, Caddy, or an AWS load balancer. Forward only to localhost/private port 3000. Add HSTS at the TLS terminator after HTTPS is confirmed.
6. Check health and auth from the deployment host:

   ```bash
   curl -i https://your-host.example/api/auth/me       # expected 401 without cookie
   curl -i https://your-host.example/                 # expected 200
   ```

### Backup and restore

Run the included backup command at least daily, with the backup directory on separate durable storage:

```bash
KOSTKU_BACKUP_DIR=/var/backups/kostku npm run backup
```

The script checkpoints WAL, uses SQLite's online backup API, runs `integrity_check`, applies mode `0600`, and retains 14 backups by default. Copy backups off-host (object storage or a separate volume) and encrypt them at rest. Test restore regularly:

```bash
cp /var/backups/kostku/kostku-<timestamp>.db /var/lib/kostku/restore-test.db
sqlite3 /var/lib/kostku/restore-test.db 'PRAGMA integrity_check;'
```

For an actual restore: stop the app, preserve the current database, replace `kostku.db` with the verified backup, remove stale `-wal`/`-shm` files if present, set ownership/permissions, then start the app and verify login plus row counts.

### Release gate

Before each release, REQUIRED:

```bash
npm ci
npm run rebuild-native
npm run lint
npm run typecheck
npm run build
npm run backup
```

Then smoke-test login, dashboard, check-in, payment, checkout, transaction creation, settings update, logout, and unauthenticated API rejection. DNS, TLS certificates, secret storage, off-host backups, host firewall, monitoring, and alerting remain deployment-operator responsibilities; they cannot be completed inside this repository.
