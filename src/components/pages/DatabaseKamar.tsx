"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { fetchKamar, formatRupiah, waLink, createKamar, updateKamar, deleteKamar, type RoomRow } from "@/lib/api";
import { tanggalPendek } from "@/lib/format";
import { useIdentitas } from "@/lib/identitas";
import { useApi } from "@/lib/useApi";

const EMPTY_ROWS: RoomRow[] = [];

type Filter = "semua" | "terisi" | "tersedia";

interface Props {
  onSelectPenyewa?: (id: number) => void;
}

export function DatabaseKamar({ onSelectPenyewa }: Props) {
  const { data, loading, error, reload } = useApi<RoomRow[]>(() => fetchKamar());
  const identitas = useIdentitas();
  const [filter, setFilter] = useState<Filter>("semua");
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNomor, setEditNomor] = useState("");
  const [editHarga, setEditHarga] = useState("");
  const [editErr, setEditErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addNomor, setAddNomor] = useState("");
  const [addHarga, setAddHarga] = useState("");
  const [addErr, setAddErr] = useState<string | null>(null);

  const rows = data ?? EMPTY_ROWS;

  function mulaiEdit(r: RoomRow) {
    setEditingId(r.kamar.id);
    setEditNomor(r.kamar.nomor);
    setEditHarga(String(r.kamar.hargaSewa));
    setEditErr(null);
  }

  async function simpanEdit() {
    if (editingId === null) return;
    const harga = Number(editHarga);
    if (!editNomor.trim() || !Number.isSafeInteger(harga) || harga <= 0) {
      setEditErr("Nomor dan harga (angka > 0) wajib benar.");
      return;
    }
    setSaving(true);
    setEditErr(null);
    try {
      await updateKamar(editingId, { nomor: editNomor.trim(), hargaSewa: harga });
      setEditingId(null);
      reload();
    } catch (err) {
      setEditErr(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function simpanTambah() {
    const harga = Number(addHarga);
    if (!addNomor.trim() || !Number.isSafeInteger(harga) || harga <= 0) {
      setAddErr("Nomor dan harga (angka > 0) wajib benar.");
      return;
    }
    setSaving(true);
    setAddErr(null);
    try {
      await createKamar({ nomor: addNomor.trim(), hargaSewa: harga });
      setShowAdd(false);
      setAddNomor("");
      setAddHarga("");
      reload();
    } catch (err) {
      setAddErr(err instanceof Error ? err.message : "Gagal menambah kamar");
    } finally {
      setSaving(false);
    }
  }

  async function hapus(r: RoomRow) {
    if (!window.confirm(`Hapus ${r.kamar.nomor}? Tindakan ini tidak bisa dibatalkan.`)) return;
    setSaving(true);
    try {
      await deleteKamar(r.kamar.id);
      reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus kamar");
    } finally {
      setSaving(false);
    }
  }


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
              borderRadius: "calc(var(--radius-shadcn) - 2px)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              border: `1px solid ${filter === f ? "var(--primary)" : "var(--shadcn-border)"}`,
              background: filter === f ? "var(--primary)" : "var(--card)",
              color: filter === f ? "var(--primary-foreground)" : "var(--foreground)",
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
        <Button variant="primary" onClick={() => { setShowAdd((v) => !v); setAddErr(null); }}>
          {showAdd ? "Batal" : "Tambah Kamar"}
        </Button>
      </div>

      {showAdd && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 10, alignItems: "end" }} className="grid-2">
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Nomor kamar</div>
              <input value={addNomor} onChange={(e) => setAddNomor(e.target.value)} placeholder="Kamar 7" aria-label="Nomor kamar baru" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Harga sewa per bulan</div>
              <input value={addHarga} onChange={(e) => setAddHarga(e.target.value)} placeholder="750000" inputMode="numeric" aria-label="Harga sewa kamar baru" />
            </div>
            <Button variant="primary" onClick={simpanTambah} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Batal</Button>
          </div>
          {addErr && (
            <div role="alert" style={{ marginTop: 10, color: "var(--danger)", fontSize: 13 }}>{addErr}</div>
          )}
        </Card>
      )}

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
                    <td style={{ fontWeight: 600 }}>
                      {editingId === r.kamar.id ? (
                        <input value={editNomor} onChange={(e) => setEditNomor(e.target.value)} aria-label="Nomor kamar" style={{ width: 100 }} />
                      ) : (
                        r.kamar.nomor
                      )}
                    </td>
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
                      {editingId === r.kamar.id ? (
                        <input value={editHarga} onChange={(e) => setEditHarga(e.target.value)} inputMode="numeric" aria-label="Harga sewa" style={{ width: 100, textAlign: "right" }} />
                      ) : (
                        formatRupiah(r.kamar.hargaSewa)
                      )}
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
                      {editingId === r.kamar.id ? (
                        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          {editErr && <span style={{ color: "var(--danger)", fontSize: 12 }}>{editErr}</span>}
                          <Button size="sm" variant="primary" onClick={simpanEdit} disabled={saving}>
                            {saving ? "…" : "Simpan"}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>Batal</Button>
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", gap: 6 }}>
                          <Button size="sm" variant="secondary" onClick={() => mulaiEdit(r)}>Edit</Button>
                          {r.kamar.status === "tersedia" && (
                            <Button size="sm" variant="secondary" onClick={() => hapus(r)} disabled={saving}>
                              Hapus
                            </Button>
                          )}
                          {r.penyewa && (
                            <a
                              href={waLink(
                                r.penyewa.noWa,
                                `Halo ${r.penyewa.nama}, kami dari pengelola ${identitas.namaKos} ingin mengingatkan sewa ${r.kamar.nomor}.`
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
                        </span>
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
