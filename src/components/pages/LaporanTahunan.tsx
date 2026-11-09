"use client";

import { useState } from "react";
import { Button, Card, EmptyState, PageHeader, SectionTitle, Skeleton, Stat } from "@/components/ui";
import { fetchLaporanTahunan, formatRupiah, type LaporanTahunan } from "@/lib/api";
import { useApi } from "@/lib/useApi";

export function LaporanTahunanPage() {
  const tahunIni = String(new Date().getFullYear());
  const [tahun, setTahun] = useState(tahunIni);
  const { data, loading, error } = useApi<LaporanTahunan>(
    () => fetchLaporanTahunan(tahun),
    [tahun]
  );

  const opsiTahun = Array.from({ length: 5 }, (_, i) => String(Number(tahunIni) - i));
  const maxVal = data ? Math.max(1, ...data.months.map((m) => Math.max(m.pendapatan, m.pengeluaran))) : 1;
  const bulanAktif = data ? data.months.filter((m) => m.pendapatan > 0 || m.pengeluaran > 0).length : 0;

  function exportCsv() {
    const header = ["bulan", "pendapatan", "pengeluaran"];
    const lines = data ? data.months.map((m) => [`"${m.nama}"`, m.pendapatan, m.pengeluaran].join(",")) : [];
    const blob = new Blob(["\uFEFF" + [header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-tahunan-${tahun}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Laporan Tahunan"
        sub={data ? `${bulanAktif} bulan berisi transaksi` : undefined}
        actions={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {data && (
              <Button variant="secondary" onClick={exportCsv}>
                Export CSV
              </Button>
            )}
            <select
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              style={{ width: "auto" }}
              aria-label="Pilih tahun"
            >
              {opsiTahun.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {loading ? (
        <Card><Skeleton height={200} /></Card>
      ) : error || !data ? (
        <Card><EmptyState>Gagal memuat: {error}</EmptyState></Card>
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
            <Stat label={`Total Pendapatan ${tahun}`} value={formatRupiah(data.totalSewa)} accent="var(--success)" />
            <Stat label="Total Pengeluaran" value={formatRupiah(data.totalPgp)} accent="var(--danger)" />
            <Stat label="Arus Kas Bersih" value={formatRupiah(data.arusKas)} accent="var(--primary)" />
          </div>

          <Card style={{ marginBottom: 16 }}>
            <SectionTitle sub="Pendapatan dibanding pengeluaran setiap bulan">Arus Kas {tahun}</SectionTitle>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 6,
                height: 180,
                paddingTop: 8,
                minWidth: 300,
              }}
              role="img"
              aria-label={`Grafik arus kas ${tahun}`}
            >
              {data.months.map((m) => {
                const hPdp = Math.max(2, Math.round((m.pendapatan / maxVal) * 150));
                const hPgp = Math.max(2, Math.round((m.pengeluaran / maxVal) * 150));
                return (
                  <div
                    key={m.short}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      height: "100%",
                      justifyContent: "flex-end",
                      gap: 4,
                    }}
                    title={`${m.nama}: pendapatan ${formatRupiah(m.pendapatan)}, pengeluaran ${formatRupiah(m.pengeluaran)}`}
                  >
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, flex: 1, justifyContent: "center" }}>
                      <div style={{ width: 9, height: hPdp, background: "var(--primary)", borderRadius: "2px 2px 0 0" }} />
                      <div style={{ width: 9, height: hPgp, background: "var(--danger)", borderRadius: "2px 2px 0 0" }} />
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{m.short}</div>
                  </div>
                );
              })}
            </div>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 9, height: 9, background: "var(--primary)", borderRadius: 2 }} aria-hidden="true" />
                Pendapatan
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 9, height: 9, background: "var(--danger)", borderRadius: 2 }} aria-hidden="true" />
                Pengeluaran
              </span>
            </div>
          </Card>

          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 0" }}>
              <SectionTitle sub={`${bulanAktif} bulan`}>Rincian per Bulan</SectionTitle>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Bulan</th>
                    <th style={{ textAlign: "right" }}>Pendapatan</th>
                    <th style={{ textAlign: "right" }}>Pengeluaran</th>
                    <th style={{ textAlign: "right" }}>Arus Kas</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.months].reverse().map((m) => {
                    const arus = m.pendapatan - m.pengeluaran;
                    return (
                      <tr key={m.short}>
                        <td style={{ fontWeight: 600 }}>{m.nama}</td>
                        <td className="tnum" style={{ textAlign: "right", color: "var(--success)" }}>
                          {formatRupiah(m.pendapatan)}
                        </td>
                        <td className="tnum" style={{ textAlign: "right", color: "var(--danger)" }}>
                          {formatRupiah(m.pengeluaran)}
                        </td>
                        <td
                          className="tnum"
                          style={{
                            textAlign: "right",
                            fontWeight: 700,
                            color: arus >= 0 ? "var(--success)" : "var(--danger)",
                          }}
                        >
                          {formatRupiah(Math.abs(arus))}
                          {arus < 0 ? " (defisit)" : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
