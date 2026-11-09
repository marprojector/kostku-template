"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, PageHeader, SectionTitle, Skeleton } from "@/components/ui";
import { createTransaksi, deleteTransaksi, fetchTransaksi, formatRupiah, updateTransaksi, type Transaksi } from "@/lib/api";
import { tanggalPendek } from "@/lib/format";
import { normalizeKategori, type KategoriItem } from "@/lib/kategori";
import { useApi } from "@/lib/useApi";
import { useBulanIni } from "@/lib/useNow";

const EMPTY_TRANSAKSI: Transaksi[] = [];
const EMPTY_KATEGORI: KategoriItem[] = [];
const KATEGORI_PEMASUKAN = ["Sewa", "Deposit", "Lainnya"];

interface FormTransaksi {
  tipe: "pemasukan" | "pengeluaran";
  kategori: string;
  nominal: string;
  tanggal: string;
  keterangan: string;
}

function formKosong(): FormTransaksi {
  return { tipe: "pengeluaran", kategori: "", nominal: "", tanggal: new Date().toLocaleDateString("sv-SE"), keterangan: "" };
}

export function TransaksiPage() {
  const bulanIni = useBulanIni();
  const { data, loading, error, reload } = useApi<Transaksi[]>(() => fetchTransaksi());
  const [tipeFilter, setTipeFilter] = useState<"semua" | "pemasukan" | "pengeluaran">("semua");
  const [q, setQ] = useState("");
  const [kategori, setKategori] = useState<KategoriItem[]>(EMPTY_KATEGORI);
  const [form, setForm] = useState<FormTransaksi>(formKosong);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);

  useEffect(() => {
    fetch("/api/pengaturan", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { kategori_pengeluaran?: unknown } | null) => {
        if (j?.kategori_pengeluaran) setKategori(normalizeKategori(j.kategori_pengeluaran));
      })
      .catch(() => {});
  }, []);

  /** Opsi kategori sesuai tipe: pengeluaran dari settings, pemasukan tetap. */
  function opsiKategori(tipe: FormTransaksi["tipe"]): string[] {
    return tipe === "pengeluaran" ? kategori.map((k) => k.nama) : KATEGORI_PEMASUKAN;
  }

  const pilihKategori = form.kategori || opsiKategori(form.tipe)[0] || "";

  /** Pilih kategori: isi nominal dari harga default (bisa diedit = "ganti harga"). */
  function gantiKategori(nama: string) {
    setForm((f) => {
      const harga = kategori.find((k) => k.nama === nama)?.harga ?? 0;
      const isiHarga = harga > 0 && (!f.nominal || Number(f.nominal.replace(/[^\d]/g, "")) === 0);
      return { ...f, kategori: nama, nominal: isiHarga ? String(harga) : f.nominal };
    });
  }

  function gantiTipe(tipe: FormTransaksi["tipe"]) {
    setForm((f) => ({ ...f, tipe, kategori: "" }));
  }

  function resetForm() {
    setForm(formKosong());
    setEditingId(null);
    setFormErr(null);
  }

  async function simpanForm() {
    const nominal = Number(form.nominal.replace(/[^\d]/g, ""));
    setFormErr(null);
    if (!pilihKategori) {
      setFormErr("Pilih atau isi kategori dulu.");
      return;
    }
    if (!Number.isSafeInteger(nominal) || nominal < 0) {
      setFormErr("Nominal harus angka (mis. 150000).");
      return;
    }
    if (!form.tanggal) {
      setFormErr("Tanggal wajib diisi.");
      return;
    }
    setSavingForm(true);
    try {
      const payload = {
        tipe: form.tipe,
        kategori: pilihKategori,
        nominal,
        tanggal: form.tanggal,
        keterangan: form.keterangan,
      };
      if (editingId !== null) {
        await updateTransaksi(editingId, payload);
      } else {
        await createTransaksi(payload);
      }
      resetForm();
      await reload();
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : "Gagal menyimpan transaksi");
    } finally {
      setSavingForm(false);
    }
  }

  function mulaiEdit(t: Transaksi) {
    setEditingId(t.id);
    setForm({
      tipe: t.tipe,
      kategori: t.kategori ?? "",
      nominal: String(t.nominal),
      tanggal: t.tanggal,
      keterangan: t.keterangan ?? "",
    });
    setFormErr(null);
  }

  async function hapusTransaksi(id: number) {
    if (!window.confirm("Hapus transaksi ini?")) return;
    try {
      await deleteTransaksi(id);
      await reload();
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : "Gagal menghapus transaksi");
    }
  }

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

      <Card style={{ marginBottom: 16 }}>
        <SectionTitle sub={editingId !== null ? `Mengubah transaksi #${editingId}` : "Pemasukan atau pengeluaran"}>
          {editingId !== null ? "Edit Transaksi" : "Catat Transaksi"}
        </SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          <div>
            <label htmlFor="trx-tipe" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
              Jenis
            </label>
            <select
              id="trx-tipe"
              value={form.tipe}
              onChange={(e) => gantiTipe(e.target.value as FormTransaksi["tipe"])}
              style={{ width: "100%" }}
            >
              <option value="pengeluaran">Pengeluaran</option>
              <option value="pemasukan">Pemasukan</option>
            </select>
          </div>
          <div>
            <label htmlFor="trx-kategori" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
              Kategori
            </label>
            <select
              id="trx-kategori"
              value={pilihKategori}
              onChange={(e) => gantiKategori(e.target.value)}
              style={{ width: "100%" }}
            >
              {opsiKategori(form.tipe).length === 0 && <option value="">— isi manual —</option>}
              {opsiKategori(form.tipe).map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
              {form.kategori && !opsiKategori(form.tipe).includes(form.kategori) && (
                <option value={form.kategori}>{form.kategori}</option>
              )}
            </select>
          </div>
          <div>
            <label htmlFor="trx-nominal" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
              Harga / Nominal (Rp)
            </label>
            <input
              id="trx-nominal"
              value={form.nominal}
              onChange={(e) => setForm((f) => ({ ...f, nominal: e.target.value }))}
              inputMode="numeric"
              placeholder="mis. 150000"
            />
          </div>
          <div>
            <label htmlFor="trx-tanggal" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
              Tanggal
            </label>
            <input
              id="trx-tanggal"
              type="date"
              value={form.tanggal}
              onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="trx-ket" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
              Keterangan
            </label>
            <input
              id="trx-ket"
              value={form.keterangan}
              onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
              placeholder="Opsional"
            />
          </div>
        </div>
        {formErr && (
          <div role="alert" style={{ fontSize: 12.5, color: "var(--danger)", marginTop: 8 }}>{formErr}</div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Button variant="primary" onClick={() => void simpanForm()} disabled={savingForm}>
            {savingForm ? "Menyimpan…" : editingId !== null ? "Simpan Perubahan" : "Simpan Transaksi"}
          </Button>
          {editingId !== null && (
            <Button variant="secondary" onClick={resetForm}>Batal</Button>
          )}
        </div>
      </Card>

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
            <table style={{ minWidth: 680 }}>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Tipe</th>
                  <th>Kategori</th>
                  <th style={{ textAlign: "right" }}>Nominal</th>
                  <th>Keterangan</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
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
                    <td style={{ textAlign: "right" }}>
                      <span style={{ display: "inline-flex", gap: 6 }}>
                        <Button size="sm" variant="secondary" onClick={() => mulaiEdit(t)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => void hapusTransaksi(t.id)}>
                          Hapus
                        </Button>
                      </span>
                    </td>
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
