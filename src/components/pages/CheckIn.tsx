"use client";

import { useState } from "react";
import { Badge, Button, Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { checkIn, fetchKamar, formatRupiah, type RoomRow } from "@/lib/api";
import { useTanggalIni } from "@/lib/useNow";
import { useApi } from "@/lib/useApi";
const fieldStyle = { marginBottom: 14 } as const;
const labelStyle = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--text-muted)",
  marginBottom: 5,
} as const;

export function CheckIn() {
  const { data, loading, reload } = useApi<RoomRow[]>(() => fetchKamar());
  const tanggalIni = useTanggalIni();
  const [nama, setNama] = useState("");
  const [noWa, setNoWa] = useState("");
  const [kamarId, setKamarId] = useState<number | "">("");
  const [nominal, setNominal] = useState("");
  const [tanggalMasuk, setTanggalMasuk] = useState(tanggalIni);
  const [deposit, setDeposit] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ kamarNomor: string; waUrl: string | null; jatuhTempo: string } | null>(null);

  const kamarKosong = (data ?? []).filter((r) => r.kamar.status === "tersedia");

  function pilihKamar(id: number) {
    setKamarId(id);
    const row = kamarKosong.find((r) => r.kamar.id === id);
    if (row) setNominal(String(row.kamar.hargaSewa));
  }

  function reset() {
    setNama("");
    setNoWa("");
    setKamarId("");
    setNominal("");
    setDeposit("");
    setTanggalMasuk(tanggalIni);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nama.trim() || !kamarId || !nominal || !tanggalMasuk) {
      setError("Nama, kamar, nominal, dan tanggal masuk wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await checkIn({
        nama: nama.trim(),
        noWa: noWa.trim(),
        kamarId: Number(kamarId),
        nominal: Number(nominal),
        tanggalMasuk,
        deposit: deposit ? Number(deposit) : undefined,
      });
      setResult({
        kamarNomor: res.kamarNomor,
        waUrl: res.waUrl,
        jatuhTempo: res.jatuhTempo,
      });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan kontrak");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const kamar = (data ?? []).find((r) => r.kamar.id === Number(kamarId));
    return (
      <div>
        <PageHeader title="Check-In Penyewa" />
        <Card>
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: "var(--success-bg)",
                color: "var(--success)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                marginBottom: 12,
              }}
              aria-hidden="true"
            >
              ✓
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Kontrak berhasil dibuat</div>
            <div style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.7 }}>
              {nama} — {kamar?.kamar.nomor ?? "kamar"}<br />
              Sewa {formatRupiah(Number(nominal))}/bulan<br />
              Jatuh tempo berikutnya {result.jatuhTempo}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18 }}>
              {result.waUrl && (
                <a href={result.waUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <Button variant="success">Kirim WhatsApp Selamat Datang</Button>
                </a>
              )}
              <Button variant="secondary" onClick={() => { setResult(null); reset(); }}>
                Check-in Lagi
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Check-In Penyewa" sub="Buat kontrak sewa dan tagihan pertama sekaligus" />

      {loading ? (
        <Card><EmptyState>Memuat data kamar…</EmptyState></Card>
      ) : kamarKosong.length === 0 ? (
        <Card>
          <EmptyState>Semua kamar terisi. Kosongkan satu kamar dulu untuk check-in baru.</EmptyState>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }} className="grid-2">
          <Card>
            <SectionTitle>Data Penyewa</SectionTitle>
            <form onSubmit={submit}>
              <div style={fieldStyle}>
                <label htmlFor="ci-nama" style={labelStyle}>Nama lengkap *</label>
                <input id="ci-nama" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama penyewa" required />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="ci-wa" style={labelStyle}>Nomor WhatsApp</label>
                <input id="ci-wa" value={noWa} onChange={(e) => setNoWa(e.target.value)} placeholder="628xxxxxxxxxx" inputMode="numeric" />
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>
                  Format internasional tanpa tanda +, dipakai untuk tombol kirim tagihan.
                </div>
              </div>

              <div style={fieldStyle}>
                <label htmlFor="ci-kamar" style={labelStyle}>Kamar *</label>
                <select
                  id="ci-kamar"
                  value={kamarId}
                  onChange={(e) => pilihKamar(Number(e.target.value))}
                  required
                >
                  <option value="">Pilih kamar tersedia…</option>
                  {kamarKosong.map((r) => (
                    <option key={r.kamar.id} value={r.kamar.id}>
                      {r.kamar.nomor} — {formatRupiah(r.kamar.hargaSewa)}/bulan
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={fieldStyle}>
                  <label htmlFor="ci-nominal" style={labelStyle}>Nominal bulanan *</label>
                  <input
                    id="ci-nominal"
                    type="number"
                    min={0}
                    value={nominal}
                    onChange={(e) => setNominal(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
                <div style={fieldStyle}>
                  <label htmlFor="ci-deposit" style={labelStyle}>Deposit</label>
                  <input
                    id="ci-deposit"
                    type="number"
                    min={0}
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    placeholder="Opsional"
                  />
                </div>
              </div>

              <div style={fieldStyle}>
                <label htmlFor="ci-tanggal" style={labelStyle}>Tanggal masuk</label>
                <input
                  id="ci-tanggal"
                  type="date"
                  value={tanggalMasuk}
                  onChange={(e) => setTanggalMasuk(e.target.value)}
                />
              </div>

              {error && (
                <div
                  role="alert"
                  style={{
                    background: "var(--danger-bg)",
                    color: "var(--danger)",
                    padding: "9px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    marginBottom: 12,
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? "Menyimpan…" : "Konfirmasi Check-In"}
                </Button>
                <Button variant="secondary" onClick={reset} disabled={submitting}>
                  Reset
                </Button>
              </div>
            </form>
          </Card>

          <div>
            <Card style={{ marginBottom: 16 }}>
              <SectionTitle sub="Yang akan dibuat otomatis">Ringkasan</SectionTitle>
              <div style={{ fontSize: 13, lineHeight: 1.9, color: "var(--text-muted)" }}>
                <div>• Kontrak aktif berdurasi bulanan</div>
                <div>• Tagihan pertama untuk periode ini</div>
                <div>• Status kamar menjadi terisi</div>
                <div>• Deposit tercatat sebagai pemasukan</div>
              </div>
            </Card>

            <Card>
              <SectionTitle>Kamar Tersedia</SectionTitle>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {kamarKosong.map((r) => (
                  <Badge key={r.kamar.id} tone="primary">
                    {r.kamar.nomor}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
