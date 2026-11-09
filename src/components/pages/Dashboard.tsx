"use client";

import { Badge, Button, Card, EmptyState, PageHeader, SectionTitle, Skeleton } from "@/components/ui";
import { CountUp } from "@/components/fx";
import { fetchDashboard, formatRupiah, waLink, bayarTagihan, type DashboardStats } from "@/lib/api";
import { BULAN_ID, formatRupiahShort, labelJatuhTempo, selisihHari, tanggalPendek } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { useState } from "react";


/* Signature element: peta kamar dengan status pembayaran per kamar */
function RoomMap({
  rooms,
  onOpenPenyewa,
  onBayar,
  busy,
}: {
  rooms: DashboardStats["kamar"];
  onOpenPenyewa?: (id: number) => void;
  onBayar?: (id: number) => void;
  busy?: number | null;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const sel = rooms.find((r) => r.id === selected) ?? null;

  const nunggak = rooms.filter((r) => r.status === "terisi" && r.tagihanStatus === "telat").length;
  const belumTempo = rooms.filter((r) => r.status === "terisi" && r.tagihanStatus === "belum_lunas").length;
  const aman = rooms.filter((r) => r.status === "terisi" && r.tagihanStatus === "lunas").length;
  const kosong = rooms.filter((r) => r.status === "tersedia").length;

  return (
    <Card>
      <SectionTitle sub={`${aman + nunggak + belumTempo} terisi · ${kosong} kosong`}>Peta Kamar</SectionTitle>

      {/* Ring status: telat = merah (hilang uang), belum jatuh tempo = kuning, lunas = hijau, kosong = abu */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[
          { label: `${nunggak} nunggak`, count: nunggak, bg: "var(--danger-bg)", color: "var(--danger)" },
          { label: `${belumTempo} belum tempo`, count: belumTempo, bg: "var(--warning-bg)", color: "var(--warning)" },
          { label: `${aman} lunas`, count: aman, bg: "var(--success-bg)", color: "var(--success)" },
          { label: `${kosong} kosong`, count: kosong, bg: "var(--surface-2)", color: "var(--muted-foreground)" },
        ].map((chip) => (
          <span
            key={chip.label}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 999,
              background: chip.bg,
              color: chip.color,
            }}
          >
            {chip.label}
          </span>
        ))}
      </div>

      <div className="room-grid" role="list" aria-label="Peta status kamar">
        {rooms.map((r) => {
          const telat = r.status === "terisi" && r.tagihanStatus === "telat";
          const belum = r.status === "terisi" && r.tagihanStatus === "belum_lunas";
          const labelStatus = telat ? "nunggak (lewat jatuh tempo)" : belum ? "belum lunas" : "lunas";
          return (
            <button
              key={r.id}
              role="listitem"
              className="room-cell"
              data-status={r.status}
              data-tagihan={telat ? "telat" : belum ? "belum" : r.status === "terisi" ? "lunas" : undefined}
              data-selected={selected === r.id}
              onClick={() => setSelected(selected === r.id ? null : r.id)}
              aria-label={
                r.status === "terisi"
                  ? `${r.nomor} dihuni ${r.penyewa ?? ""}, tagihan ${labelStatus}`
                  : `${r.nomor} tersedia, ${formatRupiah(r.harga)}/bulan`
              }
            >
              <span style={{ fontSize: 13, fontWeight: 600 }}>{r.nomor.replace("Kamar ", "")}</span>
              <span style={{ fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.35 }}>
                {r.status === "terisi" ? (r.penyewa?.split(" ")[0] ?? "terisi") : formatRupiahShort(r.harga)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Panel detail kamar terpilih */}
      {sel && (
        <div
          style={{
            marginTop: 14,
            padding: "14px 16px",
            background: "var(--surface-2)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>
                {sel.nomor}
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 999,
                    background:
                      sel.status !== "terisi"
                        ? "var(--surface-3)"
                        : sel.tagihanStatus === "lunas"
                          ? "var(--success-bg)"
                          : sel.tagihanStatus === "telat"
                            ? "var(--danger-bg)"
                            : "var(--warning-bg)",
                    color:
                      sel.status !== "terisi"
                        ? "var(--muted-foreground)"
                        : sel.tagihanStatus === "lunas"
                          ? "var(--success)"
                          : sel.tagihanStatus === "telat"
                            ? "var(--danger)"
                            : "var(--warning)",
                  }}
                >
                  {sel.status !== "terisi" ? "Tersedia" : sel.tagihanStatus === "lunas" ? "Lunas" : sel.tagihanStatus === "telat" ? "Nunggak" : "Belum Bayar"}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 4 }}>
                {sel.status === "terisi" ? (
                  <>
                    {sel.penyewa ?? "—"} · <span className="tnum" style={{ fontWeight: 600, color: "var(--foreground)" }}>{formatRupiah(sel.harga)}</span>/bulan
                  </>
                ) : (
                  <>
                    Kosong · potensi <span className="tnum" style={{ fontWeight: 600, color: "var(--foreground)" }}>{formatRupiah(sel.harga)}</span>/bulan
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              aria-label="Tutup detail kamar"
              style={{
                border: "none",
                background: "transparent",
                color: "var(--text-faint)",
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
                padding: 2,
              }}
            >
              ×
            </button>
          </div>

          {sel.status === "terisi" && (
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {(sel.tagihanStatus === "telat" || sel.tagihanStatus === "belum_lunas") && onBayar && (
                <Button size="sm" variant="primary" onClick={() => sel.tagihanId && onBayar(sel.tagihanId)} disabled={busy === sel.tagihanId}>
                  {busy === sel.id ? "Memproses…" : "Tandai Lunas"}
                </Button>
              )}
              {sel.penyewaId && onOpenPenyewa && (
                <Button size="sm" variant="secondary" onClick={() => onOpenPenyewa(sel.penyewaId!)}>
                  Profil Penyewa
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/* Arus kas 6 bulan: kolom ganda pendapatan/pengeluaran pada satu skala */
function CashFlow({ series }: { series: DashboardStats["arusKas"] }) {
  const max = Math.max(1, ...series.map((s) => Math.max(s.pendapatan, s.pengeluaran)));
  return (
    <Card style={{ display: "flex", flexDirection: "column" }}>
      <SectionTitle sub="6 bulan terakhir">Arus Kas</SectionTitle>
      <div className="cashflow-chart">
        <div className="cashflow-axis tnum" aria-hidden="true">
          <span>{formatRupiahShort(max)}</span>
          <span>{formatRupiahShort(Math.round(max / 2))}</span>
          <span>Rp0</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ position: "relative" }}>
            <div className="cashflow-gridlines" aria-hidden="true"><i /><i /></div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))`, height: 164, alignItems: "end", columnGap: 8, position: "relative", zIndex: 1, borderBottom: "1px solid var(--border-strong)" }}>
              {series.map((s) => (
                <div key={s.bulan} style={{ display: "flex", gap: 4, alignItems: "flex-end", height: "100%", justifyContent: "center" }}>
                  <div className="cashbar" title={`Pendapatan ${formatRupiah(s.pendapatan)}`} style={{ width: 18, height: `${(s.pendapatan / max) * 100}%`, minHeight: s.pendapatan > 0 ? 3 : 1, background: "var(--primary)", borderRadius: "4px 4px 0 0" }} />
                  <div className="cashbar" title={`Pengeluaran ${formatRupiah(s.pengeluaran)}`} style={{ width: 18, height: `${(s.pengeluaran / max) * 100}%`, minHeight: s.pengeluaran > 0 ? 3 : 1, background: "var(--danger)", opacity: 0.65, borderRadius: "4px 4px 0 0" }} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))`, columnGap: 8, marginTop: 8 }}>
            {series.map((s) => <div key={s.bulan} style={{ textAlign: "center", fontSize: 11, color: "var(--muted-foreground)" }}>{s.label}</div>)}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: "var(--muted-foreground)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--primary)", display: "inline-block" }} /> Pendapatan
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "color-mix(in srgb, var(--danger) 65%, transparent)", display: "inline-block" }} /> Pengeluaran
        </span>
      </div>
    </Card>
  );
}

export function Dashboard({ onSelectPenyewa }: { onSelectPenyewa?: (id: number) => void } = {}) {
  const { data, loading, error, reload } = useApi<DashboardStats>(() => fetchDashboard());
  const [busy, setBusy] = useState<number | null>(null);

  async function handleBayar(id: number) {
    setBusy(id);
    try {
      await bayarTagihan(id);
      reload();
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Menu Utama" sub="Ringkasan kondisi kos hari ini" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton width="60%" height={12} />
              <div style={{ height: 10 }} />
              <Skeleton width="40%" height={26} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Menu Utama" />
        <EmptyState>Gagal memuat data: {error ?? "tidak diketahui"}</EmptyState>
      </div>
    );
  }

  const k = data.keuangan;
  const bulanKpi = k.bulan.split("-")[1];
  const pctPdp = k.bulanLalu > 0 ? ((k.pendapatan - k.bulanLalu) / k.bulanLalu) * 100 : 0;

  return (
    <div>
      <PageHeader
        title="Menu Utama"
        sub={`Ringkasan ${tanggalPendek(new Date())}`}
      />

      {/* Strip KPI: satu container, dipisah 1px hairline */}
      <Card className="dashboard-kpi-strip" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          <div style={{ padding: "16px 18px", borderRight: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--muted-foreground)", marginBottom: 4 }}>Okupansi</div>
            <div className="tnum" style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" }}>
              <CountUp value={data.okupansi.persen} format={(n) => `${Math.round(n)}%`} />
            </div>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 3 }}>{data.okupansi.terisi} terisi · {data.okupansi.tersedia} tersedia</div>
          </div>
          <div style={{ padding: "16px 18px", borderRight: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--muted-foreground)", marginBottom: 4 }}>Belum Tertagih</div>
            <div className="tnum" style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: data.tagihan.belumLunas > 0 ? "var(--danger)" : undefined }}>
              <CountUp value={data.tagihan.totalBelumLunas} format={(n) => formatRupiah(Math.round(n))} />
            </div>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 3 }}>{data.tagihan.belumLunas} tagihan aktif</div>
          </div>
          <div style={{ padding: "16px 18px", borderRight: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--muted-foreground)", marginBottom: 4 }}>Laba {BULAN_ID[Number(bulanKpi) - 1]}</div>
            <div className="tnum" style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: k.laba >= 0 ? "var(--success)" : "var(--danger)" }}>{formatRupiah(k.laba)}</div>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 3 }}>Margin {k.pendapatan > 0 ? Math.round((k.laba / k.pendapatan) * 100) : 0}%</div>
          </div>
          <div style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--muted-foreground)", marginBottom: 4 }}>Pendapatan {BULAN_ID[Number(bulanKpi) - 1]}</div>
            <div className="tnum" style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" }}>{formatRupiah(k.pendapatan)}</div>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 3 }}>
              {k.bulanLalu > 0 && (
                <span style={{ fontWeight: 600, color: k.pendapatan >= k.bulanLalu ? "var(--success)" : "var(--danger)" }}>
                  {k.pendapatan >= k.bulanLalu ? "+" : ""}{Math.round(pctPdp)}%
                </span>
              )}
              {k.bulanLalu > 0 ? " vs bulan lalu" : "—"}
            </div>
          </div>
        </div>
      </Card>

      {/* Hero: peta kamar + arus kas berdampingan */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, marginBottom: 16 }} className="grid-2 kostku-rise">
        <RoomMap rooms={data.kamar} onOpenPenyewa={onSelectPenyewa} onBayar={handleBayar} busy={busy} />
        <CashFlow series={data.arusKas} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="grid-2 kostku-rise" data-reveal>
        <Card>
          <SectionTitle sub="30 hari ke depan">Jatuh Tempo</SectionTitle>
          {data.jatuhTempo.length === 0 ? (
            <EmptyState>Tidak ada tagihan jatuh tempo</EmptyState>
          ) : (
            <div>
              {data.jatuhTempo.map((t) => {
                const hari = selisihHari(t.jatuhTempo);
                const tone = hari < 0 ? "danger" : hari <= 3 ? "warning" : "neutral";
                return (
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
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                        {t.kamar_nomor} — {t.nama_penyewa}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                        {tanggalPendek(t.jatuhTempo)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div className="tnum" style={{ fontSize: 13.5, fontWeight: 700 }}>
                        {formatRupiah(t.nominal)}
                      </div>
                      <Badge tone={tone}>{labelJatuhTempo(hari)}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle sub="Sudah melewati tanggal jatuh tempo">Tunggakan</SectionTitle>
          {data.lewat.length === 0 ? (
            <EmptyState>Semua tagihan lunas</EmptyState>
          ) : (
            <div>
              {data.lewat.map((t) => {
                const hari = selisihHari(t.jatuhTempo);
                const pesan = `Halo ${t.nama_penyewa}, tagihan ${formatRupiah(t.nominal)} untuk ${t.kamar_nomor} sudah lewat ${Math.abs(hari)} hari. Mohon segera dibayarkan. Terima kasih.`;
                return (
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
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                        {t.nama_penyewa} — {t.kamar_nomor}
                      </div>
                      <Badge tone="danger">Lewat {Math.abs(hari)} hari</Badge>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div className="tnum" style={{ fontSize: 13.5, fontWeight: 700 }}>
                        {formatRupiah(t.nominal)}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 4, justifyContent: "flex-end" }}>
                        <Button size="sm" variant="success" onClick={() => handleBayar(t.id)} disabled={busy === t.id}>
                          {busy === t.id ? "..." : "Lunas"}
                        </Button>
                        <a
                          href={waLink(t.no_wa, pesan)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "5px 11px",
                            fontSize: 12,
                            fontWeight: 600,
                            borderRadius: 8,
                            background: "var(--primary-soft)",
                            color: "var(--primary)",
                            textDecoration: "none",
                          }}
                        >
                          WA
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
