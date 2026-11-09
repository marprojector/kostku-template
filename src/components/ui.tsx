"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ============================================================
   Primitif UI KostKu — gaya shadcn/ui (rounded-lg, ring focus,
   muted foreground, subtle shadow). Dipakai di semua halaman.
   ============================================================ */

/* ---------- Card ---------- */
export function Card({
  children,
  style,
  className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--shadcn-border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-none",
        className
      )}
      style={{ padding: "20px", ...style }}
    >
      {children}
    </div>
  );
}

/* ---------- Section title ---------- */
export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--foreground)" }}>{children}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 20,
        flexWrap: "wrap",
      }}
    >
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: "-0.02em", color: "var(--foreground)" }}>{title}</h1>
        {sub && <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 4 }}>{sub}</div>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>}
    </div>
  );
}

/* ---------- Badge ---------- */
type BadgeTone = "neutral" | "success" | "warning" | "danger" | "primary";

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: "var(--muted)", fg: "var(--muted-foreground)" },
  success: { bg: "color-mix(in srgb, var(--success) 14%, transparent)", fg: "var(--success)" },
  warning: { bg: "color-mix(in srgb, var(--warning) 16%, transparent)", fg: "var(--warning)" },
  danger: { bg: "color-mix(in srgb, var(--danger) 12%, transparent)", fg: "var(--danger)" },
  primary: { bg: "color-mix(in srgb, var(--primary) 12%, transparent)", fg: "var(--primary)" },
};

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  const { bg, fg } = TONES[tone];
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", className)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 600,
        background: bg,
        color: fg,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/* ---------- Button ---------- */
type Variant = "primary" | "secondary" | "ghost" | "success" | "danger";

const VARIANTS: Record<Variant, CSSProperties> = {
  primary: {
    background: "var(--primary)",
    color: "var(--primary-foreground)",
    border: "1px solid var(--primary)",
    boxShadow: "none",
  },
  secondary: {
    background: "var(--card)",
    color: "var(--foreground)",
    border: "1px solid var(--shadcn-border)",
    boxShadow: "none",
  },
  ghost: { background: "transparent", color: "var(--muted-foreground)", border: "1px solid transparent" },
  success: {
    background: "color-mix(in srgb, var(--success) 14%, transparent)",
    color: "var(--success)",
    border: "1px solid color-mix(in srgb, var(--success) 35%, transparent)",
  },
  danger: {
    background: "color-mix(in srgb, var(--danger) 12%, transparent)",
    color: "var(--danger)",
    border: "1px solid color-mix(in srgb, var(--danger) 35%, transparent)",
  },
};

export function Button({
  children,
  onClick,
  variant = "secondary",
  size = "md",
  type = "button",
  disabled,
  style,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: "sm" | "md";
  type?: "button" | "submit";
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className
      )}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: size === "sm" ? "5px 11px" : "9px 16px",
        fontSize: size === "sm" ? 12 : 13.5,
        fontWeight: 600,
        borderRadius: 8,
        whiteSpace: "nowrap",
        ...VARIANTS[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ---------- Stat ---------- */
export function Stat({
  label,
  value,
  sub,
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: { value: number; goodWhen: "up" | "down"; suffix?: string };
  accent?: string;
}) {
  const deltaPositive = delta && delta.value > 0;
  const deltaNeutral = delta && delta.value === 0;
  const isGood = delta
    ? deltaNeutral
      ? null
      : (delta.value > 0 && delta.goodWhen === "up") ||
        (delta.value < 0 && delta.goodWhen === "down")
    : null;
  const deltaColor =
    isGood === null ? "var(--muted-foreground)" : isGood ? "var(--success)" : "var(--danger)";

  return (
    <Card style={{ padding: "16px 18px", height: "100%" }}>
      <div style={{ fontSize: 12.5, color: "var(--muted-foreground)" }}>{label}</div>
      <div className="tnum" style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, lineHeight: 1.2, marginTop: 8, letterSpacing: "-0.02em", color: "var(--foreground)" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 4 }}>{sub}</div>}
      {delta && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            fontWeight: 600,
            marginTop: 8,
            padding: "2px 8px",
            borderRadius: 999,
            color: deltaColor,
            background: isGood === null ? "var(--muted)" : isGood ? "var(--success-bg)" : "var(--danger-bg)",
          }}
        >
          {deltaPositive ? "+" : ""}
          {delta.value.toFixed(1)}
          {delta.suffix ?? "%"}
        </div>
      )}
    </Card>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: "32px 20px",
        textAlign: "center",
        color: "var(--muted-foreground)",
        fontSize: 13,
        border: "1px dashed var(--shadcn-border)",
        borderRadius: "var(--radius-shadcn)",
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Skeleton ---------- */
export function Skeleton({ height = 16, width = "100%" }: { height?: number; width?: number | string }) {
  return (
    <div
      style={{
        height,
        width,
        background: "var(--muted)",
        borderRadius: 6,
        animation: "kostku-pulse 1.6s ease-in-out infinite",
      }}
    />
  );
}

/* ---------- Toast ---------- */
export function Toast({ message, tone = "success" }: { message: string; tone?: BadgeTone }) {
  const { bg, fg } = TONES[tone];
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: bg,
        color: fg,
        border: `1px solid color-mix(in srgb, ${fg} 30%, transparent)`,
        padding: "11px 20px",
        borderRadius: 10,
        fontSize: 13.5,
        fontWeight: 600,
        zIndex: 100,
        animation: "kostku-toast-in 200ms cubic-bezier(0.2, 0, 0, 1)",
      }}
    >
      {message}
    </div>
  );
}
