"use client";

import Link from "next/link";
import { useStore } from "./store/StoreProvider";

export default function CompareBar() {
  const { compare, clearCompare, hydrated } = useStore();
  if (!hydrated || compare.length === 0) return null;

  return (
    <div className="fixed bottom-14 lg:bottom-0 inset-x-0 z-40 border-t border-brand-800 bg-brand-900/95 backdrop-blur text-white shadow-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="hidden sm:inline text-sm font-semibold text-gold-300">Karşılaştırma:</span>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {compare.map((c) => (
              <span key={c.slug} className="whitespace-nowrap rounded-full bg-white/10 px-3 py-1 text-xs">
                {c.title.length > 24 ? c.title.slice(0, 24) + "…" : c.title}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={clearCompare} className="rounded-lg px-3 py-2 text-xs text-white/70 hover:text-white">
            Temizle
          </button>
          <Link
            href="/karsilastir"
            className="rounded-lg bg-gold-500 px-4 py-2 text-xs font-bold text-brand-950 hover:bg-gold-400"
          >
            Karşılaştır ({compare.length}) →
          </Link>
        </div>
      </div>
    </div>
  );
}
