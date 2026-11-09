"use client";

import { useCallback, useEffect, useState } from "react";

export interface Identitas {
  namaKos: string;
  alamat: string;
  namaPemilik: string;
}

export const DEFAULT_IDENTITAS: Identitas = {
  namaKos: "Kos Perajin",
  alamat: "",
  namaPemilik: "Ammar",
};

const EVENT = "kostku:identitas-changed";

/** Panggil setelah menyimpan Pengaturan agar semua halaman refresh. */
export function notifyIdentitasChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function useIdentitas() {
  const [data, setData] = useState<Identitas>(DEFAULT_IDENTITAS);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/pengaturan", { cache: "no-store" });
      if (!res.ok) return;
      const j = (await res.json()) as Record<string, unknown>;
      setData({
        namaKos: typeof j.nama_kos === "string" && j.nama_kos.trim() ? j.nama_kos : DEFAULT_IDENTITAS.namaKos,
        alamat: typeof j.alamat === "string" ? j.alamat : "",
        namaPemilik: typeof j.nama_pemilik === "string" && j.nama_pemilik.trim() ? j.nama_pemilik : DEFAULT_IDENTITAS.namaPemilik,
      });
    } catch {
      /* biarkan default */
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    window.addEventListener(EVENT, load);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(EVENT, load);
    };
  }, [load]);

  return { ...data, reload: load };
}
