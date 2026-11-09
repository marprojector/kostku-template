"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";

export function LoginGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"checking" | "guest" | "authed">("checking");
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
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Memeriksa sesi…</div>
      </div>
    );
  }

  if (state === "guest") {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          background: "var(--bg)",
          padding: 20,
        }}
      >
        <Card style={{ width: "100%", maxWidth: 400, padding: 30, boxShadow: "var(--shadow-pop)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 6 }}>
            <div className="kostku-brandmark" aria-hidden="true">K</div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, color: "var(--foreground)" }}>
                <span style={{ color: "var(--primary)" }}>Kost</span>Ku
              </div>
              <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 1 }}>Kos Perajin</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 22 }}>
            Masuk untuk mengelola Kos Perajin
          </div>

          <form onSubmit={submit}>
            <div style={{ marginBottom: 12 }}>
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
            <div style={{ marginBottom: 16 }}>
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
                  background: "color-mix(in srgb, var(--destructive) 12%, transparent)",
                  color: "var(--destructive)",
                  border: "1px solid color-mix(in srgb, var(--destructive) 30%, transparent)",
                  padding: "9px 12px",
                  borderRadius: "var(--radius-shadcn)",
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" disabled={submitting} style={{ width: "100%" }}>
              {submitting ? "Memeriksa…" : "Masuk"}
            </Button>
          </form>

          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 16, lineHeight: 1.7 }}>
            Kredensial diatur lewat environment variable
            <br />
            <code style={{ fontSize: 11 }}>OWNER_USERNAME</code> dan <code style={{ fontSize: 11 }}>OWNER_PASSWORD</code>.
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

const labelStyle = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--muted-foreground)",
  marginBottom: 5,
} as const;
