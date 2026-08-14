import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { getListingsPaged } from "@/lib/listings";
import ListingCard from "@/components/ListingCard";
import ListingFilters from "@/components/ListingFilters";
import CategoryTabs from "@/components/CategoryTabs";
import { getCategory, getFilterableFields, isCategoryKey } from "@/lib/categories";
import ListingSort from "@/components/ListingSort";
import Pagination from "@/components/Pagination";
import NotFoundCTA from "@/components/NotFoundCTA";
import TrackView from "@/components/TrackView";
import { getPublicListingOwner } from "@/lib/publicDirectory";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tüm İlanlar - Kütahya Satılık Daire, Arsa, Villa",
  description:
    "Kütahya ve ilçelerinde güncel satılık daire, arsa, villa ve yatırımlık tarla ilanları. İlçe, fiyat ve mülk türüne göre filtreleyin.",
  alternates: { canonical: "/ilanlar" },
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
  const agencySlug = get("ofis")?.trim().slice(0, 100);
  const agentSlug = agencySlug ? undefined : get("danisman")?.trim().slice(0, 100);

  // Negatif değerleri 0'a sabitle
  const pos = (v: string | undefined) => (v ? Math.max(0, Number(v) || 0) : undefined);

  // Alan birimi: dönüm seçiliyse m²'ye çevir (1 dönüm = 1000 m²)
  const areaFactor = get("birim") === "donum" ? 1000 : 1;
  const minAlanRaw = pos(get("minAlan"));
  const maxAlanRaw = pos(get("maxAlan"));
  const minAlan = minAlanRaw !== undefined ? minAlanRaw * areaFactor : undefined;
  const maxAlan = maxAlanRaw !== undefined ? maxAlanRaw * areaFactor : undefined;

  // Kategori seçilmediyse TÜM kategoriler listelenir: burası genel ilan sitesinin
  // ana listesi, emlağa daraltmak "Tüm İlanlar" başlığıyla çelişirdi.
  const categoryParam = get("kategori");
  const category = isCategoryKey(categoryParam) ? getCategory(categoryParam) : null;

  // Kategoriye özel nitelik filtreleri. Yalnız kayıtta filtrelenebilir işaretli
  // alanlar okunur; URL'e elle eklenen başka bir anahtar sorguya geçmez.
  const attrs: Record<string, string> = {};
  for (const field of category ? getFilterableFields(category.key) : []) {
    if (field.type === "select") {
      const value = get(field.key);
      if (value) attrs[field.key] = value;
    } else {
      const min = get(`${field.key}_min`);
      const max = get(`${field.key}_max`);
      if (min) attrs[`${field.key}_min`] = min;
      if (max) attrs[`${field.key}_max`] = max;
    }
  }

  const [listingResult, owner] = await Promise.all([
    getListingsPaged({
      category: category?.key,
      attrs,
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
      agencySlug,
      agentSlug,
    }, page, PER_PAGE),
    agencySlug
      ? getPublicListingOwner("agency", agencySlug)
      : agentSlug
        ? getPublicListingOwner("agent", agentSlug)
        : Promise.resolve(null),
  ]);
  const { items, total, totalPages } = listingResult;
  const pageTitle = owner
    ? `${owner.name} Portföyü`
    : get("ilce")
      ? `${get("ilce")} İlanları`
      : category
        ? `${category.label} İlanları`
        : "Tüm İlanlar";

  const flatParams: Record<string, string | undefined> = {};
  Object.entries(sp).forEach(([k, v]) => { if (typeof v === "string") flatParams[k] = v; });

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
      <TrackView />
      <nav aria-label="Sayfa yolu" className="mb-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-700">Ana Sayfa</Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-700">{pageTitle}</span>
      </nav>
      <div className="mb-8 flex flex-col gap-5 border-b border-stone pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Kütahya portföyü</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-brand-950 sm:text-5xl">
            {pageTitle}
          </h1>
          {owner ? (
            <Link
              href={agencySlug ? `/emlak-ofisi/${owner.slug}` : `/danisman/${owner.slug}`}
              className="mt-3 inline-flex text-sm font-semibold text-brand-700 hover:underline"
            >
              {agencySlug ? "Ofis profiline dön" : "Danışman profiline dön"}
            </Link>
          ) : null}
          <p className="mt-3 text-muted">
            Sizin için <strong className="font-semibold text-slate-700 tabular-nums">{total}</strong> sonuç bulundu.
          </p>
        </div>
        <Suspense fallback={<div className="h-11 w-44 rounded-lg bg-paper ring-1 ring-stone" />}>
          <ListingSort />
        </Suspense>
      </div>

      {/* Ofis/danışman portföyü emlağa özgü olduğu için orada kategori yok */}
      {!owner && (
        <Suspense fallback={<div className="mb-8 h-12 border-b border-stone" />}>
          <CategoryTabs />
        </Suspense>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <Suspense fallback={<div className="h-24 rounded-lg bg-paper ring-1 ring-stone" />}>
            <ListingFilters />
          </Suspense>
        </div>

        <div className="lg:col-span-9">
          {items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((l, index) => (
                  <ListingCard key={l.slug} listing={l} priority={index < 3} />
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} searchParams={flatParams} />
            </>
          ) : (
            <div className="ceramic-grid border-y border-stone bg-paper p-12 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-lg border border-stone bg-canvas text-slate-500">
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
