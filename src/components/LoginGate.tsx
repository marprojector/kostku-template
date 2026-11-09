"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { BedDouble, Receipt, TrendingUp } from "lucide-react";
import { useIdentitas } from "@/lib/identitas";

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--foreground)",
  marginBottom: 6,
} as const;

export function LoginGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"checking" | "guest" | "authed">("checking");
  const identitas = useIdentitas();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => ({ ok: res.ok }))
      .catch(() => ({ ok: false }))
      .then(({ ok }) => {
        if (active) setState(ok ? "authed" : "guest");
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Gagal masuk");
      }
      setState("authed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk");
    } finally {
      setSubmitting(false);
    }
  }

  if (state === "checking") {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "var(--bg)" }}>
        <div style={{ fontSize: 13, color: "var(--muted-foreground)" }}>Memeriksa sesi…</div>
      </div>
    );
  }

  if (state === "guest") {
    return (
      <div
        style={{
          display: "grid",
          minHeight: "100vh",
          background: "var(--bg)",
        }}
        className="kostku-login"
      >
        {/* Panel brand — desktop saja */}
        <aside
          className="kostku-login-brand"
          style={{
            display: "none",
            background: "var(--primary)",
            color: "#fff",
            padding: "56px 48px",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ background: "#fff", borderRadius: 9, padding: 5, display: "inline-flex", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Logo KostKu" style={{ height: 30, width: "auto", borderRadius: 5 }} />
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>KostKu</div>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.03em", maxWidth: 420 }}>
              Kelola kos lebih tenang, dari mana saja.
            </div>
            <div style={{ display: "grid", gap: 18, marginTop: 34, maxWidth: 380 }}>
              {[
                { icon: <BedDouble size={17} />, title: "Peta kamar real-time", sub: "Status okupansi dan tagihan tiap kamar sekali lihat." },
                { icon: <Receipt size={17} />, title: "Tagihan & WhatsApp", sub: "Generate tagihan bulanan dan kirim pengingat otomatis." },
                { icon: <TrendingUp size={17} />, title: "Laporan keuangan", sub: "Arus kas, laba, dan tunggakan dalam satu dashboard." },
              ].map((f) => (
                <div key={f.title} style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {f.icon}
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{f.title}</div>
                    <div style={{ fontSize: 12.5, opacity: 0.75, marginTop: 2 }}>{f.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{identitas.namaKos} · {identitas.namaPemilik}</div>
        </aside>

        {/* Form */}
        <main style={{ display: "grid", placeItems: "center", padding: "24px 20px" }}>
          <div className="kostku-fade-up" style={{ width: "100%", maxWidth: 380 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Logo KostKu" style={{ height: 40, width: "auto", borderRadius: 8 }} />
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, color: "var(--foreground)" }}>
                  KostKu
                </div>
                <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 2 }}>
                  {identitas.namaKos}
                </div>
              </div>
            </div>

            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 6px", color: "var(--foreground)" }}>
              Masuk ke akun Anda
            </h1>
            <p style={{ fontSize: 13.5, color: "var(--muted-foreground)", margin: "0 0 22px" }}>
              Lanjutkan mengelola {identitas.namaKos}.
            </p>

            <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
              <div>
                <label htmlFor="login-email" style={labelStyle}>Username</label>
                <input
                  id="login-email"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="login-password" style={labelStyle}>Password</label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div
                  role="alert"
                  style={{
                    background: "color-mix(in srgb, var(--destructive) 10%, transparent)",
                    color: "var(--destructive)",
                    border: "1px solid color-mix(in srgb, var(--destructive) 28%, transparent)",
                    padding: "9px 12px",
                    borderRadius: "var(--radius-shadcn)",
                    fontSize: 13,
                  }}
                >
                  {error}
                </div>
              )}

              <Button type="submit" variant="primary" disabled={submitting} style={{ width: "100%", height: 40 }}>
                {submitting ? "Memeriksa…" : "Masuk"}
              </Button>
            </form>

            <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 18, lineHeight: 1.7 }}>
              Kredensial diatur lewat environment variable
              <br />
              <code style={{ fontSize: 11 }}>OWNER_USERNAME</code> dan <code style={{ fontSize: 11 }}>OWNER_PASSWORD</code>.
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
