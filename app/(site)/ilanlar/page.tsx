import type { Metadata } from "next";
import { Suspense } from "react";
import { getListingsPaged } from "@/lib/listings";
import ListingCard from "@/components/ListingCard";
import ListingFilters from "@/components/ListingFilters";
import Pagination from "@/components/Pagination";
import NotFoundCTA from "@/components/NotFoundCTA";
import TrackView from "@/components/TrackView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tüm İlanlar - Kütahya Satılık Daire, Arsa, Villa",
  description:
    "Kütahya ve ilçelerinde güncel satılık daire, arsa, villa ve yatırımlık tarla ilanları. İlçe, fiyat ve mülk türüne göre filtreleyin.",
};

const PER_PAGE = 12;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const page = Math.max(1, Number(get("sayfa")) || 1);

  // Negatif değerleri 0'a sabitle
  const pos = (v: string | undefined) => (v ? Math.max(0, Number(v) || 0) : undefined);

  // Alan birimi: dönüm seçiliyse m²'ye çevir (1 dönüm = 1000 m²)
  const areaFactor = get("birim") === "donum" ? 1000 : 1;
  const minAlanRaw = pos(get("minAlan"));
  const maxAlanRaw = pos(get("maxAlan"));
  const minAlan = minAlanRaw !== undefined ? minAlanRaw * areaFactor : undefined;
  const maxAlan = maxAlanRaw !== undefined ? maxAlanRaw * areaFactor : undefined;

  const { items, total, totalPages } = await getListingsPaged(
    {
      q: get("q"),
      propertyType: get("tur"),
      district: get("ilce"),
      rooms: get("oda"),
      zoning: get("imar"),
      sort: get("sira"),
      minPrice: pos(get("min")),
      maxPrice: pos(get("max")),
      minArea: minAlan,
      maxArea: maxAlan,
      furnished: !!get("esyali"),
      parking: !!get("otopark"),
      balcony: !!get("balkon"),
      inSite: !!get("site"),
      verified: !!get("dogrulanmis"),
    },
    page,
    PER_PAGE
  );

  const flatParams: Record<string, string | undefined> = {};
  Object.entries(sp).forEach(([k, v]) => { if (typeof v === "string") flatParams[k] = v; });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <TrackView />
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wider text-gold-600">Portföy</p>
        <h1 className="font-display text-3xl font-bold text-brand-900">
          {get("ilce") ? `${get("ilce")} İlanları` : "Tüm İlanlar"}
        </h1>
        <div className="gold-divider mt-2" />
      </div>

      <Suspense fallback={<div className="h-24 rounded-2xl bg-white ring-1 ring-slate-200" />}>
        <ListingFilters total={total} />
      </Suspense>

      {items.length > 0 ? (
        <>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((l) => (
              <ListingCard key={l.slug} listing={l} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} searchParams={flatParams} />
        </>
      ) : (
        <div className="mt-8 rounded-2xl bg-white p-12 text-center ring-1 ring-slate-200">
          <div className="text-5xl">🔍</div>
          <h2 className="mt-4 text-lg font-bold text-slate-800">Bu kriterlere uygun ilan bulunamadı</h2>
          <p className="mt-1 text-slate-500">Filtreleri değiştirin veya bizimle iletişime geçin; portföyümüzdeki diğer seçenekleri sunalım.</p>
        </div>
      )}

      <div className="mt-14">
        <NotFoundCTA />
      </div>
    </div>
  );
}
