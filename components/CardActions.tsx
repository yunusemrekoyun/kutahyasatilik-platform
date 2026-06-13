"use client";

import { useStore, type ListingSnapshot } from "@/components/store/StoreProvider";

export default function CardActions({ listing }: { listing: ListingSnapshot }) {
  const { isFavorite, isInCompare, toggleFavorite, toggleCompare, hydrated } = useStore();
  const fav = hydrated && isFavorite(listing.slug);
  const cmp = hydrated && isInCompare(listing.slug);

  return (
    <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(listing); }}
        aria-label="Favorilere ekle"
        title="Favorilere ekle"
        className={`grid h-9 w-9 place-items-center rounded-full shadow-md backdrop-blur transition ${
          fav ? "bg-red-500 text-white" : "bg-white/90 text-slate-600 hover:bg-white hover:text-red-500"
        }`}
      >
        <span className="text-base leading-none">{fav ? "♥" : "♡"}</span>
      </button>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(listing); }}
        aria-label="Karşılaştır"
        title="Karşılaştırmaya ekle"
        className={`grid h-9 w-9 place-items-center rounded-full shadow-md backdrop-blur transition ${
          cmp ? "bg-brand-700 text-white" : "bg-white/90 text-slate-600 hover:bg-white hover:text-brand-700"
        }`}
      >
        <span className="text-sm leading-none">⇄</span>
      </button>
    </div>
  );
}
