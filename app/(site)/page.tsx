import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, Check, MapPin, Phone } from "lucide-react";
import HomeJsonLd from "@/components/HomeJsonLd";
import HomeSearch from "@/components/HomeSearch";
import ListingCard from "@/components/ListingCard";
import ListingsMap from "@/components/ListingsMap";
import NotFoundCTA from "@/components/NotFoundCTA";
import TrackView from "@/components/TrackView";
import { getSiteContact } from "@/lib/contact";
import { DISTRICTS, LANDING_PAGES } from "@/lib/constants";
import { getFeaturedListings, getMapPoints } from "@/lib/listings";
import { mediaUrl } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { SITE, telLink } from "@/lib/site";

export const revalidate = 300;
export const metadata: Metadata = { alternates: { canonical: "/" } };

async function getHomeTexts() {
  const keys = [
    "home_hero_badge", "home_hero_title", "home_hero_highlight",
    "home_hero_subtitle", "home_stat_sales", "home_stat_years", "home_why_title",
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
  const [featured, points, totalActive, totalSold, texts, testimonials, contact] = await Promise.all([
    getFeaturedListings(6),
    getMapPoints(),
    prisma.listing.count({ where: { status: "active" } }),
    prisma.listing.count({ where: { status: "sold" } }),
    getHomeTexts(),
    prisma.testimonial.findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }).catch(() => []),
    getSiteContact(),
  ]);

  const t = (key: string, fallback: string) => texts.get(key) || fallback;
  const heroTitle = t("home_hero_title", "Kütahya'da doğru gayrimenkul,");
  const heroHighlight = t("home_hero_highlight", "yerel bilgiyle");
  const heroSubtitle = t(
    "home_hero_subtitle",
    `Merkez ve tüm ilçelerde ${totalActive}+ güncel portföyü, bölgesel verileri ve yerel danışmanlığı tek yerde keşfedin.`,
  );
  // Only use the deliberately selected CMS visual here. Listing covers may contain
  // agent artwork or embedded copy that does not work as a large editorial hero.
  const heroVisual = texts.get("home_hero_image") || null;
  const statSales = Number(texts.get("home_stat_sales") || 850);
  const statYears = texts.get("home_stat_years") || "15";
  const whyTitle = t("home_why_title", "Yerel pazarı yakından tanıyoruz");
  const categoryCoverByType = new Map<string, string>();
  for (const listing of featured) {
    if (listing.coverImage && !categoryCoverByType.has(listing.propertyType)) categoryCoverByType.set(listing.propertyType, listing.coverImage);
  }

  return (
    <>
      <TrackView />
      <HomeJsonLd />

      <section className="relative overflow-hidden border-b border-stone bg-canvas">
        <div className="ceramic-grid pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-55 lg:block" />
        <div className="relative mx-auto grid max-w-7xl items-stretch px-5 sm:px-6 lg:grid-cols-12">
          <div className="flex flex-col justify-center py-14 sm:py-20 lg:col-span-6 lg:pr-14 lg:py-24">
            <p className="eyebrow">{t("home_hero_badge", SITE.brand)}</p>
            <h1 className="mt-5 max-w-2xl font-display text-[42px] font-semibold leading-[1.02] tracking-[-0.035em] text-brand-950 sm:text-6xl">
              {heroTitle} <span className="italic text-brand-600">{heroHighlight}</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">{heroSubtitle}</p>

            <div className="mt-9 border border-stone bg-paper p-4 sm:p-5">
              <HomeSearch />
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-stone pt-4 text-xs font-semibold text-muted">
                <Link href="/degerleme" className="inline-flex items-center gap-1.5 text-brand-700 hover:text-brand-900"><BarChart3 className="h-4 w-4" /> Bölgesel ön değerleme</Link>
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-green-700" /> Şeffaf satış süreci</span>
                {contact.phoneRaw && <a href={telLink(contact.phoneRaw)} className="inline-flex items-center gap-1.5 text-brand-700 hover:text-brand-900"><Phone className="h-4 w-4" /> {contact.phone}</a>}
              </div>
            </div>
          </div>

          <div className="relative min-h-[390px] overflow-hidden border-x border-t border-stone bg-brand-950 lg:col-span-6 lg:min-h-[680px] lg:border-y-0 lg:border-r">
            {heroVisual ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(heroVisual)} alt="Kütahya güncel gayrimenkul portföyü" loading="eager" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <Image
                src="/brand/kutahya-editorial-hero.webp"
                alt="Kütahya silüeti ve çini motiflerinden editoryal illüstrasyon"
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                loading="eager"
                fetchPriority="high"
                className="object-cover object-center"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-950/65 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
              <p className="eyebrow !text-gold-300">Yerel portföy</p>
              <p className="mt-2 max-w-md font-display text-2xl font-semibold leading-tight">Bir ilan değil, doğru bölge ve doğru karar.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-stone bg-paper">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-stone px-5 sm:px-6 lg:grid-cols-4 lg:divide-y-0">
          {[
            [`${totalActive}+`, "Aktif ilan"],
            [`${totalSold + statSales}+`, "Tamamlanan satış"],
            ["13", "İlçede hizmet"],
            [`${statYears}+`, "Yıl deneyim"],
          ].map(([value, label]) => (
            <div key={label} className="px-4 py-7 sm:px-8">
              <p className="font-display text-3xl font-semibold tabular-nums text-brand-950">{value}</p>
              <p className="mt-1 text-sm text-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Portföyü keşfet</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">Aradığınız mülke doğrudan ulaşın.</h2>
            <p className="mt-4 max-w-md leading-7 text-muted">Kütahya portföyünü mülk türüne göre ayırdık; filtre kalabalığı olmadan başlayın.</p>
          </div>
          <div className="border-t border-stone lg:col-span-8">
            {LANDING_PAGES.map((category, index) => {
              const categoryCover = categoryCoverByType.get(category.propertyType);
              return (
                <Link key={category.slug} href={`/${category.slug}`} className="group grid grid-cols-[2rem_4.5rem_1fr_auto] items-center gap-3 border-b border-stone py-3 sm:grid-cols-[2.5rem_6rem_1fr_auto] sm:gap-4 sm:py-4">
                  <span className="font-display text-sm tabular-nums text-gold-700">0{index + 1}</span>
                  <span className="ceramic-grid relative block aspect-[4/3] overflow-hidden border border-stone bg-brand-50">
                    {categoryCover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl(categoryCover)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]" />
                    )}
                  </span>
                  <span className="font-display text-base font-semibold text-ink group-hover:text-brand-700 sm:text-xl">{category.title}</span>
                  <ArrowRight className="h-5 w-5 text-muted transition group-hover:translate-x-1 group-hover:text-brand-700" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-stone bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-24">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="eyebrow">Güncel seçki</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">Öne çıkan ilanlar</h2>
            </div>
            <Link href="/ilanlar" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-900">Tüm portföy <ArrowRight className="h-4 w-4" /></Link>
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

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-24">
        <div className="grid overflow-hidden border-y border-stone bg-paper lg:grid-cols-12">
          <div className="flex flex-col justify-between bg-canvas p-8 sm:p-12 lg:col-span-4 lg:border-r lg:border-stone">
            <div>
              <div className="mb-6 h-1 w-12 bg-gold-600" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Kütahya portföy haritası</p>
              <h2 className="mt-4 max-w-sm font-sans text-3xl font-semibold leading-tight tracking-[-0.025em] text-brand-950">İlanı, bulunduğu çevreyle birlikte değerlendirin.</h2>
              <p className="mt-5 max-w-sm leading-7 text-muted">İlçeyi seçin; güncel portföyü ve ilanların Kütahya içindeki dağılımını tek bakışta görün.</p>
            </div>
            <Link href="/harita" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-800 hover:text-brand-950">Tam ekran haritayı aç <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="lg:col-span-8"><ListingsMap points={points} height="520px" /></div>
        </div>
      </section>

      <section className="border-y border-stone bg-canvas">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-6 sm:py-24 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Yerel uzmanlık</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-brand-950">{whyTitle}</h2>
          </div>
          <div className="border-t border-stone lg:col-span-8">
            {[
              ["01", "Veriyi okuyun", "İlçe fiyatları, yatırım puanı ve gelişim potansiyelini kararınıza bağlayın."],
              ["02", "Portföyü karşılaştırın", "İlanları kaydedin, karşılaştırın ve gerçekten uygun olan seçenekleri ayırın."],
              ["03", "Yerel ekiple ilerleyin", "Randevu, ön değerleme ve satış sürecinde doğrudan Kütahya ekibiyle iletişim kurun."],
            ].map(([number, title, text]) => (
              <div key={number} className="grid gap-3 border-b border-stone py-6 sm:grid-cols-[4rem_14rem_1fr] sm:items-start">
                <span className="font-display text-gold-700">{number}</span>
                <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
                <p className="leading-7 text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-24">
          <p className="eyebrow">Deneyimler</p>
          <div className="mt-7 grid border-y border-stone md:grid-cols-3 md:divide-x md:divide-stone">
            {testimonials.slice(0, 3).map((testimonial) => (
              <figure key={testimonial.id} className="border-b border-stone py-7 last:border-b-0 md:border-b-0 md:px-7 md:first:pl-0 md:last:pr-0">
                <blockquote className="font-display text-xl leading-8 text-ink">“{testimonial.text}”</blockquote>
                <figcaption className="mt-6 text-sm font-semibold text-brand-800">{testimonial.name}{testimonial.role ? ` · ${testimonial.role}` : ""}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="bg-brand-950 text-white">
        <div className="ceramic-grid mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-6 sm:py-16 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8">
            <p className="eyebrow !text-gold-300">Satış yolculuğu</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Mülkünüzün piyasadaki yerini birlikte belirleyelim.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-brand-100">Bölgesel ön değerleme, portföy hazırlığı ve şeffaf satış süreci için talebinizi bırakın.</p>
          </div>
          <div className="lg:col-span-4 lg:text-right">
            <Link href="/satici" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-paper px-6 font-semibold text-brand-900 hover:bg-paper">Satış talebi oluştur <ArrowRight className="h-4 w-4" /></Link>
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
