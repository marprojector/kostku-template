"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { fetchKamar, formatRupiah, waLink, type RoomRow } from "@/lib/api";
import { tanggalPendek } from "@/lib/format";
import { useApi } from "@/lib/useApi";

const EMPTY_ROWS: RoomRow[] = [];

type Filter = "semua" | "terisi" | "tersedia";

interface Props {
  onSelectPenyewa?: (id: number) => void;
}

export function DatabaseKamar({ onSelectPenyewa }: Props) {
  const { data, loading, error } = useApi<RoomRow[]>(() => fetchKamar());
  const [filter, setFilter] = useState<Filter>("semua");
  const [q, setQ] = useState("");

  const rows = data ?? EMPTY_ROWS;

  const counts = useMemo(
    () => ({
      semua: rows.length,
      terisi: rows.filter((r) => r.kamar.status === "terisi").length,
      tersedia: rows.filter((r) => r.kamar.status === "tersedia").length,
    }),
    [rows]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "semua" && r.kamar.status !== filter) return false;
      if (!term) return true;
      return (
        r.kamar.nomor.toLowerCase().includes(term) ||
        (r.penyewa?.nama ?? "").toLowerCase().includes(term)
      );
    });
  }, [rows, filter, q]);

  return (
    <div>
      <PageHeader
        title="Database Kamar"
        sub={`${counts.semua} kamar · ${counts.terisi} terisi · ${counts.tersedia} tersedia`}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {(["semua", "terisi", "tersedia"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              border: `1px solid ${filter === f ? "var(--primary)" : "var(--border)"}`,
              background: filter === f ? "var(--primary)" : "var(--card-bg)",
              color: filter === f ? "#fff" : "var(--text)",
            }}
          >
            {f === "semua" ? "Semua" : f === "terisi" ? "Terisi" : "Tersedia"} ({counts[f]})
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <input
          placeholder="Cari kamar atau penyewa..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 260 }}
          aria-label="Cari kamar atau penyewa"
        />
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 20, display: "grid", gap: 10 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={20} />
            ))}
          </div>
        ) : error ? (
          <div style={{ padding: 20 }}>
            <EmptyState>Gagal memuat: {error}</EmptyState>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 20 }}>
            <EmptyState>Tidak ada kamar yang cocok</EmptyState>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Kamar</th>
                  <th>Penyewa</th>
                  <th style={{ textAlign: "right" }}>Harga Sewa</th>
                  <th>Jatuh Tempo</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.kamar.id}>
                    <td style={{ fontWeight: 600 }}>{r.kamar.nomor}</td>
                    <td>
                      {r.penyewa ? (
                        <button
                          onClick={() => onSelectPenyewa?.(r.penyewa!.id)}
                          title={`Profil ${r.penyewa.nama}`}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            color: "var(--primary)",
                            textDecoration: "underline",
                            fontSize: "inherit",
                          }}
                        >
                          {r.penyewa.nama}
                        </button>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td className="tnum" style={{ textAlign: "right" }}>
                      {formatRupiah(r.kamar.hargaSewa)}
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {r.kontrak?.tanggalJatuhTempo ? tanggalPendek(r.kontrak.tanggalJatuhTempo) : "—"}
                    </td>
                    <td>
                      <Badge tone={r.kamar.status === "terisi" ? "success" : "warning"}>
                        {r.kamar.status === "terisi" ? "Terisi" : "Tersedia"}
                      </Badge>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {r.penyewa && (
                        <a
                          href={waLink(
                            r.penyewa.noWa,
                            `Halo ${r.penyewa.nama}, kami dari pengelola Kos Perajin ingin mengingatkan sewa ${r.kamar.nomor}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none" }}
                        >
                          <Button size="sm" variant="success">
                            WhatsApp
                          </Button>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <div
            style={{
              padding: "11px 16px",
              fontSize: 12,
              color: "var(--text-muted)",
              borderTop: "1px solid var(--border)",
            }}
          >
            Menampilkan {filtered.length} dari {rows.length} kamar
          </div>
        )}
      </Card>
    </div>
  );
}
