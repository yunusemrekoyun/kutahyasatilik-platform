"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";
import ListingCard from "@/components/ListingCard";

export default function FavoritesPage() {
  const { favorites, hydrated } = useStore();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <p className="text-sm font-medium uppercase tracking-wider text-gold-600">Listem</p>
      <h1 className="font-display text-3xl font-bold text-brand-900">Favori İlanlarım</h1>
      <div className="gold-divider mt-2" />

      {!hydrated ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-72 rounded-lg" />)}
        </div>
      ) : favorites.length === 0 ? (
        <div className="mt-8 rounded-lg bg-paper p-12 text-center ring-1 ring-stone">
          <Heart className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-lg font-bold text-slate-800">Henüz favori ilanınız yok</h2>
          <p className="mt-1 text-slate-500">İlanlardaki kalp ikonuna dokunarak beğendiklerinizi buraya ekleyin.</p>
          <Link href="/ilanlar" className="mt-6 inline-block rounded-lg bg-brand-700 px-6 py-3 font-bold text-white hover:bg-brand-800">
            İlanları Keşfet
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-3 text-sm text-slate-500">{favorites.length} favori ilan</p>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((l) => (
              <ListingCard key={l.slug} listing={l} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
