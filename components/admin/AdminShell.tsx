"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { PanelLeftClose, PanelLeftOpen, Menu, X, ExternalLink } from "lucide-react";
import AdminNav, { type AdminCounts } from "./AdminNav";
import NotificationBell from "@/components/NotificationBell";

const SIDEBAR_KEY = "admin_sidebar_collapsed";
const SIDEBAR_EVENT = "admin-sidebar-change";

function subscribeSidebar(onStoreChange: () => void) {
  globalThis.addEventListener("storage", onStoreChange);
  globalThis.addEventListener(SIDEBAR_EVENT, onStoreChange);
  return () => {
    globalThis.removeEventListener("storage", onStoreChange);
    globalThis.removeEventListener(SIDEBAR_EVENT, onStoreChange);
  };
}

function AdminLogo({ small = false, onNavigate }: { small?: boolean; onNavigate?: () => void }) {
  return (
    <Link href="/admin" className="flex items-center gap-2.5" onClick={onNavigate}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-700 text-base font-bold text-white">K</span>
      {!small && (
        <span className="leading-tight">
          <span className="block font-semibold text-slate-900">Yönetim</span>
          <span className="block text-[11px] text-slate-500">Kütahya Satılık</span>
        </span>
      )}
    </Link>
  );
}

export default function AdminShell({
  email,
  counts,
  children,
}: {
  email: string;
  counts: AdminCounts;
  children: React.ReactNode;
}) {
  const collapsed = useSyncExternalStore(
    subscribeSidebar,
    () => globalThis.localStorage?.getItem(SIDEBAR_KEY) === "1",
    () => false,
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleCollapsed() {
    globalThis.localStorage?.setItem(SIDEBAR_KEY, collapsed ? "0" : "1");
    globalThis.dispatchEvent(new Event(SIDEBAR_EVENT));
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-[1500px]">
        {/* Masaüstü sidebar */}
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-stone bg-paper transition-[width] duration-200 md:flex ${
            collapsed ? "w-[76px]" : "w-64"
          }`}
        >
          <div className={`flex h-16 items-center border-b border-stone ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
            {!collapsed && <AdminLogo />}
            <button
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          </div>

          <AdminNav counts={counts} collapsed={collapsed} />

          <div className={`border-t border-stone p-3 ${collapsed ? "flex justify-center" : ""}`}>
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
          <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stone bg-paper px-4 md:hidden">
            <AdminLogo onNavigate={() => setMobileOpen(false)} />
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Menüyü aç"
                className="grid h-10 w-10 place-items-center rounded-lg border border-slate-300 text-slate-700"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
          {/* Masaüstü üst şerit (bildirim) */}
          <div className="sticky top-0 z-20 hidden h-14 items-center justify-end border-b border-stone bg-paper px-6 md:flex">
            <NotificationBell />
          </div>

          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Mobil drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-paper shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-stone px-4">
              <AdminLogo onNavigate={() => setMobileOpen(false)} />
              <button onClick={() => setMobileOpen(false)} aria-label="Kapat" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <AdminNav counts={counts} onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-stone p-4">
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
