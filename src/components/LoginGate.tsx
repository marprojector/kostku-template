"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { KostKuLogo } from "@/components/KostKuLogo";
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
  const [needsSetup, setNeedsSetup] = useState(false);
  const identitas = useIdentitas();
  const [nama, setNama] = useState("");
  const [namaKos, setNamaKos] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" });
        if (me.ok) {
          if (active) setState("authed");
          return;
        }
        const res = await fetch("/api/auth/status", { cache: "no-store" });
        const json = res.ok ? ((await res.json()) as { needsSetup?: boolean }) : {};
        if (!active) return;
        setNeedsSetup(Boolean(json.needsSetup));
        setState("guest");
      } catch {
        if (active) {
          setNeedsSetup(false);
          setState("guest");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (needsSetup) {
      if (password.length < 8) {
        setError("Password minimal 8 karakter");
        return;
      }
      if (password !== confirm) {
        setError("Konfirmasi password tidak cocok");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(needsSetup ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(needsSetup ? { nama, namaKos, email, password } : { email, password }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? "Gagal memproses");
      }
      setState("authed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses");
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
            <span style={{ background: "#fff", borderRadius: 10, padding: "10px 14px", display: "inline-flex", boxShadow: "0 2px 10px rgba(0,0,0,0.14)" }}>
              <KostKuLogo variant="full" height={36} />
            </span>
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
          <div style={{ fontSize: 12, opacity: 0.7 }}>{identitas.namaKos || "KostKu"} · dibuat oleh Ammar</div>
        </aside>

        {/* Form */}
        <main style={{ display: "grid", placeItems: "center", padding: "24px 20px" }}>
          <div className="kostku-fade-up" style={{ width: "100%", maxWidth: 380 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginBottom: 24, textAlign: "center" }}>
              <KostKuLogo variant="full" height={44} />
              <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                {identitas.namaKos || "KostKu"}
              </div>
            </div>

            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 6px", color: "var(--foreground)", textAlign: "center" }}>
              {needsSetup ? "Buat akun owner" : "Masuk ke akun Anda"}
            </h1>
            <p style={{ fontSize: 13.5, color: "var(--muted-foreground)", margin: "0 0 22px", textAlign: "center" }}>
              {needsSetup
                ? "Instalasi baru. Akun pertama otomatis menjadi owner."
                : `Lanjutkan mengelola ${identitas.namaKos || "kos Anda"}.`}
            </p>

            <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
              {needsSetup && (
                <>
                  <div>
                    <label htmlFor="setup-nama" style={labelStyle}>Nama pemilik</label>
                    <input
                      id="setup-nama"
                      type="text"
                      autoComplete="name"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="setup-nama-kos" style={labelStyle}>Nama kos</label>
                    <input
                      id="setup-nama-kos"
                      type="text"
                      autoComplete="organization"
                      placeholder="Contoh: Kos Melati"
                      value={namaKos}
                      onChange={(e) => setNamaKos(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="login-email" style={labelStyle}>Email</label>
                <input
                  id="login-email"
                  type="email"
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
                  autoComplete={needsSetup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {needsSetup && (
                <div>
                  <label htmlFor="setup-confirm" style={labelStyle}>Konfirmasi password</label>
                  <input
                    id="setup-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
              )}

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
                {submitting ? "Memproses…" : needsSetup ? "Buat akun & mulai" : "Masuk"}
              </Button>
            </form>

            <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 18, lineHeight: 1.7, textAlign: "center" }}>
              Template KostKu · dibuat oleh Ammar
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
