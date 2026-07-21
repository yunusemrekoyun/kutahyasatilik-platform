"use client";

import { useEffect } from "react";
import { Heart, ArrowLeftRight } from "lucide-react";
import { useStore, type ListingSnapshot } from "@/components/store/StoreProvider";

// Hem favori/karşılaştır butonlarını gösterir hem de "son görüntülenenler"e ekler.
export default function ListingDetailActions({ listing }: { listing: ListingSnapshot }) {
  const { isFavorite, isInCompare, toggleFavorite, toggleCompare, addRecent, hydrated } = useStore();

  useEffect(() => {
    if (hydrated) addRecent(listing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, listing.slug]);

  const fav = hydrated && isFavorite(listing.slug);
  const cmp = hydrated && isInCompare(listing.slug);

  return (
    <div className="flex gap-2">
      <button
        onClick={() => toggleFavorite(listing)}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
          fav ? "border-red-200 bg-red-50 text-red-600" : "border-stone bg-paper text-slate-700 hover:border-red-200 hover:text-red-600"
        }`}
      >
        {fav ? (
          <><Heart className="h-4 w-4 fill-current" /> Favoride</>
        ) : (
          <><Heart className="h-4 w-4" /> Favori</>
        )}
      </button>
      <button
        onClick={() => toggleCompare(listing)}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
          cmp ? "border-brand-200 bg-brand-50 text-brand-700" : "border-stone bg-paper text-slate-700 hover:border-brand-200 hover:text-brand-700"
        }`}
      >
        <ArrowLeftRight className="h-4 w-4" /> {cmp ? "Eklendi" : "Karşılaştır"}
      </button>
    </div>
  );
}
