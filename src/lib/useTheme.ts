"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "kostku-theme";
const EVENT = "kostku-theme-change";

function readTheme(): Theme {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): Theme {
  return readTheme();
}

function getServerSnapshot(): Theme {
  return "light";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const apply = useCallback((next: Theme) => {
    const root = document.documentElement;

    // Matikan transisi selama pergantian tema supaya tidak "smear".
    const freeze = document.createElement("style");
    freeze.textContent = "*,*::before,*::after{transition:none !important}";
    document.head.appendChild(freeze);

    root.setAttribute("data-theme", next);
    window.localStorage.setItem(STORAGE_KEY, next);

    void root.offsetHeight; // paksa reflow
    requestAnimationFrame(() => {
      freeze.remove();
    });

    window.dispatchEvent(new Event(EVENT));
  }, []);

  // Sinkronkan atribut DOM saat tema berubah dari luar komponen ini.
  if (typeof document !== "undefined") {
    const current = document.documentElement.getAttribute("data-theme");
    if (current !== theme) document.documentElement.setAttribute("data-theme", theme);
  }

  return {
    theme,
    setTheme: apply,
    toggle: () => apply(readTheme() === "light" ? "dark" : "light"),
    mounted: true,
  };
}
