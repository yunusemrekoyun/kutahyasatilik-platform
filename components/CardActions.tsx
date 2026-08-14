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
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(listing); }}
        aria-label={fav ? `${listing.title} ilanını favorilerden çıkar` : `${listing.title} ilanını favorilere ekle`}
        aria-pressed={fav}
        title={fav ? "Favorilerden çıkar" : "Favorilere ekle"}
        className={`grid h-11 w-11 place-items-center rounded-control ring-1 backdrop-blur transition ${
          fav
            ? "bg-red-500 text-white ring-red-500"
            : "bg-paper/90 text-muted ring-black/5 hover:bg-paper hover:text-red-500"
        }`}
      >
        <Heart aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} fill={fav ? "currentColor" : "none"} />
      </button>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(listing); }}
        aria-label={cmp ? `${listing.title} ilanını karşılaştırmadan çıkar` : `${listing.title} ilanını karşılaştırmaya ekle`}
        aria-pressed={cmp}
        title={cmp ? "Karşılaştırmadan çıkar" : "Karşılaştırmaya ekle"}
        className={`grid h-11 w-11 place-items-center rounded-control ring-1 backdrop-blur transition ${
          cmp
            ? "bg-brand-700 text-white ring-brand-700"
            : "bg-paper/90 text-muted ring-black/5 hover:bg-paper hover:text-brand-700"
        }`}
      >
        <ArrowLeftRight aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
      </button>
    </div>
  );
}
