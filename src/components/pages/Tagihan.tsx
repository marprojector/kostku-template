"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { fetchTagihan, formatRupiah, waLink, generateTagihan, bayarTagihan, type TagihanDetail } from "@/lib/api";
import { BULAN_ID, labelJatuhTempo, selisihHari, tanggalPendek } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { useBulanIni } from "@/lib/useNow";

const EMPTY_TAGIHAN: TagihanDetail[] = [];
type StatusFilter = "semua" | "lunas" | "belum_lunas";

export function Tagihan() {
  const bulanIni = useBulanIni();
  const [riwayat, setRiwayat] = useState(false);
  const { data, loading, error, reload } = useApi<TagihanDetail[]>(() => fetchTagihan({ semua: riwayat ? "1" : undefined }), [riwayat]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("semua");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [genBusy, setGenBusy] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);

  const rows = data ?? EMPTY_TAGIHAN;
  const counts = useMemo(
    () => ({
      semua: rows.length,
      lunas: rows.filter((r) => r.status === "lunas").length,
      belum: rows.filter((r) => r.status === "belum_lunas").length,
    }),
    [rows]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "semua" && r.status !== statusFilter) return false;
      if (!term) return true;
      return (
        r.kamar_nomor.toLowerCase().includes(term) ||
        r.nama_penyewa.toLowerCase().includes(term)
      );
    });
  }, [rows, statusFilter, q]);

  async function handleBayar(id: number) {
    setBusy(id);
    try {
      await bayarTagihan(id);
      reload();
    } finally {
      setBusy(null);
    }
  }

  async function handleGenerate() {
    setGenBusy(true);
    setGenMsg(null);
    try {
      const res = await generateTagihan(bulanIni);
      setGenMsg(`Dibuat ${res.dibuat} tagihan, dilewati ${res.dilewati} (sudah ada) untuk ${res.periode}`);
      reload();
    } catch (err) {
      setGenMsg(err instanceof Error ? err.message : "Gagal generate tagihan");
    } finally {
      setGenBusy(false);
    }
  }

  function exportCsv() {
    const header = ["kamar", "penyewa", "periode", "nominal", "jatuh_tempo", "status", "tanggal_bayar"];
    const lines = filtered.map((t) =>
      [t.kamar_nomor, t.nama_penyewa, t.periode, t.nominal, t.jatuhTempo, t.status, t.tanggalBayar ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob(["\uFEFF" + [header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tagihan-${bulanIni || "semua"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Tagihan & WhatsApp"
        sub={`${counts.semua} tagihan · ${counts.lunas} lunas · ${counts.belum} belum lunas`}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={exportCsv} disabled={filtered.length === 0}>
              Export CSV
            </Button>
            <Button variant="primary" onClick={handleGenerate} disabled={genBusy || !bulanIni}>
              {genBusy ? "Membuat…" : `Generate ${bulanIni ? BULAN_ID[Number(bulanIni.split("-")[1]) - 1] : ""}`}
            </Button>
          </div>
        }
      />

      {genMsg && (
        <Card style={{ marginBottom: 14, padding: "10px 16px", fontSize: 13 }}>
          {genMsg}
        </Card>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div className="segmented" role="tablist" aria-label="Filter status">
          {([
            ["semua", "Semua", counts.semua],
            ["lunas", "Lunas", counts.lunas],
            ["belum_lunas", "Belum", counts.belum],
          ] as const).map(([val, lbl, n]) => (
            <button key={val} data-active={statusFilter === val} onClick={() => setStatusFilter(val)} role="tab" aria-selected={statusFilter === val}>
              {lbl} {n}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={riwayat}
            onChange={(e) => setRiwayat(e.target.checked)}
            style={{ width: "auto", margin: 0 }}
          />
          Tampilkan riwayat (kontrak selesai)
        </label>
        <input
          placeholder="Cari kamar atau penyewa…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 260 }}
          aria-label="Cari tagihan"
        />
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 20, display: "grid", gap: 10 }}>
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={20} />)}
          </div>
        ) : error ? (
          <div style={{ padding: 20 }}><EmptyState>Gagal memuat: {error}</EmptyState></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 20 }}><EmptyState>Tidak ada tagihan yang cocok</EmptyState></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Kamar</th>
                  <th>Penyewa</th>
                  <th>Periode</th>
                  <th style={{ textAlign: "right" }}>Nominal</th>
                  <th>Jatuh Tempo</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const hari = selisihHari(t.jatuhTempo);
                  const lunas = t.status === "lunas";
                  const tone = lunas ? "success" : hari < 0 ? "danger" : hari <= 3 ? "warning" : "neutral";
                  const pesan = `Halo ${t.nama_penyewa}, tagihan ${formatRupiah(t.nominal)} untuk ${t.kamar_nomor} periode ${t.periode} ${lunas ? "sudah tercatat lunas" : `jatuh tempo ${tanggalPendek(t.jatuhTempo)}`}. Terima kasih.`;
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.kamar_nomor}</td>
                      <td>{t.nama_penyewa}</td>
                      <td style={{ color: "var(--text-muted)" }}>{t.periode}</td>
                      <td className="tnum" style={{ textAlign: "right", fontWeight: 600 }}>
                        {formatRupiah(t.nominal)}
                      </td>
                      <td>{tanggalPendek(t.jatuhTempo)}</td>
                      <td>
                        <Badge tone={tone}>{lunas ? "Lunas" : labelJatuhTempo(hari)}</Badge>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          {!lunas && (
                            <Button size="sm" variant="success" onClick={() => handleBayar(t.id)} disabled={busy === t.id}>
                              {busy === t.id ? "..." : "Lunas"}
                            </Button>
                          )}
                          <a href={waLink(t.no_wa, pesan)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                            <Button size="sm" variant="secondary">WA</Button>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
