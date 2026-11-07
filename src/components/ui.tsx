"use client";

import type { CSSProperties, ReactNode } from "react";

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
      className={className}
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-card)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Section title ---------- */
export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 15.5, fontWeight: 700, letterSpacing: "-0.02em" }}>{children}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{sub}</div>}
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
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 23, fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>{title}</h1>
        {sub && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>}
    </div>
  );
}

/* ---------- Badge ---------- */
type BadgeTone = "neutral" | "success" | "warning" | "danger" | "primary";

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: "var(--surface-2)", fg: "var(--text-muted)" },
  success: { bg: "var(--success-bg)", fg: "var(--success)" },
  warning: { bg: "var(--warning-bg)", fg: "var(--warning)" },
  danger: { bg: "var(--danger-bg)", fg: "var(--danger)" },
  primary: { bg: "var(--primary-soft)", fg: "var(--primary)" },
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  const { bg, fg } = TONES[tone];
  return (
    <span
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
    background: "linear-gradient(180deg, color-mix(in srgb, var(--primary) 88%, #fff), var(--primary))",
    color: "#fff",
    border: "1px solid color-mix(in srgb, var(--primary) 80%, #000)",
    boxShadow: "0 1px 2px rgba(23,27,36,0.12), 0 4px 12px -4px var(--primary-ring)",
  },
  secondary: { background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow-kpi)" },
  ghost: { background: "transparent", color: "var(--text-muted)", border: "1px solid transparent" },
  success: { background: "var(--success-bg)", color: "var(--success)", border: "1px solid color-mix(in srgb, var(--success) 35%, transparent)" },
  danger: { background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid color-mix(in srgb, var(--danger) 35%, transparent)" },
};

export function Button({
  children,
  onClick,
  variant = "secondary",
  size = "md",
  type = "button",
  disabled,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: "sm" | "md";
  type?: "button" | "submit";
  disabled?: boolean;
  style?: CSSProperties;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: size === "sm" ? "5px 11px" : "9px 16px",
        fontSize: size === "sm" ? 12 : 13.5,
        fontWeight: 600,
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
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
  accent,
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
    isGood === null ? "var(--text-muted)" : isGood ? "var(--success)" : "var(--danger)";

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ height: 3, background: accent ?? "transparent", marginTop: -1 }} />
      <div style={{ padding: "13px 18px 16px" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-muted)",
          }}
        >
          {label}
        </div>
        <div className="tnum" style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, lineHeight: 1.12, marginTop: 6, letterSpacing: "-0.03em" }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
        {delta && (
          <div style={{ fontSize: 12, fontWeight: 600, marginTop: 5, color: deltaColor }}>
            {deltaPositive ? "+" : ""}
            {delta.value.toFixed(1)}
            {delta.suffix ?? "%"}
          </div>
        )}
      </div>
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
        color: "var(--text-muted)",
        fontSize: 13,
        border: "1px dashed var(--border-strong)",
        borderRadius: "var(--radius)",
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
        background: "var(--surface-2)",
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
