"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Menu, X, ExternalLink } from "lucide-react";
import AdminNav, { type AdminCounts } from "./AdminNav";

export default function AdminShell({
  email,
  counts,
  children,
}: {
  email: string;
  counts: AdminCounts;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("admin_sidebar_collapsed") === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("admin_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  }

  const Logo = ({ small = false }: { small?: boolean }) => (
    <Link href="/admin" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-700 text-base font-bold text-white">K</span>
      {!small && (
        <span className="leading-tight">
          <span className="block font-semibold text-slate-900">Yönetim</span>
          <span className="block text-[11px] text-slate-500">Kütahya Satılık</span>
        </span>
      )}
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-[1500px]">
        {/* Masaüstü sidebar */}
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 md:flex ${
            collapsed ? "w-[76px]" : "w-64"
          }`}
        >
          <div className={`flex h-16 items-center border-b border-slate-100 ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
            {!collapsed && <Logo />}
            <button
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          </div>

          <AdminNav counts={counts} collapsed={collapsed} />

          <div className={`border-t border-slate-100 p-3 ${collapsed ? "flex justify-center" : ""}`}>
            {collapsed ? (
              <span title={email} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                {email.slice(0, 1).toUpperCase()}
              </span>
            ) : (
              <div>
                <p className="truncate text-xs font-medium text-slate-600">{email}</p>
                <Link href="/" className="mt-1 inline-flex items-center gap-1 text-xs text-brand-700 hover:underline">
                  <ExternalLink className="h-3 w-3" /> Siteye dön
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* İçerik */}
        <main className="min-w-0 flex-1">
          {/* Mobil üst bar */}
          <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
            <Logo />
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Menüyü aç"
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-300 text-slate-700"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Mobil drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
              <Logo />
              <button onClick={() => setMobileOpen(false)} aria-label="Kapat" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <AdminNav counts={counts} onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-slate-100 p-4">
              <p className="truncate text-xs font-medium text-slate-600">{email}</p>
              <Link href="/" className="mt-1 inline-flex items-center gap-1 text-xs text-brand-700 hover:underline">
                <ExternalLink className="h-3 w-3" /> Siteye dön
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
