"use client";

import { LogOut } from "lucide-react";

// Tam sayfa yükleme: StoreProvider remount olur, oturum durumu (authed) sıfırlanır.
export default function LogoutButton() {
  async function handleLogout() {
    try {
      await fetch("/api/user/logout", { method: "POST" });
    } catch {
      /* yoksay */
    }
    window.location.assign("/");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center gap-2 rounded-[10px] border border-slate-300 bg-paper px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      <LogOut className="h-4 w-4" /> Çıkış Yap
    </button>
  );
}
