"use client";

/* ============================================================
   KostKu Logo — aset resmi (ikon + wordmark + tagline).
   Varian:
   - "icon"    : ikon saja (favicon, avatar brand)
   - "compact" : ikon + wordmark (sidebar, topbar)
   - "full"    : ikon + wordmark + tagline (login, halaman brand)
   Varian full/compact punya pasangan light/dark (teks diganti
   otomatis mengikuti tema lewat CSS, aset resmi tidak diubah).
   ============================================================ */

const SRC = {
  full: { light: "/logo-full.png", dark: "/logo-full-dark.png" },
  compact: { light: "/logo-compact.png", dark: "/logo-compact-dark.png" },
  icon: { light: "/logo-icon.png", dark: "/logo-icon.png" },
} as const;

export type KostKuLogoVariant = keyof typeof SRC;

export function KostKuLogo({
  variant = "compact",
  height = 36,
  className,
}: {
  variant?: KostKuLogoVariant;
  /** Tinggi render dalam px */
  height?: number;
  className?: string;
}) {
  const src = SRC[variant];
  const style: React.CSSProperties = { height, width: "auto" };
  if (variant === "icon") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src.light} alt="KostKu" className={className} style={{ ...style, height, width: height }} />
    );
  }
  return (
    <span className={className} style={{ display: "inline-flex", lineHeight: 0 }} aria-label="KostKu">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src.light} alt="KostKu" className={`kostku-logo-light ${className ?? ""}`} style={style} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src.dark} alt="" aria-hidden="true" className={`kostku-logo-dark ${className ?? ""}`} style={style} />
    </span>
  );
}
