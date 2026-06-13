"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ListingCardData } from "@/components/ListingCard";

export type ListingSnapshot = ListingCardData & {
  floor?: string | null;
  buildingAge?: string | null;
  heating?: string | null;
  areaNet?: number | null;
};

type Toast = { id: number; message: string; type: "success" | "error" | "info" };

type StoreCtx = {
  favorites: ListingSnapshot[];
  compare: ListingSnapshot[];
  recent: ListingSnapshot[];
  isFavorite: (slug: string) => boolean;
  isInCompare: (slug: string) => boolean;
  toggleFavorite: (l: ListingSnapshot) => void;
  toggleCompare: (l: ListingSnapshot) => void;
  removeFavorite: (slug: string) => void;
  clearCompare: () => void;
  addRecent: (l: ListingSnapshot) => void;
  toasts: Toast[];
  toast: (message: string, type?: Toast["type"]) => void;
  hydrated: boolean;
};

const Ctx = createContext<StoreCtx | null>(null);

const MAX_COMPARE = 4;
const MAX_RECENT = 8;

function load(key: string): ListingSnapshot[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<ListingSnapshot[]>([]);
  const [compare, setCompare] = useState<ListingSnapshot[]>([]);
  const [recent, setRecent] = useState<ListingSnapshot[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setFavorites(load("ks_fav"));
      setCompare(load("ks_cmp"));
      setRecent(load("ks_recent"));
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => { if (hydrated) localStorage.setItem("ks_fav", JSON.stringify(favorites)); }, [favorites, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("ks_cmp", JSON.stringify(compare)); }, [compare, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("ks_recent", JSON.stringify(recent)); }, [recent, hydrated]);

  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const isFavorite = useCallback((slug: string) => favorites.some((f) => f.slug === slug), [favorites]);
  const isInCompare = useCallback((slug: string) => compare.some((c) => c.slug === slug), [compare]);

  const toggleFavorite = useCallback((l: ListingSnapshot) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.slug === l.slug)) {
        toast("Favorilerden çıkarıldı", "info");
        return prev.filter((f) => f.slug !== l.slug);
      }
      toast("Favorilere eklendi ❤️");
      return [l, ...prev];
    });
  }, [toast]);

  const removeFavorite = useCallback((slug: string) => {
    setFavorites((prev) => prev.filter((f) => f.slug !== slug));
  }, []);

  const toggleCompare = useCallback((l: ListingSnapshot) => {
    setCompare((prev) => {
      if (prev.some((c) => c.slug === l.slug)) {
        return prev.filter((c) => c.slug !== l.slug);
      }
      if (prev.length >= MAX_COMPARE) {
        toast(`En fazla ${MAX_COMPARE} ilan karşılaştırılabilir`, "error");
        return prev;
      }
      toast("Karşılaştırmaya eklendi");
      return [...prev, l];
    });
  }, [toast]);

  const clearCompare = useCallback(() => setCompare([]), []);

  const addRecent = useCallback((l: ListingSnapshot) => {
    setRecent((prev) => {
      const filtered = prev.filter((r) => r.slug !== l.slug);
      return [l, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);

  return (
    <Ctx.Provider
      value={{
        favorites, compare, recent,
        isFavorite, isInCompare, toggleFavorite, toggleCompare,
        removeFavorite, clearCompare, addRecent,
        toasts, toast, hydrated,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
