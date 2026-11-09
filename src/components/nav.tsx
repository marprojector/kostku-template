"use client";

import type { ReactNode } from "react";

export type PageId =
  | "dashboard"
  | "modern"
  | "database"
  | "input-sewa"
  | "tagihan"
  | "tunggakan"
  | "laporan-bulanan"
  | "laporan-tahunan"
  | "transaksi"
  | "pengaturan";

interface Item {
  id: PageId;
  label: string;
}

interface Group {
  title: string;
  items: Item[];
}

export const NAV: Group[] = [
  {
    title: "Operasional",
    items: [
      { id: "dashboard", label: "Menu Utama" },
      { id: "modern", label: "Dashboard Modern" },
      { id: "database", label: "Database Kamar" },
      { id: "input-sewa", label: "Check-In Penyewa" },
    ],
  },
  {
    title: "Tagihan",
    items: [
      { id: "tagihan", label: "Tagihan & WhatsApp" },
      { id: "tunggakan", label: "Tunggakan & Masa Sewa" },
      { id: "transaksi", label: "Riwayat Transaksi" },
    ],
  },
  {
    title: "Laporan",
    items: [
      { id: "laporan-bulanan", label: "Laporan Bulanan" },
      { id: "laporan-tahunan", label: "Laporan Tahunan" },
      { id: "pengaturan", label: "Pengaturan" },
    ],
  },
];

/* Inline SVG icons — 18px, 1.6 stroke, currentColor */
const ICONS: Record<PageId, ReactNode> = {
  modern: (
    <>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="9.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="2.5" y="9.5" width="6" height="6" rx="1.5" />
      <rect x="9.5" y="9.5" width="6" height="6" rx="1.5" />
    </>
  ),
  dashboard: (
    <>
      <rect x="2.5" y="2.5" width="5.5" height="5.5" rx="1.4" />
      <rect x="10" y="2.5" width="5.5" height="5.5" rx="1.4" />
      <rect x="2.5" y="10" width="5.5" height="5.5" rx="1.4" />
      <rect x="10" y="10" width="5.5" height="5.5" rx="1.4" />
    </>
  ),
  database: (
    <>
      <rect x="2.5" y="2.5" width="13" height="4" rx="1.3" />
      <rect x="2.5" y="7.5" width="13" height="4" rx="1.3" />
      <rect x="2.5" y="12.5" width="13" height="4" rx="1.3" />
    </>
  ),
  "input-sewa": (
    <>
      <circle cx="9" cy="6" r="2.6" />
      <path d="M3.5 15.5c0-2.6 2.4-4.3 5.5-4.3s5.5 1.7 5.5 4.3" />
      <path d="M13.6 4.2h3.2M15.2 2.6v3.2" />
    </>
  ),
  tagihan: (
    <>
      <path d="M3.5 2.5h7l4 4v9a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z" />
      <path d="M10.5 2.5v4h4" />
      <path d="M6 10.5h6M6 13h4" />
    </>
  ),
  tunggakan: (
    <>
      <circle cx="9" cy="9" r="6.5" />
      <path d="M9 5.4V9l2.4 1.6" />
    </>
  ),
  transaksi: (
    <>
      <path d="M2.5 5.5h13l-2.6-2.6M15.5 12.5h-13l2.6 2.6" />
    </>
  ),
  "laporan-bulanan": (
    <>
      <rect x="2.5" y="3.5" width="13" height="12" rx="1.6" />
      <path d="M2.5 7h13M6.5 1.8v3M11.5 1.8v3" />
    </>
  ),
  "laporan-tahunan": (
    <>
      <path d="M3 15V8M7 15V4M11 15v-5M15 15V6" />
    </>
  ),
  pengaturan: (
    <>
      <circle cx="9" cy="9" r="2.4" />
      <path d="M9 1.8v2M9 14.2v2M1.8 9h2M14.2 9h2M3.9 3.9l1.4 1.4M12.7 12.7l1.4 1.4M14.1 3.9l-1.4 1.4M5.3 12.7l-1.4 1.4" />
    </>
  ),
};

export function NavIcon({ id }: { id: PageId }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {ICONS[id]}
    </svg>
  );
}
