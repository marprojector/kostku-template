import test from "node:test";
import assert from "node:assert/strict";

import {
  BULAN_ID,
  BULAN_ID_SHORT,
  HARI_ID,
  formatRupiah,
  formatRupiahShort,
  tanggalPanjang,
  tanggalPendek,
  hariIniPanjang,
  selisihHari,
  labelJatuhTempo,
  normalisasiWa,
  tampilWa,
  waLink,
  isoDate,
  isoPeriode,
} from "../src/lib/format";

test("konstanta bulan dan hari lengkap", () => {
  assert.equal(BULAN_ID.length, 12);
  assert.equal(BULAN_ID_SHORT.length, 12);
  assert.equal(HARI_ID.length, 7);
  assert.equal(BULAN_ID[0], "Januari");
  assert.equal(BULAN_ID[11], "Desember");
  assert.equal(BULAN_ID_SHORT[7], "Agu");
  assert.equal(HARI_ID[0], "Minggu");
  assert.equal(HARI_ID[6], "Sabtu");
});

test("formatRupiah memakai pemisah ribuan id-ID", () => {
  assert.equal(formatRupiah(0), "Rp 0");
  assert.equal(formatRupiah(999), "Rp 999");
  assert.equal(formatRupiah(1_500_000), "Rp 1.500.000");
  assert.equal(formatRupiah(-250_000), "Rp -250.000");
});

test("formatRupiahShort memilih satuan Jt / Rb / rupiah penuh", () => {
  assert.equal(formatRupiahShort(1_500_000), "Rp 1.5 Jt");
  assert.equal(formatRupiahShort(1_000_000), "Rp 1 Jt");
  assert.equal(formatRupiahShort(750_000), "Rp 750 Rb");
  assert.equal(formatRupiahShort(999), "Rp 999");
});

test("tanggalPanjang dan tanggalPendek memakai nama bulan Indonesia", () => {
  assert.equal(tanggalPanjang(new Date(2026, 10, 5)), "5 November 2026");
  assert.equal(tanggalPendek(new Date(2026, 0, 9)), "9 Jan 2026");
  // string ISO juga diterima
  assert.equal(tanggalPanjang("2026-03-01T10:00:00"), "1 Maret 2026");
});

test("hariIniPanjang menggabungkan nama hari dan tanggal", () => {
  // 10 November 2026 adalah hari Selasa
  assert.equal(hariIniPanjang(new Date(2026, 10, 10)), "Selasa, 10 November 2026");
});

test("selisihHari menghitung selisih hari kalender lokal", () => {
  const dari = new Date(2026, 10, 10, 23, 30);
  assert.equal(selisihHari("2026-11-15", dari), 5);
  assert.equal(selisihHari("2026-11-05", dari), -5);
  assert.equal(selisihHari("2026-11-10", dari), 0);
});

test("labelJatuhTempo memformat hari ini, akan datang, dan lewat", () => {
  assert.equal(labelJatuhTempo(0), "Hari ini");
  assert.equal(labelJatuhTempo(3), "3 hari lagi");
  assert.equal(labelJatuhTempo(-2), "Lewat 2 hari");
});

test("normalisasiWa menghasilkan format 62…", () => {
  assert.equal(normalisasiWa("0812-3456-7890"), "6281234567890");
  assert.equal(normalisasiWa("+62 812 3456 7890"), "6281234567890");
  assert.equal(normalisasiWa("6281234567890"), "6281234567890");
});

test("tampilWa mengembalikan format 08…", () => {
  assert.equal(tampilWa("6281234567890"), "081234567890");
  assert.equal(tampilWa("08123"), "08123");
});

test("waLink menormalisasi nomor dan meng-encode pesan", () => {
  assert.equal(
    waLink("0812-3456-7890", "Halo kak, bayar ya"),
    "https://wa.me/6281234567890?text=Halo%20kak%2C%20bayar%20ya"
  );
});

test("isoDate / isoPeriode memakai tanggal lokal, bukan UTC", () => {
  assert.equal(isoDate(new Date(2026, 10, 5)), "2026-11-05");
  assert.equal(isoPeriode(new Date(2026, 10, 5)), "2026-11");
  // 31 Des 2025 23:30 lokal tetap 2025, walau UTC sudah 2026
  assert.equal(isoDate(new Date(2025, 11, 31, 23, 30)), "2025-12-31");
  assert.equal(isoPeriode(new Date(2025, 11, 31, 23, 30)), "2025-12");
});
