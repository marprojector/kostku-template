"use client";

import { useSyncExternalStore } from "react";

/**
 * "Sekarang" versi client-only.
 *
 * `getServerSnapshot` mengembalikan string kosong supaya prerender tidak
 * menyentuh waktu nyata; React memakai snapshot client setelah hydration.
 */
const subscribe = () => () => {};

let cachedBulan: string | null = null;
let cachedTanggal: string | null = null;

function getBulanSnapshot(): string {
  if (cachedBulan === null) {
    cachedBulan = new Date().toISOString().slice(0, 7);
  }
  return cachedBulan;
}

function getTanggalSnapshot(): string {
  if (cachedTanggal === null) {
    cachedTanggal = new Date().toISOString().slice(0, 10);
  }
  return cachedTanggal;
}

const getEmptySnapshot = () => "";

/** "YYYY-MM" — string kosong selama prerender. */
export function useBulanIni(): string {
  return useSyncExternalStore(subscribe, getBulanSnapshot, getEmptySnapshot);
}

/** "YYYY-MM-DD" — string kosong selama prerender. */
export function useTanggalIni(): string {
  return useSyncExternalStore(subscribe, getTanggalSnapshot, getEmptySnapshot);
}
