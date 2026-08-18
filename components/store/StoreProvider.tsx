"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { ListingCardData } from "@/components/ListingCard";
import { CATEGORY_LABELS } from "@/lib/categories";

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
            if (md?.ok) {
              setFavorites(md.items ?? []);
              try { localStorage.removeItem("ks_fav"); } catch { /* yoksay */ }
            } else {
              // Merge başarısız: yerel favorileri KAYBETME — sunucu + yerel birleşik göster,
              // ks_fav korunur (sonraki yüklemede tekrar denenir).
              const server = (d.items ?? []) as ListingSnapshot[];
              const seen = new Set(server.map((x) => x.slug));
              setFavorites([...server, ...localFavs.filter((f) => !seen.has(f.slug))]);
            }
          } else {
            setFavorites(d.items ?? []);
            try { localStorage.removeItem("ks_fav"); } catch { /* yoksay */ }
          }
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

  // Snapshot tazeleme: localStorage'daki kayıtlar yazıldıkları andaki fiyatı ve
  // durumu taşır. Tazelemezsek satılmış ilan "aktif" görünür (SATILDI rozeti ve
  // iletişim gizleme çalışmaz) ve karşılaştırma tablosu eski fiyatla karar
  // verdirir. Hydration'dan sonra bir kez sunucudan doğrularız; yayından kalkmış
  // ilanlar listeden düşer. Girişli kullanıcının favorileri zaten sunucudan
  // geldiği için yalnız compare/recent tazelenir.
  const refreshedRef = useRef(false);
  useEffect(() => {
    if (!hydrated || authed === null || refreshedRef.current) return;
    refreshedRef.current = true;

    const anonymous = authed === false;
    const slugs = [
      ...compare.map((c) => c.slug),
      ...recent.map((r) => r.slug),
      ...(anonymous ? favoritesRef.current.map((f) => f.slug) : []),
    ].filter(Boolean);
    if (!slugs.length) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/listings/refresh", {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ slugs: [...new Set(slugs)] }),
        });
        const d = await res.json().catch(() => null);
        if (cancelled || !d?.ok) return;
        const fresh = new Map<string, ListingSnapshot>(
          (d.items as ListingSnapshot[]).map((i) => [i.slug, i])
        );
        // Dönen kayıtları güncelle, dönmeyenleri (artık yayında değil) çıkar.
        const sync = (list: ListingSnapshot[]) =>
          list.map((x) => fresh.get(x.slug)).filter((x): x is ListingSnapshot => !!x);
        setCompare((prev) => sync(prev));
        setRecent((prev) => sync(prev));
        if (anonymous) setFavorites((prev) => sync(prev));
      } catch {
        /* tazeleme başarısızsa mevcut snapshot korunur */
      }
    })();

    return () => { cancelled = true; };
    // compare/recent bilerek bağımlılık dışı: tazeleme hydration'dan sonra tek sefer çalışır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, authed]);

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
      // Karşılaştırma TEK KATEGORİ içinde anlamlı: bir daireyle bir otomobil
      // yan yana konduğunda tablo satırlarının çoğu ("Oda", "Brüt m²", "Kat")
      // otomobil sütununda boş kalıyordu. Kullanıcıyı yarısı boş bir tabloya
      // götürmek yerine eklemeyi engelleyip nedenini söylüyoruz.
      const current = prev[0]?.category ?? "emlak";
      const incoming = l.category ?? "emlak";
      if (prev.length && current !== incoming) {
        toast(`${CATEGORY_LABELS[current] ?? "Bu"} ilanlarıyla karşılaştırılıyor. Önce listeyi temizleyin.`, "error");
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
