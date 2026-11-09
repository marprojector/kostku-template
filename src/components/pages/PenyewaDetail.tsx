"use client";

import { useState } from "react";
import { Badge, Button, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { fetchPenyewaProfil, formatRupiah, waLink, perpanjangKontrak, updatePenyewa, checkoutKontrak, type PenyewaProfil } from "@/lib/api";
import { selisihHari, tanggalPendek, tampilWa } from "@/lib/format";
import { useApi } from "@/lib/useApi";

interface Props {
  penyewaId: number;
  onBack: () => void;
}

export function PenyewaDetail({ penyewaId, onBack }: Props) {
  const { data, loading, error, reload } = useApi<PenyewaProfil>(() => fetchPenyewaProfil(penyewaId));
  const [tambahHari, setTambahHari] = useState("30");
  const [perpanjangErr, setPerpanjangErr] = useState<string | null>(null);
  const [perpanjangOk, setPerpanjangOk] = useState<string | null>(null);
  const [savingPerpanjang, setSavingPerpanjang] = useState(false);
  const [editingKontak, setEditingKontak] = useState(false);
  const [editNama, setEditNama] = useState("");
  const [editWa, setEditWa] = useState("");
  const [kontakErr, setKontakErr] = useState<string | null>(null);
  const [savingKontak, setSavingKontak] = useState(false);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);
  const [savingCheckout, setSavingCheckout] = useState(false);

  function mulaiEditKontak() {
    setEditNama(penyewaNama);
    setEditWa(penyewaWa);
    setKontakErr(null);
    setEditingKontak(true);
  }

  async function simpanKontak() {
    if (!editNama.trim()) {
      setKontakErr("Nama wajib diisi.");
      return;
    }
    setSavingKontak(true);
    setKontakErr(null);
    try {
      await updatePenyewa(penyewaId, { nama: editNama.trim(), noWa: editWa.trim() });
      setEditingKontak(false);
      reload();
    } catch (err) {
      setKontakErr(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSavingKontak(false);
    }
  }

  async function handleCheckout() {
    if (!kontrakAktif) return;
    if (!window.confirm(`Check-out penyewa ini dari ${kamarAktif}? Kamar akan jadi tersedia.`)) return;
    setSavingCheckout(true);
    setCheckoutErr(null);
    try {
      await checkoutKontrak(kontrakAktif.id as number);
      reload();
    } catch (err) {
      setCheckoutErr(err instanceof Error ? err.message : "Gagal check-out");
    } finally {
      setSavingCheckout(false);
    }
  }

  async function handlePerpanjang(kontrakId: number) {
    const hari = Number(tambahHari);
    if (!Number.isSafeInteger(hari) || hari <= 0) {
      setPerpanjangErr("Jumlah hari harus angka lebih dari 0.");
      return;
    }
    setSavingPerpanjang(true);
    setPerpanjangErr(null);
    setPerpanjangOk(null);
    try {
      const res = await perpanjangKontrak(kontrakId, hari);
      setPerpanjangOk(`Masa sewa diperpanjang ${hari} hari — jatuh tempo baru ${tanggalPendek(res.jatuhTempoBaru)}`);
      reload();
    } catch (err) {
      setPerpanjangErr(err instanceof Error ? err.message : "Gagal memperpanjang kontrak");
    } finally {
      setSavingPerpanjang(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Profil Penyewa" />
        <Card><div style={{ padding: 20, display: "grid", gap: 10 }}>{[0,1,2,3,4].map(i => <Skeleton key={i} height={20} />)}</div></Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Profil Penyewa" />
        <EmptyState>{error ?? "Gagal memuat profil penyewa"}</EmptyState>
      </div>
    );
  }

  const { penyewa, kontrak, tagihan, transaksi, waLog } = data;

  const penyewaNama = penyewa.nama as string;
  const penyewaWa = tampilWa((penyewa.no_wa as string) ?? "");

  const kontrakAktif = kontrak.find((k) => {
    const s = k.status as string;
    return s === "aktif";
  });
  const kamarAktif = kontrakAktif ? (kontrakAktif.kamar_nomor as string ?? "—") : "—";
  const nominalAktif = kontrakAktif ? (kontrakAktif.nominal as number) : 0;

  async function handleWhatsApp(wa: string, msg: string) {
    if (!wa) return;
    try {
      const { logWhatsApp } = await import("@/lib/api");
      await logWhatsApp({ penyewaId, pesan: msg, waUrl: waLink(wa, msg) });
      reload();
    } catch {
      // tetap buka WA meskipun logging gagal
    }
    window.open(waLink(wa, msg), "_blank");
  }

  const mapTransaksi = (rows: Array<Record<string, unknown>>) =>
    rows.length === 0 ? (
      <EmptyState>Belum ada transaksi</EmptyState>
    ) : (
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <table style={{ width: "100%", minWidth: 520, borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Tipe</th>
            <th style={{ textAlign: "right" }}>Nominal</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const tipe = t.tipe as string;
            return (
              <tr key={t.id as number}>
                <td>{tanggalPendek(t.tanggal as string)}</td>
                <td>
                  <Badge tone={tipe === "pemasukan" ? "success" : "neutral"}>
                    {tipe === "pemasukan" ? "Masuk" : "Keluar"}
                  </Badge>
                </td>
                <td className="tnum" style={{ textAlign: "right", fontWeight: 600 }}>
                  {formatRupiah(t.nominal as number)}
                </td>
                <td style={{ color: "var(--text-muted)" }}>{(t.keterangan as string) ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    );

  return (
    <div>
      <PageHeader
        title={penyewaNama}
        sub={`ID Penyewa #${penyewa.id}`}
        actions={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={onBack}>Kembali</Button>
            <Button variant="primary" onClick={() => {
              const msg = `Halo ${penyewaNama}, ada yang bisa kami bantu?`;
              handleWhatsApp(penyewaWa, msg);
            }}>
              Kirim WhatsApp
            </Button>
            {kontrakAktif && (
              <Button variant="danger" onClick={handleCheckout} disabled={savingCheckout}>
                {savingCheckout ? "Memproses…" : "Check-Out"}
              </Button>
            )}
          </div>
        }
      />

      {/* Info kontak */}
      <Card style={{ marginBottom: 16 }}>
        {editingKontak ? (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="grid-2">
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Nama</div>
                <input value={editNama} onChange={(e) => setEditNama(e.target.value)} aria-label="Nama penyewa" />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Nomor WhatsApp</div>
                <input value={editWa} onChange={(e) => setEditWa(e.target.value)} placeholder="08…" inputMode="numeric" aria-label="Nomor WhatsApp penyewa" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
              <Button size="sm" variant="primary" onClick={simpanKontak} disabled={savingKontak}>
                {savingKontak ? "Menyimpan…" : "Simpan"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setEditingKontak(false)}>Batal</Button>
              {kontakErr && <span role="alert" style={{ fontSize: 12.5, color: "var(--danger)" }}>{kontakErr}</span>}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Nomor WhatsApp</div>
                <div style={{ fontWeight: 600 }}>{penyewaWa || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Kamar Aktif</div>
                <div style={{ fontWeight: 600 }}>{kamarAktif}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Sewa/Bulan</div>
                <div className="tnum" style={{ fontWeight: 600 }}>{nominalAktif > 0 ? formatRupiah(nominalAktif) : "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Terdaftar</div>
                <div style={{ fontWeight: 600 }}>{tanggalPendek(penyewa.created_at as string)}</div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Button size="sm" variant="secondary" onClick={mulaiEditKontak}>Edit Kontak</Button>
            </div>
          </div>
        )}
        {checkoutErr && <div role="alert" style={{ marginTop: 10, fontSize: 13, color: "var(--danger)" }}>{checkoutErr}</div>}
      </Card>

      {/* Riwayat kontrak */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--foreground)" }}>Riwayat Kontrak</div>
        {kontrak.length === 0 ? (
          <EmptyState>Tidak ada riwayat kontrak</EmptyState>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", minWidth: 520, borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th>Kamar</th>
                <th>Tanggal Masuk</th>
                <th>Jatuh Tempo</th>
                <th style={{ textAlign: "right" }}>Nominal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {kontrak.map((k) => {
                const status = k.status as string;
                const statusBadge = status === "aktif" ? "success" : status === "selesai" ? "neutral" : "warning";
                return (
                  <tr key={k.id as number}>
                    <td style={{ fontWeight: 600 }}>{k.kamar_nomor as string}</td>
                    <td>{tanggalPendek(k.tanggal_masuk as string)}</td>
                    <td>{k.tanggal_jatuh_tempo ? tanggalPendek(k.tanggal_jatuh_tempo as string) : "—"}</td>
                    <td className="tnum" style={{ textAlign: "right" }}>{formatRupiah(k.nominal as number)}</td>
                    <td><Badge tone={statusBadge}>{status === "aktif" ? "Aktif" : status === "selesai" ? "Selesai" : "Pending"}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}

        {kontrakAktif && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Perpanjang Masa Sewa</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  border: "1px solid var(--input)",
                  borderRadius: "var(--radius-shadcn, 8px)",
                  overflow: "hidden",
                  background: "var(--card)",
                }}
              >
                <button
                  type="button"
                  aria-label="Kurangi hari"
                  onClick={() => setTambahHari((v) => String(Math.max(1, (parseInt(v, 10) || 0) - 1)))}
                  style={{
                    width: 30,
                    height: 34,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--muted-foreground)",
                  }}
                >
                  −
                </button>
                <input
                  value={tambahHari}
                  onChange={(e) => setTambahHari(e.target.value.replace(/[^\d]/g, ""))}
                  inputMode="numeric"
                  aria-label="Tambah hari sewa"
                  style={{
                    width: 56,
                    border: "none",
                    textAlign: "center",
                    fontWeight: 600,
                    background: "transparent",
                    boxShadow: "none",
                    padding: "6px 0",
                  }}
                />
                <button
                  type="button"
                  aria-label="Tambah hari"
                  onClick={() => setTambahHari((v) => String((parseInt(v, 10) || 0) + 1))}
                  style={{
                    width: 30,
                    height: 34,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--muted-foreground)",
                  }}
                >
                  +
                </button>
              </div>
              <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>hari</span>
              <Button size="sm" variant="primary" onClick={() => handlePerpanjang(kontrakAktif.id as number)} disabled={savingPerpanjang}>
                {savingPerpanjang ? "Memproses…" : "Perpanjang"}
              </Button>
              {perpanjangOk && <span style={{ fontSize: 12.5, color: "var(--success)" }}>{perpanjangOk}</span>}
              {perpanjangErr && <span role="alert" style={{ fontSize: 12.5, color: "var(--danger)" }}>{perpanjangErr}</span>}
            </div>
          </div>
        )}
      </Card>

      {/* Riwayat tagihan */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Riwayat Tagihan</h3>
        {tagihan.length === 0 ? (
          <EmptyState>Belum ada tagihan</EmptyState>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", minWidth: 520, borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th>Periode</th>
                <th style={{ textAlign: "right" }}>Nominal</th>
                <th>Jatuh Tempo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tagihan.map((t) => {
                const lunas = (t.status as string) === "lunas";
                const hari = selisihHari(t.jatuh_tempo as string);
                const tone = lunas ? "success" : hari < 0 ? "danger" : hari <= 3 ? "warning" : "neutral";
                return (
                  <tr key={t.id as number}>
                    <td style={{ fontWeight: 600 }}>{t.periode as string}</td>
                    <td className="tnum" style={{ textAlign: "right" }}>{formatRupiah(t.nominal as number)}</td>
                    <td>{tanggalPendek(t.jatuh_tempo as string)}</td>
                    <td><Badge tone={tone}>{lunas ? "Lunas" : `Lewat ${Math.abs(hari)} hari`}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </Card>

      {/* Transaksi */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Riwayat Transaksi</h3>
        {mapTransaksi(transaksi)}
      </Card>

      {/* WA log */}
      {waLog.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Riwayat Pesan WhatsApp</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {waLog.map((w) => (
              <div key={w.id as number} style={{ fontSize: 12.5, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{tanggalPendek(w.sent_at as string)}</div>
                <div>{w.pesan as string}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
