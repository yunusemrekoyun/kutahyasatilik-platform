import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Headset,
  Home as HomeIcon,
  LandPlot,
  Landmark,
  LineChart,
  MapPinned,
  Phone,
  ShieldCheck,
  Star,
  Store,
  Trees,
  Users,
} from "lucide-react";
import HomeJsonLd from "@/components/HomeJsonLd";
import HomeSearch from "@/components/HomeSearch";
import ListingCard from "@/components/ListingCard";
import ListingsMap from "@/components/ListingsMap";
import NotFoundCTA from "@/components/NotFoundCTA";
import TrackView from "@/components/TrackView";
import { getSiteContact } from "@/lib/contact";
import { DISTRICTS, LANDING_PAGES } from "@/lib/constants";
import { getFeaturedListings, getMapPoints } from "@/lib/listings";
import { getMarketplaceStats } from "@/lib/marketplaceStats";
import { publicImageUrl } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { SITE, telLink } from "@/lib/site";

export const revalidate = 300;
export const metadata: Metadata = { alternates: { canonical: "/" } };

async function getHomeTexts() {
  const keys = [
    "home_hero_badge",
    "home_hero_title",
    "home_hero_highlight",
    "home_hero_subtitle",
    "home_why_title",
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
  const [featured, points, marketplaceStats, texts, testimonials, contact] = await Promise.all([
    getFeaturedListings(6),
    getMapPoints(),
    getMarketplaceStats(),
    getHomeTexts(),
    prisma.testimonial
      .findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] })
      .catch(() => []),
    getSiteContact(),
  ]);

  const t = (key: string, fallback: string) => texts.get(key) || fallback;
  const heroTitle = t("home_hero_title", "Kütahya'da Doğru Gayrimenkul,");
  const heroHighlight = t("home_hero_highlight", "Doğru Fiyata");
  const heroSubtitle = t(
    "home_hero_subtitle",
    `Merkez ve tüm ilçelerde ${marketplaceStats.activeListings} güncel ilanı, bölgesel verileri ve yerel danışmanlığı tek yerde keşfedin.`,
  );
  const heroImage = publicImageUrl(texts.get("home_hero_image"));
  const whyTitle = t("home_why_title", `Neden ${SITE.name}?`);

  return (
    <>
      <TrackView />
      <HomeJsonLd />

      <section className="relative isolate overflow-hidden bg-brand-950 text-white">
        {heroImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt=""
              aria-hidden="true"
              loading="eager"
              fetchPriority="high"
              className="absolute inset-0 -z-10 h-full w-full object-cover opacity-55"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-950/70 via-brand-950/50 to-brand-950/90" />
          </>
        ) : (
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-900 via-brand-950 to-slate-950" />
        )}

        <div className="relative mx-auto max-w-3xl px-4 pb-24 pt-16 text-center sm:pb-28 sm:pt-20">
          <span className="animate-fade-up inline-flex min-h-9 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-medium ring-1 ring-gold-400/40">
            <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current text-gold-400" />
            {t("home_hero_badge", SITE.brand)}
          </span>
          <h1 className="animate-fade-up mt-5 text-balance font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            {heroTitle} <span className="text-gold-400">{heroHighlight}</span>
          </h1>
          <p className="animate-fade-up mx-auto mt-5 max-w-2xl text-base leading-7 text-brand-100 sm:text-lg">
            {heroSubtitle}
          </p>
        </div>

        <div className="relative mx-auto -mb-12 max-w-5xl px-4">
          <div className="animate-fade-up rounded-2xl bg-white p-4 text-slate-900 shadow-prestige ring-1 ring-slate-200 sm:p-5">
            <HomeSearch />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-slate-100 pt-3 text-[13px] text-slate-500">
              <Link href="/degerleme" className="inline-flex min-h-11 items-center gap-1.5 font-medium text-brand-700 hover:text-brand-800">
                <BarChart3 aria-hidden="true" className="h-4 w-4" /> Bölgesel ön değerleme
              </Link>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-green-600" /> Şeffaf satış süreci
              </span>
              {contact.phoneRaw && (
                <a href={telLink(contact.phoneRaw)} className="inline-flex min-h-11 items-center gap-1.5 font-medium text-brand-700 hover:text-brand-800">
                  <Phone aria-hidden="true" className="h-4 w-4" /> {contact.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white pt-16 sm:pt-20" aria-label="Portföy özeti">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-y divide-slate-100 px-4 py-2 sm:grid-cols-4 sm:divide-y-0">
          {[
            [marketplaceStats.activeListings, "Güncel ilan"],
            [marketplaceStats.soldListings, "Satılmış ilan"],
            [marketplaceStats.approvedAgencies, "Onaylı emlak ofisi"],
            [marketplaceStats.activeDistricts, "Portföylü ilçe"],
          ].map(([value, label]) => (
            <div key={label} className="px-4 py-7 text-center">
              <p className="font-display text-3xl font-bold tabular-nums text-brand-800 sm:text-4xl">{value}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:py-16">
        <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">Ne Arıyorsunuz?</h2>
        <p className="mt-1.5 text-slate-500">Mülk türüne göre Kütahya portföyünü keşfedin.</p>
        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {LANDING_PAGES.map((category) => {
            const Icon =
              category.propertyType === "daire" ? Building2
                : category.propertyType === "arsa" ? LandPlot
                  : category.propertyType === "villa" ? HomeIcon
                    : category.propertyType === "isyeri" ? Store
                      : Trees;
            return (
              <Link
                key={category.slug}
                href={`/${category.slug}`}
                className="group flex min-h-44 flex-col items-center justify-center gap-4 rounded-xl bg-white p-5 text-center ring-1 ring-slate-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-card hover:ring-brand-200"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white">
                  <Icon aria-hidden="true" className="h-7 w-7" strokeWidth={1.6} />
                </span>
                <span>
                  <span className="block font-display text-lg font-semibold text-slate-900">{category.title}</span>
                  <span className="mt-1 block text-xs tabular-nums text-slate-500">{marketplaceStats.categoryCounts[category.propertyType] ?? 0} güncel ilan</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">Öne Çıkan İlanlar</h2>
              <p className="mt-1.5 text-slate-500">Güncel portföyden öne çıkan seçenekler.</p>
            </div>
            <Link href="/ilanlar" className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
              Tümünü gör <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((listing, index) => (
                <ListingCard key={listing.slug} listing={listing} priority={index < 2} variant="standard" />
              ))}
            </div>
          ) : (
            <p className="mt-7 rounded-xl bg-slate-50 p-8 text-center text-slate-500 ring-1 ring-slate-200">Henüz yayınlanmış ilan bulunmuyor.</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:py-16">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">Haritada Keşfedin</h2>
              <p className="mt-1.5 text-slate-500">İlçe seçerek ilanları Kütahya haritası üzerinde görüntüleyin.</p>
            </div>
            <Link href="/harita" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800">
              Tam ekran harita <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 overflow-hidden rounded-xl ring-1 ring-slate-200">
            <ListingsMap points={points} height="480px" />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">{whyTitle}</h2>
            <p className="mt-3 leading-7 text-slate-600">Portföy, bölgesel veri ve yerel iletişimi aynı süreçte bir araya getiriyoruz.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { Icon: LineChart, title: "Veri Destekli Bölge Analizi", text: "İlçe fiyatlarını, yatırım puanlarını ve bölgesel göstergeleri karşılaştırın." },
              { Icon: Headset, title: "Doğrudan İletişim", text: "İlan sahibi ekip veya danışmanla telefon ve WhatsApp üzerinden iletişime geçin." },
              { Icon: ShieldCheck, title: "Şeffaf İlan Bilgisi", text: "İlan detaylarını, fiyat geçmişini ve mevcut durum bilgisini tek yerde inceleyin." },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="flex flex-col items-center text-center">
                <span className="mb-5 grid h-20 w-20 place-items-center rounded-full bg-brand-50 text-brand-700">
                  <Icon aria-hidden="true" className="h-9 w-9" strokeWidth={1.6} />
                </span>
                <h3 className="font-display text-xl font-semibold text-brand-900">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">Yerel Emlak Ağı</h2>
            <p className="mt-1.5 text-slate-500">Ofisleri, danışmanları ve resmî yerel araçları keşfedin.</p>
          </div>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {[
            { href: "/emlak-ofisleri", Icon: Building2, title: "Emlak Ofisleri", text: `${marketplaceStats.approvedAgencies} onaylı ofisin portföyünü inceleyin.` },
            { href: "/danismanlar", Icon: Users, title: "Danışmanlar", text: "Yerel danışman profillerine ve güncel ilanlarına ulaşın." },
            { href: "/yerel-araclar", Icon: Landmark, title: "Resmî Yerel Araçlar", text: "İmar, parsel ve belediye servislerine güvenli bağlantılar." },
          ].map(({ href, Icon, title, text }) => (
            <Link key={href} href={href} className="group rounded-xl bg-white p-6 ring-1 ring-slate-200 transition hover:shadow-card hover:ring-brand-200">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon aria-hidden="true" className="h-5 w-5" /></span>
              <h3 className="mt-5 font-display text-xl font-semibold text-brand-900">{title}</h3>
              <p className="mt-2 leading-7 text-slate-600">{text}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">Keşfet <ArrowRight aria-hidden="true" className="h-4 w-4" /></span>
            </Link>
          ))}
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:py-16">
            <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">Müşterilerimiz Ne Diyor?</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {testimonials.slice(0, 3).map((testimonial) => (
                <figure key={testimonial.id} className="rounded-xl bg-slate-50 p-6 ring-1 ring-slate-200">
                  <div className="flex gap-0.5 text-gold-500" aria-label={`${Math.max(1, Math.min(5, testimonial.stars))} yıldız`}>
                    {Array.from({ length: Math.max(1, Math.min(5, testimonial.stars)) }).map((_, index) => (
                      <Star key={index} aria-hidden="true" className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-3 text-[15px] leading-7 text-slate-700">“{testimonial.text}”</blockquote>
                  <figcaption className="mt-4 border-t border-slate-200 pt-3">
                    <p className="font-semibold text-brand-900">{testimonial.name}</p>
                    {testimonial.role && <p className="text-[13px] text-slate-500">{testimonial.role}</p>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-4 py-16">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl bg-brand-950 p-10 text-center sm:p-14">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-700/40 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Mülkünüzü satmak mı istiyorsunuz?</h2>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-brand-100">Bölgesel ön değerleme, portföy hazırlığı ve şeffaf satış süreci için talebinizi paylaşın.</p>
            <Link href="/satici" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-8 font-semibold text-brand-800 transition-colors hover:bg-brand-50">
              İlan Talebi Oluştur
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="mr-2 inline-flex items-center gap-2 text-sm font-bold text-brand-900"><MapPinned aria-hidden="true" className="h-4 w-4" /> İlçeye göre ara</span>
          {DISTRICTS.map((district) => (
            <Link key={district.slug} href={`/ilanlar?ilce=${encodeURIComponent(district.name)}`} className="inline-flex min-h-11 items-center rounded-lg bg-white px-4 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:text-brand-700 hover:ring-brand-300">
              {district.name}
            </Link>
          ))}
        </div>
        <div className="mt-14"><NotFoundCTA /></div>
      </section>
    </>
  );
}
