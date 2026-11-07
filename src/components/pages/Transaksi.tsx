"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { fetchTransaksi, formatRupiah, type Transaksi } from "@/lib/api";
import { tanggalPendek } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { useBulanIni } from "@/lib/useNow";

const EMPTY_TRANSAKSI: Transaksi[] = [];

export function TransaksiPage() {
  const bulanIni = useBulanIni();
  const { data, loading, error } = useApi<Transaksi[]>(() => fetchTransaksi());
  const [tipeFilter, setTipeFilter] = useState<"semua" | "pemasukan" | "pengeluaran">("semua");
  const [q, setQ] = useState("");

  const rows = data ?? EMPTY_TRANSAKSI;
  const counts = useMemo(
    () => ({
      semua: rows.length,
      masuk: rows.filter((r) => r.tipe === "pemasukan").length,
      keluar: rows.filter((r) => r.tipe === "pengeluaran").length,
    }),
    [rows]
  );

  const totalPemasukan = useMemo(() => rows.filter((r) => r.tipe === "pemasukan").reduce((s, r) => s + r.nominal, 0), [rows]);
  const totalPengeluaran = useMemo(() => rows.filter((r) => r.tipe === "pengeluaran").reduce((s, r) => s + r.nominal, 0), [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (tipeFilter !== "semua" && r.tipe !== tipeFilter) return false;
      if (!term) return true;
      return (
        (r.keterangan ?? "").toLowerCase().includes(term) ||
        (r.kategori ?? "").toLowerCase().includes(term)
      );
    });
  }, [rows, tipeFilter, q]);

  function exportCsv() {
    const header = ["tanggal", "tipe", "kategori", "nominal", "keterangan"];
    const lines = filtered.map((t) =>
      [t.tanggal, t.tipe, t.kategori ?? "", t.nominal, t.keterangan ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob(["\uFEFF" + [header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transaksi-${bulanIni || "semua"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Riwayat Transaksi"
        sub={`${counts.semua} transaksi · Masuk ${formatRupiah(totalPemasukan)} · Keluar ${formatRupiah(totalPengeluaran)}`}
        actions={
          <Button variant="secondary" onClick={exportCsv} disabled={filtered.length === 0}>
            Export CSV
          </Button>
        }
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div className="segmented" role="tablist" aria-label="Filter tipe">
          {([
            ["semua", "Semua", counts.semua],
            ["pemasukan", "Masuk", counts.masuk],
            ["pengeluaran", "Keluar", counts.keluar],
          ] as const).map(([val, lbl, n]) => (
            <button
              key={val}
              data-active={tipeFilter === val}
              onClick={() => setTipeFilter(val)}
              role="tab"
              aria-selected={tipeFilter === val}
            >
              {lbl} {n}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <input
          placeholder="Cari keterangan atau kategori…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 260 }}
          aria-label="Cari transaksi"
        />
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 20, display: "grid", gap: 10 }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={20} />
            ))}
          </div>
        ) : error ? (
          <div style={{ padding: 20 }}>
            <EmptyState>Gagal memuat: {error}</EmptyState>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 20 }}>
            <EmptyState>Tidak ada transaksi</EmptyState>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Tipe</th>
                  <th>Kategori</th>
                  <th style={{ textAlign: "right" }}>Nominal</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>{tanggalPendek(t.tanggal)}</td>
                    <td>
                      <Badge tone={t.tipe === "pemasukan" ? "success" : "neutral"}>
                        {t.tipe === "pemasukan" ? "Masuk" : "Keluar"}
                      </Badge>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{t.kategori ?? "—"}</td>
                    <td
                      className="tnum"
                      style={{
                        textAlign: "right",
                        fontWeight: 600,
                        color: t.tipe === "pemasukan" ? "var(--success)" : undefined,
                      }}
                    >
                      {formatRupiah(t.nominal)}
                    </td>
                    <td>{t.keterangan ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
