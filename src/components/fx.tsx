"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;
function ensureGsap() {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
}

/** Scan & animate unrevealed [data-reveal] elements. Re-runs when DOM grows (async data). */
function scanReveals(root: ParentNode) {
  const els = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])"));
  if (els.length === 0) return;
  els.forEach((el, i) => {
    el.dataset.revealed = "1";
    gsap.fromTo(
      el,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        delay: Math.min(i * 0.05, 0.3),
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
      }
    );
  });
  ScrollTrigger.refresh();
}

/**
 * Global motion layer (letakkan di dalam <main>):
 * - Page transition (fade+rise) saat `page` berubah.
 * - Auto-stagger blok utama halaman (anak langsung wrapper halaman).
 * - Scroll reveal untuk semua [data-reveal], termasuk yang muncul belakangan (async data).
 */
export function FX({ page }: { page?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    ensureGsap();
    const main = ref.current?.closest("main");
    if (!main) return;

    if (!firstRender.current) {
      gsap.fromTo(
        main,
        { opacity: 0.35, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", overwrite: "auto" }
      );
    }
    firstRender.current = false;

    const pageRoot = main.firstElementChild;
    if (pageRoot) {
      gsap.fromTo(
        Array.from(pageRoot.children),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power3.out", overwrite: "auto", clearProps: "transform" }
      );
    }

    scanReveals(main);
    const mo = new MutationObserver(() => scanReveals(main));
    mo.observe(main, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [page]);

  return <span ref={ref} style={{ display: "none" }} aria-hidden />;
}

/** Angka beranimasi (count-up) memakai gsap tween. */
export function CountUp({
  value,
  format = (n: number) => String(Math.round(n)),
  duration = 0.9,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const prev = useRef(0);
  const fmt = useRef(format);

  useEffect(() => {
    fmt.current = format;
    ensureGsap();
    const el = ref.current;
    if (!el) return;
    const obj = { n: prev.current };
    const tween = gsap.to(obj, {
      n: value,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = fmt.current(obj.n);
      },
    });
    prev.current = value;
    return () => {
      tween.kill();
    };
    // format disimpan di ref; identitas tak stabil (default param) → sengaja tak masuk deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span ref={ref}>{format(value)}</span>;
}
