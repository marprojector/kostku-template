"use client";

import { Badge, Button, Card, EmptyState, PageHeader, SectionTitle, Skeleton } from "@/components/ui";
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

  const nunggak = rooms.filter((r) => r.status === "terisi" && r.tagihanStatus === "belum_lunas").length;
  const aman = rooms.filter((r) => r.status === "terisi" && r.tagihanStatus === "lunas").length;
  const kosong = rooms.filter((r) => r.status === "tersedia").length;

  return (
    <Card>
      <SectionTitle sub={`${aman + nunggak} terisi · ${kosong} kosong`}>Peta Kamar</SectionTitle>

      {/* Ring status: kehilangan uang = merah, aman = hijau, peluang = abu */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[
          { label: `${nunggak} nunggak`, count: nunggak, bg: "var(--danger-bg)", color: "var(--danger)" },
          { label: `${aman} lunas`, count: aman, bg: "var(--success-bg)", color: "var(--success)" },
          { label: `${kosong} kosong`, count: kosong, bg: "var(--surface-2)", color: "var(--text-muted)" },
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

      <div className="room-grid" role="list" aria-label="Status 21 kamar">
        {rooms.map((r) => {
          const nunggakBulan = r.status === "terisi" && r.tagihanStatus === "belum_lunas";
          return (
            <button
              key={r.id}
              role="listitem"
              className="room-cell"
              data-status={r.status}
              data-tagihan={nunggakBulan ? "belum" : r.status === "terisi" ? "lunas" : undefined}
              data-selected={selected === r.id}
              onClick={() => setSelected(selected === r.id ? null : r.id)}
              aria-label={
                r.status === "terisi"
                  ? `${r.nomor} dihuni ${r.penyewa ?? ""}, tagihan ${nunggakBulan ? "belum lunas" : "lunas"}`
                  : `${r.nomor} tersedia, ${formatRupiah(r.harga)}/bulan`
              }
            >
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>{r.nomor.replace("Kamar ", "")}</span>
              <span style={{ fontSize: 10.5, color: "var(--text-muted)", lineHeight: 1.35 }}>
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
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>
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
                          : "var(--danger-bg)",
                    color:
                      sel.status !== "terisi"
                        ? "var(--text-muted)"
                        : sel.tagihanStatus === "lunas"
                          ? "var(--success)"
                          : "var(--danger)",
                  }}
                >
                  {sel.status !== "terisi" ? "Tersedia" : sel.tagihanStatus === "lunas" ? "Lunas" : "Belum Bayar"}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                {sel.status === "terisi" ? (
                  <>
                    {sel.penyewa ?? "—"} · <span className="tnum" style={{ fontWeight: 600, color: "var(--text)" }}>{formatRupiah(sel.harga)}</span>/bulan
                  </>
                ) : (
                  <>
                    Kosong · potensi <span className="tnum" style={{ fontWeight: 600, color: "var(--text)" }}>{formatRupiah(sel.harga)}</span>/bulan
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
              {sel.tagihanStatus === "belum_lunas" && onBayar && (
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
  const ticks = 4;
  return (
    <Card>
      <SectionTitle sub="6 bulan terakhir">Arus Kas</SectionTitle>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "0 0 22px", fontSize: 11, color: "var(--text-muted)", textAlign: "right", minWidth: 56 }} className="tnum">
          {Array.from({ length: ticks + 1 }, (_, i) => (
            <span key={i}>{formatRupiahShort(Math.round((max * (ticks - i)) / ticks))}</span>
          ))}
        </div>
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${series.length}, 1fr)`, height: 148, alignItems: "end", borderBottom: "1px solid var(--border-strong)", columnGap: 14 }}>
            {series.map((s) => (
              <div key={s.bulan} style={{ display: "flex", gap: 3, alignItems: "flex-end", height: "100%", justifyContent: "center" }}>
                <div
                  className="cashbar"
                  title={`Pendapatan ${formatRupiah(s.pendapatan)}`}
                  style={{ width: 14, height: `${(s.pendapatan / max) * 100}%`, minHeight: s.pendapatan > 0 ? 3 : 1, background: "linear-gradient(180deg, color-mix(in srgb, var(--primary) 75%, #fff), var(--primary))", borderRadius: "3px 3px 0 0" }}
                />
                <div
                  className="cashbar"
                  title={`Pengeluaran ${formatRupiah(s.pengeluaran)}`}
                  style={{ width: 14, height: `${(s.pengeluaran / max) * 100}%`, minHeight: s.pengeluaran > 0 ? 3 : 1, background: "color-mix(in srgb, var(--danger) 55%, transparent)", borderRadius: "3px 3px 0 0" }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${series.length}, 1fr)`, columnGap: 14, marginTop: 6 }}>
            {series.map((s) => (
              <div key={s.bulan} style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--primary)", display: "inline-block" }} /> Pendapatan
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "color-mix(in srgb, var(--danger) 55%, transparent)", display: "inline-block" }} /> Pengeluaran
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
      <Card style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <div style={{ padding: "18px 22px", borderRight: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-faint)", marginBottom: 6 }}>Okupansi</div>
            <div className="tnum" style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>{data.okupansi.persen}%</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{data.okupansi.terisi} terisi · {data.okupansi.tersedia} tersedia</div>
          </div>
          <div style={{ padding: "18px 22px", borderRight: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-faint)", marginBottom: 6 }}>Belum Tertagih</div>
            <div className="tnum" style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: data.tagihan.belumLunas > 0 ? "var(--danger)" : undefined }}>
              {formatRupiah(data.tagihan.belumLunas)}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{data.tagihan.totalBelumLunas} tagihan aktif</div>
          </div>
          <div style={{ padding: "18px 22px", borderRight: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-faint)", marginBottom: 6 }}>Laba {BULAN_ID[Number(bulanKpi) - 1]}</div>
            <div className="tnum" style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: k.laba >= 0 ? "var(--success)" : "var(--danger)" }}>{formatRupiah(k.laba)}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>Margin {k.pendapatan > 0 ? Math.round((k.laba / k.pendapatan) * 100) : 0}%</div>
          </div>
          <div style={{ padding: "18px 22px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-faint)", marginBottom: 6 }}>Pendapatan {BULAN_ID[Number(bulanKpi) - 1]}</div>
            <div className="tnum" style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>{formatRupiah(k.pendapatan)}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="grid-2 kostku-rise">
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
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
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
