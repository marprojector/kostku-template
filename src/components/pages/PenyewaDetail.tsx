"use client";

import { Badge, Button, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { fetchPenyewaProfil, formatRupiah, waLink, type PenyewaProfil } from "@/lib/api";
import { selisihHari, tanggalPendek } from "@/lib/format";
import { useApi } from "@/lib/useApi";

interface Props {
  penyewaId: number;
  onBack: () => void;
}

export function PenyewaDetail({ penyewaId, onBack }: Props) {
  const { data, loading, error, reload } = useApi<PenyewaProfil>(() => fetchPenyewaProfil(penyewaId));

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
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
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
    );

  return (
    <div>
      <PageHeader
        title={penyewa.nama as string}
        sub={`ID Penyewa #${penyewa.id}`}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={onBack}>Kembali</Button>
            <Button variant="primary" onClick={() => {
              const msg = `Halo ${penyewa.nama}, ada yang bisa kami bantu?`;
              handleWhatsApp(penyewa.no_wa as string, msg);
            }}>
              Kirim WhatsApp
            </Button>
          </div>
        }
      />

      {/* Info kontak */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Nomor WhatsApp</div>
            <div style={{ fontWeight: 600 }}>{penyewa.no_wa ?? "—"}</div>
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
      </Card>

      {/* Riwayat kontrak */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Riwayat Kontrak</h3>
        {kontrak.length === 0 ? (
          <EmptyState>Tidak ada riwayat kontrak</EmptyState>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
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
        )}
      </Card>

      {/* Riwayat tagihan */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Riwayat Tagihan</h3>
        {tagihan.length === 0 ? (
          <EmptyState>Belum ada tagihan</EmptyState>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
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
