import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Check, MapPin } from "lucide-react";
import HomeJsonLd from "@/components/HomeJsonLd";
import HomeSearch from "@/components/HomeSearch";
import CategoryPicker from "@/components/CategoryPicker";
import ListingCard from "@/components/ListingCard";
import ListingsMap from "@/components/ListingsMap";
import NotFoundCTA from "@/components/NotFoundCTA";
import TrackView from "@/components/TrackView";
import { DISTRICTS } from "@/lib/constants";
import { getFeaturedListings, getMapPoints, getShowcaseListings } from "@/lib/listings";
import { getMarketplaceStats } from "@/lib/marketplaceStats";
import { prisma } from "@/lib/prisma";

// Emlak zaten LANDING_PAGES üzerinden mülk türü kırılımıyla listeleniyor.

export const revalidate = 300;
export const metadata: Metadata = { alternates: { canonical: "/" } };

async function getHomeTexts() {
  const keys = [
    "home_hero_badge", "home_hero_title", "home_hero_highlight",
    "home_hero_subtitle", "home_why_title",
    "home_hero_image",
  ];
  try {
    const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
    return new Map(rows.filter((row) => row.value?.trim()).map((row) => [row.key, row.value]));
  } catch {
    return new Map<string, string>();
  }
}

export default async function Home() {
  const [showcase, featured, points, marketplaceStats, texts, testimonials] = await Promise.all([
    getShowcaseListings(12),
    getFeaturedListings(6),
    getMapPoints(),
    getMarketplaceStats(),
    getHomeTexts(),
    prisma.testimonial.findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }).catch(() => []),
  ]);

  const t = (key: string, fallback: string) => texts.get(key) || fallback;
  // Sloganlar genel ilan diline çekildi: "gayrimenkul" ve "mülk" ifadeleri
  // vasıta/teknoloji ilanlarıyla çelişiyordu. CMS (Setting) hâlâ ezebilir.
  const heroTitle = t("home_hero_title", "Kütahya'da alınır satılır ne varsa,");
  const heroHighlight = t("home_hero_highlight", "tek yerde");
  const heroSubtitle = t(
    "home_hero_subtitle",
    `Emlak, vasıta ve teknoloji — merkez ve tüm ilçelerde ${marketplaceStats.activeListings} güncel ilan. Kategori seçin, aradığınıza dakikalar içinde ulaşın.`,
  );
  const whyTitle = t("home_why_title", "Kütahya'yı yakından tanıyoruz");
  const categoryCoverByType = new Map<string, string>();
  for (const listing of featured) {
    if (listing.coverImage && !categoryCoverByType.has(listing.propertyType)) categoryCoverByType.set(listing.propertyType, listing.coverImage);
  }

  return (
    <>
      <TrackView />
      <HomeJsonLd />

      {/* ÜST BANT — arama. Dev illüstrasyon kaldırıldı: dergi kapağı düzeni
          kullanıcıyı ilana değil manzaraya bakmaya davet ediyordu. */}
      <section className="border-b border-stone bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 sm:py-8">
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {heroTitle} <span className="text-brand-700">{heroHighlight}</span>
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">{heroSubtitle}</p>
          <div className="mt-4">
            <HomeSearch />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-muted">
            <Link href="/degerleme" className="inline-flex items-center gap-1.5 text-brand-700 hover:text-brand-900">
              <BarChart3 className="h-4 w-4" /> Bölgesel ön değerleme
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-700" /> Şeffaf satış süreci
            </span>
          </div>
        </div>
      </section>

      {/* ÖNE ÇIKAN İLANLAR — sayfanın ilk içeriği. Kare karolar, her tazelemede
          farklı seçki; kullanıcı hemen gerçek ilan görüyor. */}
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-ink sm:text-xl">Öne çıkan ilanlar</h2>
            <p className="mt-0.5 text-sm text-muted">Portföyden seçki — her ziyarette değişir.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {showcase.map((listing, index) => (
            <ListingCard key={listing.slug} listing={listing} variant="tile" priority={index < 6} />
          ))}
        </div>
      </section>

      {/* KATEGORİ SEÇİMİ — "tüm ilanlar" yerine buradan giriliyor. Alt türler
          çip olarak açık: kullanıcı tek tıkla daraltılmış listeye düşüyor. */}
      <section className="border-y border-stone bg-canvas">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10">
          <h2 className="text-lg font-bold tracking-tight text-ink sm:text-xl">Ne arıyorsunuz?</h2>
          <p className="mt-0.5 text-sm text-muted">Kategori seçin; filtreler seçtiğiniz kategoriye göre açılır.</p>

          <CategoryPicker counts={marketplaceStats.categoryCounts} className="mt-5" />

          {/* Sayaç bandı — ayrı bir bölüm yerine kategori seçiminin altına alındı. */}
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-stone bg-stone sm:grid-cols-4">
            {([
              [marketplaceStats.activeListings, "Güncel ilan"],
              [marketplaceStats.soldListings, "Satılmış ilan"],
              [marketplaceStats.approvedAgencies, "Onaylı emlak ofisi"],
              [marketplaceStats.activeDistricts, "Portföylü ilçe"],
            ] as const).map(([value, label]) => (
              <div key={label} className="bg-paper px-4 py-3 text-center">
                <p className="text-xl font-bold tabular-nums text-ink">{value}</p>
                <p className="mt-0.5 text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="border-y border-stone bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="eyebrow">Güncel seçki</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Öne çıkan ilanlar</h2>
            </div>
            <Link href="/ilanlar" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-900">Kategorilere göz at <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {featured.length > 0 ? (
            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-12">
              {featured.map((listing, index) => (
                <div key={listing.slug} className={index === 0 ? "sm:col-span-2 lg:col-span-7 lg:row-span-2" : "lg:col-span-5"}>
                  <ListingCard listing={listing} priority={index < 2} variant={index === 0 ? "editorial" : index < 3 ? "compact" : "standard"} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-8 border-y border-stone py-10 text-muted">Henüz yayınlanmış ilan bulunmuyor.</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
        <div className="grid overflow-hidden border-y border-stone bg-paper lg:grid-cols-12">
          <div className="flex flex-col justify-between bg-canvas p-8 sm:p-12 lg:col-span-4 lg:border-r lg:border-stone">
            <div>
              <div className="mb-6 h-1 w-12 bg-gold-600" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Kütahya ilan haritası</p>
              <h2 className="mt-4 max-w-sm text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">İlanı, bulunduğu çevreyle birlikte değerlendirin.</h2>
              <p className="mt-5 max-w-sm leading-7 text-muted">İlçeyi seçin; emlak ilanlarının Kütahya içindeki dağılımını tek bakışta görün.</p>
            </div>
            <Link href="/harita" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-800 hover:text-brand-950">Tam ekran haritayı aç <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="lg:col-span-8"><ListingsMap points={points} height="520px" /></div>
        </div>
      </section>

      <section className="border-y border-stone bg-canvas">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-10 sm:px-6 sm:py-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Yerel uzmanlık</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{whyTitle}</h2>
          </div>
          <div className="border-t border-stone lg:col-span-8">
            {[
              ["01", "Kategorinizi seçin", "Emlak, vasıta ya da teknoloji — filtreler seçtiğiniz kategoriye göre açılır."],
              ["02", "Karşılaştırın", "İlanları kaydedin, yan yana koyun ve gerçekten uygun olanları ayırın."],
              ["03", "Satıcıyla doğrudan görüşün", "Mesaj gönderin ya da telefonu görün; aracı beklemeden iletişime geçin."],
            ].map(([number, title, text]) => (
              <div key={number} className="grid gap-3 border-b border-stone py-6 sm:grid-cols-[4rem_14rem_1fr] sm:items-start">
                <span className="font-semibold text-gold-700">{number}</span>
                <h3 className="text-lg font-bold text-ink">{title}</h3>
                <p className="leading-7 text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
          <p className="eyebrow">Deneyimler</p>
          <div className="mt-7 grid border-y border-stone md:grid-cols-3 md:divide-x md:divide-stone">
            {testimonials.slice(0, 3).map((testimonial) => (
              <figure key={testimonial.id} className="border-b border-stone py-7 last:border-b-0 md:border-b-0 md:px-7 md:first:pl-0 md:last:pr-0">
                <blockquote className="text-lg leading-8 text-ink">“{testimonial.text}”</blockquote>
                <figcaption className="mt-6 text-sm font-semibold text-brand-800">{testimonial.name}{testimonial.role ? ` · ${testimonial.role}` : ""}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="bg-brand-950 text-white">
        <div className="ceramic-grid mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-6 sm:py-16 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8">
            <p className="eyebrow !text-gold-300">Satmak mı istiyorsunuz?</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">İlanınızı dakikalar içinde yayına alın.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-brand-100">Aracınızı ya da teknoloji ürününüzü ücretsiz yayımlayın. Emlak için bölgesel ön değerleme ve satış desteği de veriyoruz.</p>
          </div>
          <div className="lg:col-span-4 lg:text-right">
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link href="/ilan-ver" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-gold-500 px-6 font-bold text-brand-950 transition hover:bg-gold-400">
                Ücretsiz ilan ver <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/satici" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-brand-700 px-6 font-semibold text-white transition hover:bg-brand-900">
                Emlak satış talebi
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6">
        <div className="flex flex-wrap gap-x-6 gap-y-3 border-y border-stone py-6">
          <span className="eyebrow inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> İlçeye göre ara</span>
          {DISTRICTS.map((district) => <Link key={district.slug} href={`/ilanlar?ilce=${encodeURIComponent(district.name)}`} className="text-sm font-semibold text-muted hover:text-brand-800">{district.name}</Link>)}
        </div>
        <div className="mt-14"><NotFoundCTA /></div>
      </section>
    </>
  );
}
