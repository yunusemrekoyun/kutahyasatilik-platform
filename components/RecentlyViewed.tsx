"use client";

import { useStore } from "@/components/store/StoreProvider";
import ListingCard from "./ListingCard";

export default function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const { recent, hydrated } = useStore();
  if (!hydrated) return null;
  const items = recent.filter((r) => r.slug !== excludeSlug).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section className="mt-14">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-2xl font-bold text-brand-900">Son Görüntülediğiniz İlanlar</h2>
      </div>
      <div className="gold-divider mt-2 mb-6" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((l) => (
          <ListingCard key={l.slug} listing={l} />
        ))}
      </div>
    </section>
  );
}
