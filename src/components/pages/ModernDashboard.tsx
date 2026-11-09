"use client";

import * as React from "react";
import {
  BedDouble,
  Wallet,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Sun,
  Moon,
  RefreshCcw,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";

import { Button, Badge, Card, CardContent, CardHeader, CardTitle, CardDescription, Progress, Separator } from "@/components/shadcn";
import { CountUp } from "@/components/fx";
import { fetchDashboard, formatRupiah, type DashboardStats } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { BULAN_ID, HARI_ID, formatRupiahShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Identitas } from "@/lib/identitas";

/* ---------- Greeting header (pattern: overview-tab shadcndashboard) ---------- */
function GreetingBar({ onReload, reloading, identitas }: { onReload: () => void; reloading: boolean; identitas: Identitas }) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const h = now.getHours();
  const greeting = h >= 4 && h < 11 ? "Selamat pagi" : h >= 11 && h < 15 ? "Selamat siang" : h >= 15 && h < 19 ? "Selamat sore" : "Selamat malam";
  const isDay = h >= 5 && h < 18;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col items-start gap-1">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {greeting}, {identitas.namaPemilik}
          <span className="flex items-center">
            {isDay ? <Sun size={22} className="text-[var(--chart-4)]" /> : <Moon size={22} />}
          </span>
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">Pantau okupansi &amp; arus kas {identitas.namaKos} hari ini</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" onClick={onReload} aria-label="Muat ulang" disabled={reloading}>
          <RefreshCcw size={15} className={reloading ? "animate-spin" : undefined} />
        </Button>
        <Button variant="outline" className="gap-2">
          <CalendarDays size={15} />
          {HARI_ID[now.getDay()]}, {now.getDate()} {BULAN_ID[now.getMonth()]} {now.getFullYear()}
        </Button>
      </div>
    </div>
  );
}

/* ---------- KPI stat card (pattern: total-sales / total-profit) ---------- */
interface StatDef {
  label: string;
  value: React.ReactNode;
  sub?: string;
  delta?: number;
  icon: React.ReactNode;
  iconClass: string;
}

function StatCard({ def, index }: { def: StatDef; index: number }) {
  const up = (def.delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.2, 0, 0, 1] }}
    >
      <Card className="h-full">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
              {def.icon}
            </div>
            {def.delta !== undefined && (
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                up ? "bg-[color-mix(in_srgb,var(--chart-3)_16%,transparent)] text-[var(--chart-3)]"
                   : "bg-[color-mix(in_srgb,var(--chart-5)_16%,transparent)] text-[var(--chart-5)]")}>
                {up ? <ArrowUpRightIcon /> : <ArrowDownIcon />}
                {up ? "+" : ""}{def.delta.toFixed(0)}%
              </span>
            )}
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight tnum text-[var(--foreground)]">{def.value}</div>
            <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">{def.sub ?? def.label}</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ArrowUpRightIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M7 17L17 7M9 7h8v8" /></svg>;
}
function ArrowDownIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M7 7l10 10M17 9v8H9" /></svg>;
}

/* ---------- Okupansi + chart (pattern: total-sales area chart) ---------- */
function OkupansiCard({ data }: { data: DashboardStats }) {
  const o = data.okupansi;
  const pct = Math.round(o.persen);
  return (
    <Card className="col-span-12 min-w-0 overflow-hidden lg:col-span-7">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1.5">
          <CardTitle className="text-base">Okupansi Kamar</CardTitle>
          <CardDescription>{o.terisi} dari {o.total} kamar terisi</CardDescription>
        </div>
        <Badge variant={pct >= 75 ? "success" : pct >= 40 ? "secondary" : "outline"}>{pct}% terisi</Badge>
      </CardHeader>
      <CardContent>
        <Progress value={pct} className="h-2.5" />
        <div className="mt-6 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.arusKas} margin={{ left: -14, right: 8, top: 6, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPdp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--shadcn-border)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v: number) => formatRupiahShort(v)} width={64} />
              <ReTooltip
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--shadcn-border)", borderRadius: 10, fontSize: 12, color: "var(--popover-foreground)" }}
                formatter={(v) => formatRupiah(Number(v))}
              />
              <Area type="monotone" dataKey="pendapatan" name="Pendapatan" stroke="var(--chart-1)" strokeWidth={2.2} fill="url(#gradPdp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Arus kas bar chart (pattern: totals-assets / advertisement-cost) ---------- */
function ArusKasCard({ data }: { data: DashboardStats }) {
  return (
    <Card className="col-span-12 min-w-0 overflow-hidden lg:col-span-5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Arus Kas 6 Bulan</CardTitle>
        <CardDescription>Pendapatan vs pengeluaran</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[248px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.arusKas} margin={{ left: -14, right: 8, top: 6, bottom: 0 }} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--shadcn-border)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v: number) => formatRupiahShort(v)} width={64} />
              <ReTooltip
                cursor={{ fill: "color-mix(in srgb, var(--muted) 45%, transparent)" }}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--shadcn-border)", borderRadius: 10, fontSize: 12, color: "var(--popover-foreground)" }}
                formatter={(v) => formatRupiah(Number(v))}
              />
              <Bar dataKey="pendapatan" name="Pendapatan" fill="var(--chart-1)" radius={[5, 5, 0, 0]} maxBarSize={22} />
              <Bar dataKey="pengeluaran" name="Pengeluaran" fill="var(--chart-4)" radius={[5, 5, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Separator className="my-4" />
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)]"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--chart-1)" }} />Pendapatan</span>
          <span className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)]"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--chart-4)" }} />Pengeluaran</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Tagihan jatuh tempo (pattern: recent-orders table) ---------- */
