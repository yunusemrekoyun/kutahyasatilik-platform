"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";

export default function AgentPanelHeader({ name }: { name: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/emlakci/logout", { method: "POST" });
    router.push("/emlakci/giris");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/emlakci/panel" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-700 to-brand-900 text-gold-300 font-display text-lg font-bold">
            K
          </span>
          <span className="leading-tight">
            <span className="block font-display font-bold text-brand-900">Danışman Paneli</span>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400">Kütahya Satılık</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <span className="hidden text-sm text-slate-600 sm:inline">👤 {name}</span>
          <Link href="/" className="hidden text-sm text-brand-700 hover:underline sm:inline">
            Siteye dön
          </Link>
          <button
            onClick={logout}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            🚪 Çıkış
          </button>
        </div>
      </div>
    </header>
  );
}
