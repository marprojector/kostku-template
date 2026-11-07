"use client";

import { useEffect, useState } from "react";
import { NAV, NavIcon, type PageId } from "@/components/nav";
import { Dashboard } from "@/components/pages/Dashboard";
import { DatabaseKamar } from "@/components/pages/DatabaseKamar";
import { CheckIn } from "@/components/pages/CheckIn";
import { Tagihan } from "@/components/pages/Tagihan";
import { Tunggakan } from "@/components/pages/Tunggakan";
import { TransaksiPage } from "@/components/pages/Transaksi";
import { LaporanBulananPage } from "@/components/pages/LaporanBulanan";
import { LaporanTahunanPage } from "@/components/pages/LaporanTahunan";
import { PengaturanPage } from "@/components/pages/Pengaturan";
import { PenyewaDetail } from "@/components/pages/PenyewaDetail";
import { useTheme } from "@/lib/useTheme";

export function Shell() {
  const [page, setPage] = useState<PageId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPenyewaId, setSelectedPenyewaId] = useState<number | null>(null);
  const { theme, toggle, mounted } = useTheme();
  const tanggal = "Jumat, 6 November 2026";

  function handleSelectPenyewa(id: number) {
    setSelectedPenyewaId(id);
  }

  function renderPage() {
    if (selectedPenyewaId !== null) {
      return <PenyewaDetail penyewaId={selectedPenyewaId} onBack={() => setSelectedPenyewaId(null)} />;
    }
    switch (page) {
      case "dashboard":
        return <Dashboard />;
      case "database":
        return <DatabaseKamar onSelectPenyewa={handleSelectPenyewa} />;
      case "input-sewa":
        return <CheckIn />;
      case "tagihan":
        return <Tagihan />;
      case "tunggakan":
        return <Tunggakan />;
      case "transaksi":
        return <TransaksiPage />;
      case "laporan-bulanan":
        return <LaporanBulananPage />;
      case "laporan-tahunan":
        return <LaporanTahunanPage />;
      case "pengaturan":
        return <PengaturanPage />;
      default:
        return <Dashboard />;
    }
  }

  useEffect(() => {
    function onResize() {
      if (window.innerWidth > 900) setSidebarOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <aside
        className="kostku-sidebar"
        data-open={sidebarOpen ? "true" : "false"}
        style={{
          width: "var(--sidebar-w)",
          flexShrink: 0,
          background: "var(--card-bg)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          inset: "0 auto 0 0",
          zIndex: 40,
        }}
      >
        <div style={{ padding: "18px 18px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="kostku-brandmark" aria-hidden="true">K</div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 16.5, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                <span style={{ color: "var(--primary)" }}>Kost</span>Ku
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>Kos Perajin</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "10px 10px 16px" }} aria-label="Navigasi utama">
          {NAV.map((group) => (
            <div key={group.title} style={{ marginBottom: 6 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.09em",
                  color: "var(--text-faint)",
                  padding: "12px 8px 6px",
                }}
              >
                {group.title}
              </div>
              {group.items.map((item) => {
                const active = page === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setPage(item.id)}
                    aria-current={active ? "page" : undefined}
                    className="kostku-navitem"
                  >
                    <NavIcon id={item.id} />
                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "grid", gap: 8 }}>
            <button
              onClick={toggle}
              aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                width: "100%",
                padding: "9px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                aria-hidden="true"
              >
                {mounted && theme === "dark" ? (
                  <>
                    <circle cx="9" cy="9" r="3.2" />
                    <path d="M9 2v1.6M9 14.4V16M2 9h1.6M14.4 9H16M4.2 4.2l1.1 1.1M12.7 12.7l1.1 1.1M13.8 4.2l-1.1 1.1M5.3 12.7l-1.1 1.1" />
                  </>
                ) : (
                  <path d="M14.5 11.2A6 6 0 0 1 6.8 3.5a6 6 0 1 0 7.7 7.7Z" />
                )}
              </svg>
              {mounted ? (theme === "dark" ? "Mode Terang" : "Mode Gelap") : "Tema"}
            </button>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.reload();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                width: "100%",
                padding: "9px 10px",
                borderRadius: 8,
                border: "1px solid transparent",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="kostku-overlay"
          aria-hidden="true"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.42)", zIndex: 35 }}
        />
      )}

      <div className="kostku-main" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            height: 58,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 20px",
            background: "var(--card-bg)",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Buka menu navigasi"
            aria-expanded={sidebarOpen}
            className="kostku-menu-btn"
            style={{
              display: "none",
              padding: 8,
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "transparent",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M2.5 4.5h13M2.5 9h13M2.5 13.5h13" />
            </svg>
          </button>
          <div style={{ flex: 1 }} />
          {selectedPenyewaId === null && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-muted)",
                background: "var(--surface-2)",
                padding: "5px 12px",
                borderRadius: 999,
                whiteSpace: "nowrap",
              }}
            >
              {NAV.flatMap((g) => g.items).find((i) => i.id === page)?.label ?? ""}
            </div>
          )}
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap" }} suppressHydrationWarning>
            {tanggal}
          </div>
        </header>

        <main className="kostku-sheet">{renderPage()}</main>
      </div>
    </div>
  );
}
