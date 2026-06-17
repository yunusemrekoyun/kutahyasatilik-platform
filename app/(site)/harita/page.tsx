import type { Metadata } from "next";
import { getMapPoints } from "@/lib/listings";
import ListingsMap from "@/components/ListingsMap";
import NotFoundCTA from "@/components/NotFoundCTA";
import TrackView from "@/components/TrackView";

export const revalidate = 300; // ISR: her 5 dakikada yenilenir (CDN cache + admin revalidatePath)

export const metadata: Metadata = {
  title: "Harita ile Kütahya'da İlan Ara",
  description:
    "Kütahya ilçelerindeki satılık daire, arsa ve villa ilanlarını harita üzerinde keşfedin. Merkez, Tavşanlı, Simav, Gediz, Emet ve diğer ilçeleri filtreleyin.",
};

export default async function MapPage() {
  const points = await getMapPoints();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <TrackView />
      <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">Harita ile İlan Ara</h1>
      <p className="mt-1.5 text-slate-500">
        İlçe seçerek bölgedeki tüm ilanları haritada görüntüleyin ve doğrudan ilana ulaşın.
      </p>
      <div className="mt-6 overflow-hidden rounded-xl ring-1 ring-slate-200">
        <ListingsMap points={points} height="600px" />
      </div>
      <div className="mt-12">
        <NotFoundCTA />
      </div>
    </div>
  );
}