function JatuhTempoCard({ data, onOpenPenyewa }: { data: DashboardStats; onOpenPenyewa?: (id: number) => void }) {
  const rows = [...data.lewat, ...data.jatuhTempo].slice(0, 6);
  const hariIni = new Date().toISOString().slice(0, 10);
  return (
    <Card className="col-span-12">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1.5">
          <CardTitle className="text-base">Jatuh Tempo &amp; Tunggakan</CardTitle>
          <CardDescription>{data.tagihan.belumLunas} tagihan belum lunas · total {formatRupiah(data.tagihan.totalBelumLunas)}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0 [&_:last-child]:pb-0">
        {rows.length === 0 ? (
          <div className="px-6 pb-6 text-sm text-[var(--muted-foreground)]">Semua tagihan lunas — tidak ada jatuh tempo.</div>
        ) : (
          <div className="overflow-hidden">
            {rows.map((t, i) => {
              const telat = t.jatuhTempo < hariIni;
              return (
                <button
                  key={t.id}
                  onClick={() => t.penyewaId && onOpenPenyewa?.(t.penyewaId)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-6 py-3 text-left transition-colors hover:bg-[var(--accent)] cursor-pointer",
                    i > 0 && "border-t border-[var(--shadcn-border)]"
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-[var(--foreground)]">{t.nama_penyewa} <span className="text-[var(--muted-foreground)]">· {t.kamar_nomor}</span></div>
                    <div className="text-xs text-[var(--muted-foreground)]">Jatuh tempo {t.jatuhTempo}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold tnum text-[var(--foreground)]">{formatRupiah(t.nominal)}</span>
                    <Badge variant={telat ? "destructive" : "secondary"}>{telat ? "Lewat tempo" : "Segera"}</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Halaman Modern Dashboard ---------- */
export function ModernDashboard({ onSelectPenyewa, identitas }: { onSelectPenyewa?: (id: number) => void; identitas: Identitas } = { onSelectPenyewa: undefined, identitas: { namaKos: "Kos Perajin", alamat: "", namaPemilik: "Ammar" } }) {
  const { data, loading, error, reload } = useApi<DashboardStats>(() => fetchDashboard());

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="col-span-12 sm:col-span-6 lg:col-span-3 h-[140px] animate-pulse rounded-lg bg-[var(--muted)]" />
        ))}
        <div className="col-span-12 h-[360px] animate-pulse rounded-lg bg-[var(--muted)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-[var(--muted-foreground)]">
          Gagal memuat dashboard: {error ?? "data kosong"}
        </CardContent>
      </Card>
    );
  }

  const k = data.keuangan;
  const deltaPdp = k.bulanLalu > 0 ? ((k.pendapatan - k.bulanLalu) / k.bulanLalu) * 100 : 0;
  const [thn, bln] = k.bulan.split("-");
  const labelBulan = `${BULAN_ID[Number(bln) - 1]} ${thn}`;

  const stats: StatDef[] = [
    {
      label: "Total Kamar",
      value: <CountUp value={data.okupansi.total} />,
      sub: `${data.okupansi.terisi} terisi · ${data.okupansi.tersedia} kosong`,
      icon: <BedDouble size={20} />,
      iconClass: "",
    },
    {
      label: "Okupansi",
      value: <CountUp value={Math.round(data.okupansi.persen)} format={(n) => `${Math.round(n)}%`} />,
      sub: `${data.okupansi.terisi}/${data.okupansi.total} kamar`,
      icon: <TrendingUp size={20} />,
      iconClass: "",
    },
    {
      label: `Pendapatan ${labelBulan}`,
      value: <CountUp value={k.pendapatan} format={(n) => formatRupiah(Math.round(n))} />,
      sub: k.bulanLalu > 0 ? `Bulan lalu ${formatRupiahShort(k.bulanLalu)}` : undefined,
      delta: k.bulanLalu > 0 ? deltaPdp : undefined,
      icon: <Wallet size={20} />,
      iconClass: "",
    },
    {
      label: "Tagihan Belum Lunas",
      value: <CountUp value={data.tagihan.belumLunas} />,
      sub: `Total ${formatRupiah(data.tagihan.totalBelumLunas)}`,
      icon: <TrendingDown size={20} />,
      iconClass: "",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <GreetingBar onReload={reload} reloading={loading} identitas={identitas} />

      {/* KPI row */}
      <div className="grid grid-cols-12 gap-4">
        {stats.map((def, i) => (
          <div key={def.label} className="col-span-12 sm:col-span-6 lg:col-span-3">
            <StatCard def={def} index={i} />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-12 gap-4" data-reveal>
        <OkupansiCard data={data} />
        <ArusKasCard data={data} />
      </div>

      {/* Jatuh tempo */}
      <div data-reveal>
        <JatuhTempoCard data={data} onOpenPenyewa={onSelectPenyewa} />
      </div>
    </div>
  );
}
