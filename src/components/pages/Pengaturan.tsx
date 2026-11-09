"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, PageHeader, SectionTitle, Skeleton } from "@/components/ui";
import { notifyIdentitasChanged } from "@/lib/identitas";
import { renameKategori } from "@/lib/api";

interface Settings {
  kategori_pengeluaran?: string[];
  nama_kos?: string;
  alamat?: string;
  nama_pemilik?: string;
  auto_bayar?: boolean;
  [key: string]: unknown;
}

export function PengaturanPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newKat, setNewKat] = useState("");
  const [editKat, setEditKat] = useState<string | null>(null);
  const [editKatVal, setEditKatVal] = useState("");
  const [katErr, setKatErr] = useState<string | null>(null);
  const [namaKos, setNamaKos] = useState("");
  const [alamat, setAlamat] = useState("");
  const [namaPemilik, setNamaPemilik] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pengaturan", { cache: "no-store" });
      if (!res.ok) throw new Error(`Gagal memuat pengaturan (${res.status})`);
      const json = (await res.json()) as Settings;
      setSettings(json);
      setNamaKos(json.nama_kos ?? "");
      setAlamat(json.alamat ?? "");
      setNamaPemilik(json.nama_pemilik ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function simpan(key: string, value: unknown) {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/pengaturan?key=${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Gagal menyimpan");
      }
      setSettings((s) => (s ? { ...s, [key]: value } : s));
      notifyIdentitasChanged();
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } finally {
      setSaving(false);
    }
  }

  const kategori = settings?.kategori_pengeluaran ?? [];

  function tambahKategori() {
    const v = newKat.trim();
    if (!v || kategori.includes(v)) return;
    void simpan("kategori_pengeluaran", [...kategori, v]);
    setNewKat("");
  }

  function hapusKategori(kat: string) {
    void simpan("kategori_pengeluaran", kategori.filter((k) => k !== kat));
  }

  async function simpanRename() {
    if (!editKat) return;
    const v = editKatVal.trim();
    setKatErr(null);
    if (!v || v === editKat) {
      setEditKat(null);
      return;
    }
    if (kategori.includes(v)) {
      setKatErr("Kategori sudah ada");
      return;
    }
    try {
      const res = await renameKategori(editKat, v);
      setSettings((s) => (s ? { ...s, kategori_pengeluaran: res.kategori_pengeluaran ?? kategori.map((k) => (k === editKat ? v : k)) } : s));
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
      setEditKat(null);
    } catch (err) {
      setKatErr(err instanceof Error ? err.message : "Gagal mengganti kategori");
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Pengaturan" />
        <Card><Skeleton height={100} /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Pengaturan"
        sub="Identitas kos dan kategori pengeluaran"
        actions={saved ? <Badge tone="success">Tersimpan</Badge> : undefined}
      />

      {error && (
        <Card style={{ marginBottom: 16 }}>
          <EmptyState>{error}</EmptyState>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="grid-2">
        <Card>
          <SectionTitle sub="Tampil di sidebar dan laporan">Identitas Kos</SectionTitle>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="set-nama" style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", marginBottom: 5 }}>
              Nama kos
            </label>
            <input id="set-nama" value={namaKos} onChange={(e) => setNamaKos(e.target.value)} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="set-alamat" style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", marginBottom: 5 }}>
              Alamat
            </label>
            <input id="set-alamat" value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Opsional" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label htmlFor="set-pemilik" style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", marginBottom: 5 }}>
              Nama pemilik
            </label>
            <input id="set-pemilik" value={namaPemilik} onChange={(e) => setNamaPemilik(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="primary"
              disabled={saving}
              onClick={async () => {
                await simpan("nama_kos", namaKos);
                await simpan("alamat", alamat);
                await simpan("nama_pemilik", namaPemilik);
              }}
            >
              {saving ? "Menyimpan…" : "Simpan Identitas"}
            </Button>
          </div>
        </Card>

        <Card>
          <SectionTitle sub="Dipakai di form pengeluaran dan laporan">Kategori Pengeluaran</SectionTitle>
          {kategori.length === 0 ? (
            <EmptyState>Belum ada kategori</EmptyState>
          ) : (
            <div style={{ marginBottom: 14 }}>
              {kategori.map((kat) => (
                <div
                  key={kat}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontSize: 13.5, flex: 1 }}>
                    {editKat === kat ? (
                      <input
                        value={editKatVal}
                        onChange={(e) => setEditKatVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void simpanRename();
                          }
                          if (e.key === "Escape") setEditKat(null);
                        }}
                        autoFocus
                        aria-label="Nama kategori baru"
                        style={{ width: "100%", maxWidth: 220 }}
                      />
                    ) : (
                      kat
                    )}
                  </span>
                  <span style={{ display: "inline-flex", gap: 6 }}>
                    {editKat === kat ? (
                      <>
                        <Button size="sm" variant="primary" onClick={() => void simpanRename()} disabled={saving}>
                          Simpan
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditKat(null)}>
                          Batal
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditKat(kat);
                            setEditKatVal(kat);
                            setKatErr(null);
                          }}
                          disabled={saving}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => hapusKategori(kat)} disabled={saving}>
                          Hapus
                        </Button>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
          {katErr && (
            <div role="alert" style={{ fontSize: 12.5, color: "var(--danger)", marginTop: 6 }}>{katErr}</div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newKat}
              onChange={(e) => setNewKat(e.target.value)}
              placeholder="Kategori baru…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  tambahKategori();
                }
              }}
              aria-label="Kategori baru"
            />
            <Button variant="primary" onClick={tambahKategori} disabled={saving || !newKat.trim()}>
              Tambah
            </Button>
          </div>
        </Card>

        <Card>
          <SectionTitle sub="Tandai lunas otomatis tagihan bulan berjalan">Bayar Otomatis Bulanan</SectionTitle>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, maxWidth: 420 }}>
              Saat aktif, tagihan yang belum lunas akan otomatis ditandai lunas begitu aplikasi dibuka (sekali per periode).
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!settings?.auto_bayar}
              onClick={() => void simpan("auto_bayar", !settings?.auto_bayar)}
              style={{
                flexShrink: 0,
                width: 44,
                height: 24,
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background: settings?.auto_bayar ? "var(--primary)" : "var(--border-strong)",
                position: "relative",
                transition: "background 160ms",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: settings?.auto_bayar ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "var(--primary-foreground)",
                  transition: "left 160ms",
                }}
              />
            </button>
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: 16 }}>
        <SectionTitle>Tentang KostKu</SectionTitle>
        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.8 }}>
          <div>Versi 1.0 — dashboard manajemen kos.</div>
          <div>Data disimpan di SQLite lokal pada server ini.</div>
        </div>
      </Card>
    </div>
  );
}
