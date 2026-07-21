"use client";

import { Heart, ArrowLeftRight } from "lucide-react";
import { useStore, type ListingSnapshot } from "@/components/store/StoreProvider";

export default function CardActions({ listing }: { listing: ListingSnapshot }) {
  const { isFavorite, isInCompare, toggleFavorite, toggleCompare, hydrated } = useStore();
  const fav = hydrated && isFavorite(listing.slug);
  const cmp = hydrated && isInCompare(listing.slug);

  return (
    <div className="absolute right-3 top-3 z-10 flex gap-2 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(listing); }}
        aria-label="Favorilere ekle"
        aria-pressed={fav}
        title="Favorilere ekle"
        className={`grid h-11 w-11 place-items-center rounded-lg ring-1 backdrop-blur transition ${
          fav
            ? "bg-red-500 text-white ring-red-500"
            : "bg-paper/90 text-slate-600 ring-black/5 hover:bg-paper hover:text-red-500"
        }`}
      >
        <Heart className="h-4 w-4" strokeWidth={2.2} fill={fav ? "currentColor" : "none"} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(listing); }}
        aria-label="Karşılaştır"
        aria-pressed={cmp}
        title="Karşılaştırmaya ekle"
        className={`grid h-11 w-11 place-items-center rounded-lg ring-1 backdrop-blur transition ${
          cmp
            ? "bg-brand-700 text-white ring-brand-700"
            : "bg-paper/90 text-slate-600 ring-black/5 hover:bg-paper hover:text-brand-700"
        }`}
      >
        <ArrowLeftRight className="h-4 w-4" strokeWidth={2.2} />
      </button>
    </div>
  );
}
