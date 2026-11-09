"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlarmClock,
  ArrowLeftRight,
  BarChart3,
  BedDouble,
  CalendarDays,
  ChevronDown,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  PanelLeft,
  Receipt,
  Search,
  Settings,
  Sun,
  UserPlus,
} from "lucide-react";
import { NAV, type PageId } from "@/components/nav";
import { Dashboard } from "@/components/pages/Dashboard";
import { ModernDashboard } from "@/components/pages/ModernDashboard";
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
import { useIdentitas } from "@/lib/identitas";
import { FX } from "@/components/fx";
import { BULAN_ID, HARI_ID } from "@/lib/format";

/* Ikon per halaman (lucide, 18px) */
const PAGE_ICON: Record<PageId, React.ReactNode> = {
  dashboard: <LayoutGrid size={18} />,
  modern: <BarChart3 size={18} />,
  database: <BedDouble size={18} />,
  "input-sewa": <UserPlus size={18} />,
  tagihan: <Receipt size={18} />,
  tunggakan: <AlarmClock size={18} />,
  transaksi: <ArrowLeftRight size={18} />,
  "laporan-bulanan": <CalendarDays size={18} />,
  "laporan-tahunan": <BarChart3 size={18} />,
  pengaturan: <Settings size={18} />,
};

const ALL_ITEMS = NAV.flatMap((g) => g.items);

const BOTTOM_NAV: Array<{ id: PageId | "more"; label: string; icon: React.ReactNode }> = [
  { id: "dashboard", label: "Beranda", icon: <LayoutGrid size={20} /> },
  { id: "database", label: "Kamar", icon: <BedDouble size={20} /> },
  { id: "tagihan", label: "Tagihan", icon: <Receipt size={20} /> },
  { id: "transaksi", label: "Transaksi", icon: <ArrowLeftRight size={20} /> },
  { id: "more", label: "Lainnya", icon: <Menu size={20} /> },
];

