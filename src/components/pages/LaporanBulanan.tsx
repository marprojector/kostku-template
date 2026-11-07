"use client";

import { useMemo, useState } from "react";
import { Button, Card, EmptyState, PageHeader, SectionTitle, Skeleton, Stat } from "@/components/ui";
import { fetchLaporanBulanan, formatRupiah, type LaporanBulanan } from "@/lib/api";
import { BULAN_ID, isoPeriode } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { useBulanIni } from "@/lib/useNow";

export function LaporanBulananPage() {
  const bulanIni = useBulanIni();
  const opsiPeriode = useMemo(() => {
    if (!bulanIni) return [];
    const [y, m] = bulanIni.split("-").map(Number);
    return Array.from({ length: 18 }, (_, i) => isoPeriode(new Date(y, m - 1 - i, 1)));
  }, [bulanIni]);
  const [periodeDipilih, setPeriodeDipilih] = useState("");
  const periode = periodeDipilih || opsiPeriode[0] || "";

  const { data, loading, error } = useApi<LaporanBulanan | null>(
    () => (periode ? fetchLaporanBulanan(periode) : Promise.resolve(null)),
    [periode]
  );

  const [tahun, bulan] = periode ? periode.split("-") : ["", ""];
  const label = periode ? `${BULAN_ID[Number(bulan) - 1]} ${tahun}` : "—";

  const maxKategori = data ? Math.max(1, ...Object.values(data.perKategori)) : 1;
  const kategoriUrut = data
    ? Object.entries(data.perKategori).sort((a, b) => b[1] - a[1])
    : [];

  const pctPdp =
    data && data.bulanLalu.pendapatan > 0
      ? ((data.pendapatan - data.bulanLalu.pendapatan) / data.bulanLalu.pendapatan) * 100
      : 0;
  const pctPgp =
    data && data.bulanLalu.pengeluaran > 0
      ? ((data.pengeluaran - data.bulanLalu.pengeluaran) / data.bulanLalu.pengeluaran) * 100
      : 0;
  const pctLaba =
    data && data.bulanLalu.laba > 0 ? ((data.laba - data.bulanLalu.laba) / data.bulanLalu.laba) * 100 : 0;

  function exportCsv() {
    const lines = kategoriUrut.map(([kat, nominal]) => [`"${kat}"`, nominal].join(","));
    const blob = new Blob(["\uFEFF" + ["kategori,nominal", ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-bulanan-${periode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Laporan Bulanan"
        sub={periode ? `Periode ${label}` : undefined}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            {data && (
              <Button variant="secondary" onClick={exportCsv}>
                Export CSV
              </Button>
            )}
            <select
              value={periode}
              onChange={(e) => setPeriodeDipilih(e.target.value)}
              style={{ width: "auto" }}
              aria-label="Pilih periode"
              disabled={opsiPeriode.length === 0}
            >
              {opsiPeriode.map((p) => {
                const [y, m] = p.split("-");
                return (
                  <option key={p} value={p}>
                    {BULAN_ID[Number(m) - 1]} {y}
                  </option>
                );
              })}
            </select>
          </div>
        }
      />

      {loading || !periode ? (
        <Card><Skeleton height={80} /></Card>
      ) : error || !data ? (
        <Card><EmptyState>Gagal memuat laporan: {error ?? "data kosong"}</EmptyState></Card>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <Stat
              label={`Pendapatan ${label}`}
              value={formatRupiah(data.pendapatan)}
              delta={{ value: pctPdp, goodWhen: "up" }}
              accent="var(--success)"
            />
            <Stat
              label="Pengeluaran"
              value={formatRupiah(data.pengeluaran)}
              delta={{ value: pctPgp, goodWhen: "down" }}
              accent="var(--danger)"
            />
            <Stat
              label="Laba Bersih"
              value={formatRupiah(data.laba)}
              delta={{ value: pctLaba, goodWhen: "up" }}
              accent="var(--primary)"
            />
            <Stat label="Margin" value={`${data.margin}%`} sub="Laba dibagi pendapatan" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="grid-2">
            <Card>
              <SectionTitle sub={`${kategoriUrut.length} kategori`}>Rincian Pengeluaran</SectionTitle>
              {kategoriUrut.length === 0 ? (
                <EmptyState>Tidak ada pengeluaran</EmptyState>
              ) : (
                <div>
                  {kategoriUrut.map(([kat, nominal]) => (
                    <div key={kat} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                      <span>{kat}</span>
                      <span className="tnum" style={{ fontWeight: 600 }}>{formatRupiah(nominal)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: 13.5, fontWeight: 700 }}>
                    <span>Total</span>
                    <span className="tnum">{formatRupiah(data.pengeluaran)}</span>
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <SectionTitle sub="Proporsi tiap kategori">Grafik Pengeluaran</SectionTitle>
              {kategoriUrut.length === 0 ? (
                <EmptyState>Tidak ada data</EmptyState>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {kategoriUrut.map(([kat, nominal]) => {
                    const lebar = Math.round((nominal / maxKategori) * 100);
                    return (
                      <div key={kat}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                          <span>{kat}</span>
                          <span className="tnum">{formatRupiah(nominal)}</span>
                        </div>
                        <div style={{ height: 8, background: "var(--bg-strong)", borderRadius: 5, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${lebar}%`, background: "var(--danger)", borderRadius: 5 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
