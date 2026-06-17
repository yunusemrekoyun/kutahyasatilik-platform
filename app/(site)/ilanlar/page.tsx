import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { getListingsPaged } from "@/lib/listings";
import ListingCard from "@/components/ListingCard";
import ListingFilters from "@/components/ListingFilters";
import ListingSort from "@/components/ListingSort";
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
      <nav className="mb-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-700">Ana Sayfa</Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-700">{get("ilce") ? `${get("ilce")} İlanları` : "Tüm İlanlar"}</span>
      </nav>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
            {get("ilce") ? `${get("ilce")} İlanları` : "Tüm İlanlar"}
          </h1>
          <p className="mt-1.5 text-slate-500">
            Sizin için <strong className="font-semibold text-slate-700 tabular-nums">{total}</strong> sonuç bulundu.
          </p>
        </div>
        <Suspense fallback={<div className="h-11 w-44 rounded-lg bg-white ring-1 ring-slate-200" />}>
          <ListingSort />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Suspense fallback={<div className="h-24 rounded-xl bg-white ring-1 ring-slate-200" />}>
            <ListingFilters />
          </Suspense>
        </div>

        <div className="lg:col-span-3">
          {items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((l) => (
                  <ListingCard key={l.slug} listing={l} />
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} searchParams={flatParams} />
            </>
          ) : (
            <div className="rounded-xl bg-white p-12 text-center ring-1 ring-slate-200">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-400">
                <SearchX className="h-7 w-7" />
              </span>
              <h2 className="mt-4 font-display text-lg font-bold text-slate-800">Bu kriterlere uygun ilan bulunamadı</h2>
              <p className="mx-auto mt-1.5 max-w-md text-slate-500">Filtreleri biraz gevşetin ya da talebinizi bırakın; portföyümüzdeki diğer seçenekleri size sunalım.</p>
              <Link href="/alici-talebi" className="mt-5 inline-flex items-center justify-center rounded-lg bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
                Talep Bırak
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mt-14">
        <NotFoundCTA />
      </div>
    </div>
  );
}
