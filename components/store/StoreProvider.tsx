"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
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

const JSON_HEADERS = { "Content-Type": "application/json" };

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<ListingSnapshot[]>([]);
  const [compare, setCompare] = useState<ListingSnapshot[]>([]);
  const [recent, setRecent] = useState<ListingSnapshot[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hydrated, setHydrated] = useState(false);
  // null = bilinmiyor, false = anonim (localStorage), true = girişli (sunucu)
  const [authed, setAuthed] = useState<boolean | null>(null);

  // Callback'lerin güncel değere erişmesi için ref'ler (stale closure'ı önler).
  const authedRef = useRef(false);
  const favoritesRef = useRef<ListingSnapshot[]>([]);
  useEffect(() => { favoritesRef.current = favorites; }, [favorites]);

  // Mount: compare/recent her zaman localStorage. Favoriler girişliyse sunucudan
  // (cihazlar arası senkron); girişte localStorage favorileri hesaba birleştirilir.
  useEffect(() => {
    let cancelled = false;
    const localFavs = load("ks_fav");
    queueMicrotask(() => {
      if (cancelled) return;
      setCompare(load("ks_cmp"));
      setRecent(load("ks_recent"));
      setFavorites(localFavs);
    });

    (async () => {
      try {
        const res = await fetch("/api/favorites");
        const d = await res.json();
        if (cancelled) return;
        if (d?.authed) {
          const localSlugs = localFavs.map((f) => f.slug).filter(Boolean);
          if (localSlugs.length) {
            const m = await fetch("/api/favorites/merge", {
              method: "POST",
              headers: JSON_HEADERS,
              body: JSON.stringify({ slugs: localSlugs }),
            });
            const md = await m.json().catch(() => null);
            if (cancelled) return;
            setFavorites(md?.items ?? d.items ?? []);
          } else {
            setFavorites(d.items ?? []);
          }
          try { localStorage.removeItem("ks_fav"); } catch { /* yoksay */ }
          authedRef.current = true;
          setAuthed(true);
        } else {
          authedRef.current = false;
          setAuthed(false);
        }
      } catch {
        if (!cancelled) {
          authedRef.current = false;
          setAuthed(false);
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Favoriler: yalnız anonimken localStorage'a yaz (girişliyken kaynak sunucu).
  useEffect(() => {
    if (hydrated && authed === false) localStorage.setItem("ks_fav", JSON.stringify(favorites));
  }, [favorites, hydrated, authed]);
  useEffect(() => { if (hydrated) localStorage.setItem("ks_cmp", JSON.stringify(compare)); }, [compare, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("ks_recent", JSON.stringify(recent)); }, [recent, hydrated]);

  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const isFavorite = useCallback((slug: string) => favorites.some((f) => f.slug === slug), [favorites]);
  const isInCompare = useCallback((slug: string) => compare.some((c) => c.slug === slug), [compare]);

  // Sunucu senkronu (girişliyse). Hata yutulur — yerel state yine güncellenir.
  function syncFavorite(method: "POST" | "DELETE", slug: string) {
    if (!authedRef.current) return;
    fetch("/api/favorites", { method, headers: JSON_HEADERS, body: JSON.stringify({ slug }) }).catch(() => {});
  }

  const toggleFavorite = useCallback((l: ListingSnapshot) => {
    const exists = favoritesRef.current.some((f) => f.slug === l.slug);
    if (exists) {
      setFavorites((prev) => prev.filter((f) => f.slug !== l.slug));
      toast("Favorilerden çıkarıldı", "info");
      syncFavorite("DELETE", l.slug);
    } else {
      setFavorites((prev) => [l, ...prev.filter((f) => f.slug !== l.slug)]);
      toast("Favorilere eklendi");
      syncFavorite("POST", l.slug);
    }
  }, [toast]);

  const removeFavorite = useCallback((slug: string) => {
    setFavorites((prev) => prev.filter((f) => f.slug !== slug));
    syncFavorite("DELETE", slug);
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
