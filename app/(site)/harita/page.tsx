import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
import { getMapPoints } from "@/lib/listings";
import ListingsMap from "@/components/ListingsMap";
import NotFoundCTA from "@/components/NotFoundCTA";
import TrackView from "@/components/TrackView";
import { PageIntro } from "@/components/ui/Editorial";

export const revalidate = 300; // ISR: her 5 dakikada yenilenir (CDN cache + admin revalidatePath)

export const metadata: Metadata = {
  title: "Harita ile Kütahya'da İlan Ara",
  description:
    "Kütahya ilçelerindeki satılık daire, arsa ve villa ilanlarını harita üzerinde keşfedin. Merkez, Tavşanlı, Simav, Gediz, Emet ve diğer ilçeleri filtreleyin.",
  alternates: { canonical: "/harita" },
};

export default async function MapPage() {
  const points = await getMapPoints();
  return (
    <div>
      <TrackView />
      <PageIntro eyebrow="Kütahya portföyü" title="Harita ile ilan ara" intro="İlçe seçerek bölgedeki tüm ilanları haritada görüntüleyin ve doğrudan ilana ulaşın." />
      <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
        <ListingsMap points={points} height="600px" />
      </div>
      <div className="mt-8 flex flex-col gap-4 rounded-xl bg-white px-5 py-5 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
          <div>
            <h2 className="font-display text-lg font-semibold text-brand-950">İmar ve parsel bilgilerini resmî kaynaktan kontrol edin</h2>
            <p className="mt-1 text-sm leading-6 text-muted">Belediye, parsel ve e-Devlet araçlarına doğrulanmış kurum bağlantılarından ulaşın.</p>
          </div>
        </div>
        <Link href="/yerel-araclar" className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-semibold text-brand-800 hover:text-brand-950">
          Resmî araçlar <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="mt-12">
        <NotFoundCTA />
      </div>
      </div>
    </div>
  );
}