export function Shell() {
  const [page, setPage] = useState<PageId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const [cmdIndex, setCmdIndex] = useState(0);
  const [userMenu, setUserMenu] = useState(false);
  const [selectedPenyewaId, setSelectedPenyewaId] = useState<number | null>(null);
  const { theme, toggle } = useTheme();
  const identitas = useIdentitas();
  const [tanggal, setTanggal] = useState("");
  const cmdInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Posting pengeluaran rutin (kategori mode "otomatis") — idempoten per periode di server
    fetch("/api/pengeluaran/otomatis", { method: "POST" }).catch(() => {});
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setUserMenu(false);
        setCmdOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Fokus otomatis ke input palette
  useEffect(() => {
    if (cmdOpen) requestAnimationFrame(() => cmdInputRef.current?.focus());
  }, [cmdOpen]);

  // Kunci scroll body saat drawer terbuka di ponsel
  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    if (window.matchMedia("(max-width: 900px)").matches) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    function update() {
      const d = new Date();
      setTanggal(HARI_ID[d.getDay()] + ", " + d.getDate() + " " + BULAN_ID[d.getMonth()] + " " + d.getFullYear());
    }
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, []);

  function go(next: PageId) {
    setSelectedPenyewaId(null);
    setPage(next);
    setSidebarOpen(false);
    setCmdOpen(false);
  }

  function handleSelectPenyewa(id: number) {
    setSelectedPenyewaId(id);
  }

  function renderPage() {
    if (selectedPenyewaId !== null) {
      return <PenyewaDetail penyewaId={selectedPenyewaId} onBack={() => setSelectedPenyewaId(null)} />;
    }
    switch (page) {
      case "dashboard":
        return <Dashboard onSelectPenyewa={handleSelectPenyewa} />;
      case "modern":
        return <ModernDashboard onSelectPenyewa={handleSelectPenyewa} identitas={identitas} />;
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
        return <Dashboard onSelectPenyewa={handleSelectPenyewa} />;
    }
  }

  useEffect(() => {
    function onResize() {
      if (window.innerWidth > 900) setSidebarOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Tutup menu user saat klik di luar
  useEffect(() => {
    if (!userMenu) return;
    function onDown(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest(".kostku-menuwrap")) setUserMenu(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [userMenu]);

  const pageLabel = selectedPenyewaId !== null ? "Profil Penyewa" : ALL_ITEMS.find((i) => i.id === page)?.label ?? "";
  const cmdResults = useMemo(() => {
    const term = cmdQuery.trim().toLowerCase();
    if (!term) return ALL_ITEMS;
    return ALL_ITEMS.filter((i) => i.label.toLowerCase().includes(term));
  }, [cmdQuery]);

  function cmdKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCmdIndex((i) => Math.min(i + 1, cmdResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCmdIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = cmdResults[cmdIndex];
      if (item) go(item.id);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* ================= SIDEBAR ================= */}
      <aside
        className="kostku-sidebar"
        data-open={sidebarOpen ? "true" : "false"}
        data-collapsed={collapsed ? "true" : "false"}
        aria-label="Navigasi utama"
      >
        <div style={{ padding: "14px 14px 12px", borderBottom: "1px solid var(--sidebar-border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div className="kostku-brandmark" aria-hidden="true">K</div>
          <div className="kostku-brand-text" style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, color: "var(--sidebar-foreground)" }}>
              <span style={{ color: "var(--primary)" }}>Kost</span>Ku
            </div>
            <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={identitas.alamat || undefined}>
              {identitas.namaKos}
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "6px 10px 16px" }} aria-label="Menu">
          {NAV.map((group) => (
            <div key={group.title} style={{ marginBottom: 4 }}>
              <div className="kostku-navgroup">{group.title}</div>
              {group.items.map((item) => {
                const active = page === item.id && selectedPenyewaId === null;
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item.id)}
                    aria-current={active ? "page" : undefined}
                    className="kostku-navitem"
                    title={item.label}
                  >
                    {PAGE_ICON[item.id]}
                    <span className="kostku-navlabel" style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="kostku-sidefoot">
          <button
            onClick={toggle}
            aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
            title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</span>
          </button>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.reload();
            }}
            aria-label="Keluar"
            title="Keluar"
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="kostku-overlay"
          aria-hidden="true"
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)", zIndex: 35 }}
        />
      )}

      {/* ================= MAIN ================= */}
      <div className="kostku-main" data-collapsed={collapsed ? "true" : "false"}>
        <header className="kostku-header">
          <button
            className="kostku-trigger"
            data-mobile="true"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu navigasi"
            aria-expanded={sidebarOpen}
          >
            <Menu size={18} />
          </button>
          <button
            className="kostku-trigger"
            data-desktop="true"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          >
            <PanelLeft size={18} />
          </button>

          {/* Brand (mobile) / breadcrumb (desktop) */}
          <div className="kostku-breadcrumb">
            <span className="crumb-brand" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span className="kostku-brandmark" style={{ width: 26, height: 26, fontSize: 12, borderRadius: 7 }} aria-hidden="true">K</span>
              <b>KostKu</b>
            </span>
            <span className="crumb-page" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <ChevronDown size={13} style={{ transform: "rotate(-90deg)", opacity: 0.6 }} />
              <b>{pageLabel}</b>
            </span>
          </div>

          <button
            className="kostku-search"
            onClick={() => { setCmdQuery(""); setCmdIndex(0); setCmdOpen(true); }}
            aria-label="Cari halaman"
          >
            <Search size={14} />
            <span>Cari halaman…</span>
            <kbd>⌘K</kbd>
          </button>

          <button
            className="kostku-iconbtn kostku-searchbtn"
            onClick={() => { setCmdQuery(""); setCmdIndex(0); setCmdOpen(true); }}
            aria-label="Cari halaman"
          >
            <Search size={17} />
          </button>

          <div className="kostku-header-actions">
            <span style={{ fontSize: 12, color: "var(--muted-foreground)", whiteSpace: "nowrap", marginRight: 2 }} className="kostku-tanggal" suppressHydrationWarning>
              {tanggal}
            </span>
            <button
              className="kostku-iconbtn"
              onClick={toggle}
              aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
              title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div className="kostku-menuwrap">
              <button
                className="kostku-avatar"
                onClick={() => setUserMenu((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenu}
                aria-label="Menu akun"
              >
                {(identitas.namaPemilik || "K")[0].toUpperCase()}
              </button>
              {userMenu && (
                <div className="kostku-menu" role="menu">
                  <div className="kostku-menu-head">
                    <b>{identitas.namaPemilik}</b>
                    <span>{identitas.namaKos}</span>
                  </div>
                  <button className="kostku-menu-item" role="menuitem" onClick={() => { toggle(); setUserMenu(false); }}>
                    {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                    {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
                  </button>
                  <button className="kostku-menu-item" role="menuitem" data-danger="true" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.reload(); }}>
                    <LogOut size={15} />
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="kostku-sheet">
          {renderPage()}
          <FX page={selectedPenyewaId !== null ? `penyewa-${selectedPenyewaId}` : page} />
        </main>
      </div>

      {/* ================= BOTTOM NAV (mobile) ================= */}
      <nav className="kostku-bottomnav" aria-label="Navigasi bawah">
        <div className="kostku-bottomnav-inner">
          {BOTTOM_NAV.map((item) => {
            const active = item.id !== "more" && page === item.id && selectedPenyewaId === null;
            return (
              <button
                key={item.id}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                onClick={() => {
                  if (item.id === "more") {
                    setSidebarOpen(true);
                  } else {
                    go(item.id);
                  }
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ================= COMMAND PALETTE ================= */}
      {cmdOpen && (
        <div className="kostku-cmd-overlay" onClick={() => setCmdOpen(false)}>
          <div className="kostku-cmd" role="dialog" aria-label="Cari halaman" onClick={(e) => e.stopPropagation()}>
            <div className="kostku-cmd-input">
              <Search size={15} />
              <input
                ref={cmdInputRef}
                value={cmdQuery}
                onChange={(e) => { setCmdQuery(e.target.value); setCmdIndex(0); }}
                onKeyDown={cmdKey}
                placeholder="Ketik nama halaman…"
                aria-label="Cari halaman"
              />
              <kbd style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10.5, border: "1px solid var(--shadcn-border)", borderRadius: 4, padding: "1px 5px", color: "var(--muted-foreground)" }}>ESC</kbd>
            </div>
            <div className="kostku-cmd-list">
              {cmdResults.length === 0 ? (
                <div className="kostku-cmd-empty">Tidak ada halaman yang cocok.</div>
              ) : (
                cmdResults.map((item, i) => (
                  <button
                    key={item.id}
                    className="kostku-cmd-item"
                    data-active={i === cmdIndex}
                    onMouseEnter={() => setCmdIndex(i)}
                    onClick={() => go(item.id)}
                  >
                    {PAGE_ICON[item.id]}
                    {item.label}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
