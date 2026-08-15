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
import ViewSwitcher from "@/components/ViewSwitcher";
import CategoryPicker from "@/components/CategoryPicker";
import { getMarketplaceStats } from "@/lib/marketplaceStats";
import { getPublicListingOwner } from "@/lib/publicDirectory";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "İlanlar - Kütahya Satılık Emlak, Vasıta, Teknoloji",
  description:
    "Kütahya ve ilçelerinde güncel satılık ilanlar: daire, arsa, villa, otomobil ve teknoloji ürünleri. Kategori, ilçe ve fiyata göre filtreleyin.",
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
  // ana listesi; kategori seçilmeden liste değil kategori seçimi gösterilir.
  const categoryParam = get("kategori");
  const category = isCategoryKey(categoryParam) ? getCategory(categoryParam) : null;
  const isRealEstate = category?.key === "emlak";

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

  const [listingResult, owner, stats] = await Promise.all([
    getListingsPaged({
      category: category?.key,
      attrs,
      q: get("q"),
      propertyType: get("tur"),
      district: get("ilce"),
      // Emlak kolonlarına dayanan filtreler yalnız emlak kapsamında geçer.
      // Vasıta listesine paylaşılan bir URL'de "oda=3+1" kalırsa sorgu sessizce
      // hiçbir sonuç dönmüyordu — kullanıcı boş listeyi kendi aramasına yoruyor.
      rooms: isRealEstate ? get("oda") : undefined,
      zoning: isRealEstate ? get("imar") : undefined,
      sort: get("sira"),
      minPrice: pos(get("min")),
      maxPrice: pos(get("max")),
      minArea: isRealEstate ? minAlan : undefined,
      maxArea: isRealEstate ? maxAlan : undefined,
      furnished: isRealEstate && !!get("esyali"),
      parking: isRealEstate && !!get("otopark"),
      balcony: isRealEstate && !!get("balkon"),
      inSite: isRealEstate && !!get("site"),
      verified: isRealEstate && !!get("dogrulanmis"),
      agencySlug,
      agentSlug,
    }, page, PER_PAGE),
    agencySlug
      ? getPublicListingOwner("agency", agencySlug)
      : agentSlug
        ? getPublicListingOwner("agent", agentSlug)
        : Promise.resolve(null),
    getMarketplaceStats(),
  ]);
  const categoryCounts = stats.categoryCounts;
  const { items, total, totalPages } = listingResult;
  const pageTitle = owner
    ? `${owner.name} Portföyü`
    : get("ilce")
      ? `${get("ilce")} İlanları`
      : category
        ? `${category.label} İlanları`
        : "İlanlar";

  // Görünüm URL'den okunuyor (ViewSwitcher yazıyor); varsayılan yoğun liste.
  const gallery = get("gorunum") === "galeri";

  // KATEGORİSİZ GİRİŞ: "Tüm ilanlar" kaldırıldı. Filtresiz bir listeyle
  // karşılamak 360 ilanlık katalogda kullanıcıya karar verdirmiyor; kategori
  // seçimi gösteriyoruz. Ofis/danışman portföyü bunun dışında — orada kategori
  // yok ama liste anlamlı.
  const needsCategoryChoice = !category && !owner;

  const flatParams: Record<string, string | undefined> = {};
  Object.entries(sp).forEach(([k, v]) => { if (typeof v === "string") flatParams[k] = v; });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <TrackView />
      <nav aria-label="Sayfa yolu" className="mb-1.5 text-[13px] text-muted">
        <Link href="/" className="hover:text-brand-700">Ana Sayfa</Link>
        <span className="mx-1.5 text-stone">/</span>
        <span className="text-ink">{pageTitle}</span>
      </nav>
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{pageTitle}</h1>
        {owner ? (
          <Link
            href={agencySlug ? `/emlak-ofisi/${owner.slug}` : `/danisman/${owner.slug}`}
            className="mt-1 inline-flex text-[13px] font-semibold text-brand-700 hover:underline"
          >
            {agencySlug ? "Ofis profiline dön" : "Danışman profiline dön"}
          </Link>
        ) : null}
      </div>

      {needsCategoryChoice ? (
        <section className="py-2">
          <p className="mb-4 max-w-2xl text-sm text-muted">
            Kategori seçin; filtreler ve sıralama seçtiğiniz kategoriye göre açılır.
          </p>
          <CategoryPicker counts={categoryCounts} />
        </section>
      ) : (
      <>
      {/* Ofis/danışman portföyü emlağa özgü olduğu için orada kategori yok */}
      {!owner && (
        <Suspense fallback={<div className="mb-4 h-11 border-b border-stone" />}>
          <CategoryTabs />
        </Suspense>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
        <aside className="lg:col-span-3">
          {/* Ray masaüstünde yapışkan: uzun listede filtreler ekranda kalır. */}
          <div className="lg:sticky lg:top-4">
            <Suspense fallback={<div className="h-24 rounded-card border border-stone bg-paper" />}>
              <ListingFilters />
            </Suspense>
          </div>
        </aside>

        <div className="lg:col-span-9">
          {/* Araç çubuğu: sonuç sayısı + görünüm + sıralama tek satırda. */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-card border border-stone bg-paper px-3 py-2">
            <p className="text-[13px] text-muted">
              <strong className="font-semibold tabular-nums text-ink">{total}</strong> sonuç
            </p>
            <div className="flex items-center gap-2">
              <Suspense fallback={<div className="h-10 w-20 rounded-control border border-stone" />}>
                <ViewSwitcher />
              </Suspense>
              <Suspense fallback={<div className="h-10 w-40 rounded-control border border-stone" />}>
                <ListingSort />
              </Suspense>
            </div>
          </div>

          {items.length > 0 ? (
            <>
              <div className={gallery ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-3"}>
                {items.map((l, index) => (
                  <ListingCard
                    key={l.slug}
                    listing={l}
                    priority={index < 3}
                    variant={gallery ? "standard" : "row"}
                  />
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} searchParams={flatParams} />
            </>
          ) : (
            <div className="rounded-card border border-stone bg-paper p-10 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-control border border-stone bg-canvas text-muted">
                <SearchX className="h-6 w-6" />
              </span>
              <h2 className="mt-3 text-base font-bold text-ink">Bu kriterlere uygun ilan bulunamadı</h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
                {isRealEstate
                  ? "Filtreleri biraz gevşetin ya da talebinizi bırakın; uygun ilan geldiğinde haber verelim."
                  : "Filtreleri biraz gevşetin ya da başka bir alt tür deneyin."}
              </p>
              {/* Talep bırakma yalnız emlakta: eşleştirme emlak kriterleriyle çalışıyor. */}
              {isRealEstate && (
                <Link href="/alici-talebi" className="mt-4 inline-flex items-center justify-center rounded-control bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">
                  Talep Bırak
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      </>
      )}

      <div className="mt-10">
        <NotFoundCTA category={category?.key} />
      </div>
    </div>
  );
}
