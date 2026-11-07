"use client";

import { useMemo } from "react";
import { Badge, Button, Card, EmptyState, PageHeader, SectionTitle, Skeleton } from "@/components/ui";
import { bayarTagihan, fetchKontrak, fetchTagihan, formatRupiah, waLink, type TagihanDetail } from "@/lib/api";
import { labelJatuhTempo, selisihHari, tanggalPendek } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { useState } from "react";

const EMPTY_TAGIHAN: TagihanDetail[] = [];

export function Tunggakan() {
  const tagihan = useApi<TagihanDetail[]>(() => fetchTagihan({ status: "belum_lunas" }));
  const kontrak = useApi(() => fetchKontrak("aktif"));
  const [busy, setBusy] = useState<number | null>(null);
  const belumLunas = tagihan.data ?? EMPTY_TAGIHAN;

  const { lewat, akanJatuhTempo } = useMemo(() => {
    const lewatList: TagihanDetail[] = [];
    const akanList: TagihanDetail[] = [];
    for (const t of belumLunas) {
      (selisihHari(t.jatuhTempo) < 0 ? lewatList : akanList).push(t);
    }
    lewatList.sort((a, b) => selisihHari(a.jatuhTempo) - selisihHari(b.jatuhTempo));
    akanList.sort((a, b) => selisihHari(a.jatuhTempo) - selisihHari(b.jatuhTempo));
    return { lewat: lewatList, akanJatuhTempo: akanList };
  }, [belumLunas]);

  const totalLewat = lewat.reduce((s, t) => s + t.nominal, 0);

  // Kontrak yang jatuh tempo bulan ini
  const d = new Date();
  const bulanIni = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const kontrakHabisBulanIni = (kontrak.data ?? []).filter((k) =>
    k.tanggalJatuhTempo.startsWith(bulanIni)
  );

  async function handleBayar(id: number) {
    setBusy(id);
    try {
      await bayarTagihan(id);
      tagihan.reload();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Tunggakan & Masa Sewa"
        sub={lewat.length > 0 ? `${lewat.length} tunggakan senilai ${formatRupiah(totalLewat)}` : "Tidak ada tunggakan"}
      />

      <Card style={{ marginBottom: 16 }}>
        <SectionTitle sub="Melewati tanggal jatuh tempo">Tunggakan</SectionTitle>
        {tagihan.loading ? (
          <div style={{ display: "grid", gap: 10 }}>
            {[0, 1, 2].map((i) => <Skeleton key={i} height={20} />)}
          </div>
        ) : tagihan.error ? (
          <EmptyState>Gagal memuat: {tagihan.error}</EmptyState>
        ) : lewat.length === 0 ? (
          <EmptyState>Tidak ada tunggakan</EmptyState>
        ) : (
          lewat.map((t) => {
            const hari = Math.abs(selisihHari(t.jatuhTempo));
            const pesan = `Halo ${t.nama_penyewa}, tagihan ${formatRupiah(t.nominal)} untuk ${t.kamar_nomor} sudah lewat ${hari} hari. Mohon segera dibayarkan. Terima kasih.`;
            return (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "11px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                    {t.nama_penyewa} — {t.kamar_nomor}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Jatuh tempo {tanggalPendek(t.jatuhTempo)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ textAlign: "right" }}>
                    <div className="tnum" style={{ fontSize: 14, fontWeight: 700 }}>
                      {formatRupiah(t.nominal)}
                    </div>
                    <Badge tone="danger">{labelJatuhTempo(-hari)}</Badge>
                  </div>
                  <Button size="sm" variant="success" onClick={() => handleBayar(t.id)} disabled={busy === t.id}>
                    {busy === t.id ? "..." : "Lunas"}
                  </Button>
                  <a href={waLink(t.no_wa, pesan)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                    <Button size="sm" variant="secondary">WA</Button>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionTitle sub="Belum jatuh tempo">Akan Jatuh Tempo</SectionTitle>
        {akanJatuhTempo.length === 0 ? (
          <EmptyState>Tidak ada tagihan yang akan jatuh tempo</EmptyState>
        ) : (
          akanJatuhTempo.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "10px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                  {t.nama_penyewa} — {t.kamar_nomor}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {tanggalPendek(t.jatuhTempo)}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="tnum" style={{ fontSize: 13.5, fontWeight: 700 }}>
                  {formatRupiah(t.nominal)}
                </div>
                <Badge tone={selisihHari(t.jatuhTempo) <= 3 ? "warning" : "neutral"}>
                  {labelJatuhTempo(selisihHari(t.jatuhTempo))}
                </Badge>
              </div>
            </div>
          ))
        )}
      </Card>

      <Card>
        <SectionTitle sub={`Kontrak aktif yang berakhir ${bulanIni}`}>Kontrak Berakhir Bulan Ini</SectionTitle>
        {kontrak.loading ? (
          <Skeleton height={20} />
        ) : kontrakHabisBulanIni.length === 0 ? (
          <EmptyState>Tidak ada kontrak yang berakhir bulan ini</EmptyState>
        ) : (
          kontrakHabisBulanIni.map((k) => (
            <div
              key={k.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: 13.5 }}>
                Kontrak #{k.id} — Kamar ID {k.kamarId}
              </div>
              <Badge tone="warning">{tanggalPendek(k.tanggalJatuhTempo)}</Badge>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
