"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, Check } from "lucide-react";

type Item = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  if (!Number.isFinite(diff) || diff < 0) return "";
  const min = Math.floor(diff / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} gün`;
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const d = await res.json();
      if (d?.ok) {
        setItems(Array.isArray(d.items) ? d.items : []);
        setUnread(d.unread || 0);
      }
    } catch {
      /* sessiz */
    }
  }, []);

  useEffect(() => {
    // Harici API senkronu: ilk yükleme + 60sn periyot. setState fetch await'inden
    // sonra (asenkron) çalışır; kural senkron sanıp yanlış pozitif veriyor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function markAll() {
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    setUnread(0);
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      /* sessiz */
    }
  }

  function openItem(it: Item) {
    if (!it.isRead) {
      setItems((prev) => prev.map((i) => (i.id === it.id ? { ...i, isRead: true } : i)));
      setUnread((u) => Math.max(0, u - 1));
      fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: it.id }),
      }).catch(() => {});
    }
    if (it.link) window.location.assign(it.link);
    else setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Bildirimler"
        className="relative grid h-10 w-10 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[88vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_40px_-12px_rgba(15,23,42,0.35)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <b className="text-sm text-slate-900">Bildirimler</b>
            {unread > 0 && (
              <button onClick={markAll} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
                <Check className="h-3.5 w-3.5" /> Tümünü okundu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Henüz bildirim yok.</p>
            ) : (
              items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => openItem(it)}
                  className={`flex w-full items-start gap-2.5 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${it.isRead ? "opacity-60" : ""}`}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${it.isRead ? "bg-slate-300" : "bg-gold-500"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{it.title}</span>
                    {it.body && <span className="mt-0.5 block truncate text-xs text-slate-500">{it.body}</span>}
                    <span className="mt-0.5 block text-[11px] text-slate-400">{timeAgo(it.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
