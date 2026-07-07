import Link from "next/link";
import {
  Building2, LandPlot, Home as HomeIcon, Trees, LineChart, Headset, ShieldCheck,
  CheckCircle2, Star, BarChart3, ArrowRight, Phone,
} from "lucide-react";
import { getFeaturedListings, getMapPoints } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { DISTRICTS, LANDING_PAGES } from "@/lib/constants";
import { SITE, telLink } from "@/lib/site";
import ListingCard from "@/components/ListingCard";
import HomeSearch from "@/components/HomeSearch";
import ListingsMap from "@/components/ListingsMap";
import NotFoundCTA from "@/components/NotFoundCTA";
import TrackView from "@/components/TrackView";
import HomeJsonLd from "@/components/HomeJsonLd";

export const revalidate = 300; // ISR: her 5 dakikada yenilenir (CDN cache + admin revalidatePath)

async function getHomeTexts() {
  const keys = [
    "home_hero_badge", "home_hero_title", "home_hero_highlight",
    "home_hero_subtitle", "home_stat_sales", "home_stat_years", "home_why_title",
    "home_hero_image",
  ];
  try {
    const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
    return new Map(rows.filter((r) => r.value?.trim()).map((r) => [r.key, r.value]));
  } catch {
    return new Map<string, string>();
  }
}

export default async function Home() {
  const [featured, points, totalActive, totalSold, texts, dbTestimonials] = await Promise.all([
    getFeaturedListings(6),
    getMapPoints(),
    prisma.listing.count({ where: { status: "active" } }),
    prisma.listing.count({ where: { status: "sold" } }),
    getHomeTexts(),
    prisma.testimonial
      .findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] })
      .catch(() => []),
  ]);

  const testimonials = dbTestimonials; // yayınlı yorum yoksa bölüm gizlenir (sahte yorum yok)

  const t = (k: string, fallback: string) => texts.get(k) || fallback;
  const heroBadge = t("home_hero_badge", SITE.brand);
  const heroTitle = t("home_hero_title", "Kütahya'da Doğru Gayrimenkul,");
  const heroHighlight = t("home_hero_highlight", "Doğru Fiyata");
  const heroSubtitle = t(
    "home_hero_subtitle",
    `Merkez, Tavşanlı, Simav, Gediz, Emet ve tüm ilçelerde satılık daire, arsa, villa ve yatırımlık tarla. ${totalActive}+ güncel ilan, yapay zeka destekli bölge analizi ve dakikalar içinde iletişim.`
  );
  const statSales = texts.get("home_stat_sales");
  const statYears = texts.get("home_stat_years") || "15";
  const whyTitle = t("home_why_title", `Neden ${SITE.name}?`);
  const heroImage = texts.get("home_hero_image");

  return (
    <>
      <TrackView />
      <HomeJsonLd />

      {/* HERO — arama odakta */}
      <section className="relative isolate overflow-hidden bg-brand-950 text-white">
        {heroImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-55" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-950/70 via-brand-950/45 to-brand-950/80" />
          </>
        ) : (
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-900/60 to-transparent" />
        )}
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
          <span className="animate-fade-up inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium ring-1 ring-gold-400/40">
            <Star className="h-3.5 w-3.5 fill-current text-gold-400" /> {heroBadge}
          </span>
          <h1 className="animate-fade-up mt-5 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.01em] sm:text-5xl">
            {heroTitle}
            <span className="text-gold-400"> {heroHighlight}</span>
          </h1>
          <p className="animate-fade-up mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-brand-100">
            {heroSubtitle}
          </p>
        </div>

        {/* Arama — sayfanın tek en önemli öğesi */}
        <div className="relative mx-auto -mb-10 max-w-5xl px-4 sm:-mb-12">
          <div className="animate-fade-up rounded-2xl bg-white p-4 text-slate-900 shadow-prestige ring-1 ring-slate-200 sm:p-5">
            <HomeSearch />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-slate-500">
              <Link href="/degerleme" className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:text-brand-800">
                <BarChart3 className="h-4 w-4" /> Evimin değeri ne kadar?
              </Link>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-600" /> Komisyonlu güvenli satış</span>
              <a href={telLink()} className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:text-brand-800">
                <Phone className="h-4 w-4" /> {SITE.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* İSTATİSTİK BANDI — ikon kutusuz, hairline ayraçlı */}
      <section className="border-b border-slate-200 bg-white pt-16 sm:pt-20">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-y divide-slate-100 px-4 py-2 sm:grid-cols-4 sm:divide-y-0">
          {[
            { v: `${totalActive}+`, l: "Aktif İlan" },
            { v: `${totalSold + Number(statSales || 850)}+`, l: "Tamamlanan Satış" },
            { v: "13", l: "İlçede Hizmet" },
            { v: `${statYears}+`, l: "Yıl Tecrübe" },
          ].map((s) => (
            <div key={s.l} className="px-4 py-7 text-center">
              <p className="font-display text-3xl font-bold tabular-nums text-brand-800 sm:text-4xl">{s.v}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KATEGORİLER */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">Ne Arıyorsunuz?</h2>
        <p className="mt-1.5 text-slate-500">Mülk türüne göre Kütahya portföyünü keşfedin.</p>
        <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {LANDING_PAGES.map((c) => {
            const Icon =
              c.propertyType === "daire" ? Building2 :
              c.propertyType === "arsa" ? LandPlot :
              c.propertyType === "villa" ? HomeIcon : Trees;
            return (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="group flex flex-col items-center justify-center gap-4 rounded-xl bg-white p-6 text-center ring-1 ring-slate-200 transition duration-300 hover:shadow-card hover:ring-brand-200"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white">
                  <Icon className="h-7 w-7" strokeWidth={1.6} />
                </span>
                <span className="font-display text-lg font-semibold text-slate-900">{c.title}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ÖNE ÇIKAN İLANLAR */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">Öne Çıkan İlanlar</h2>
            <p className="mt-1.5 text-slate-500">Editörün seçtiği güncel fırsatlar.</p>
          </div>
          <Link href="/ilanlar" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
            Tümünü gör <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((l) => (
            <ListingCard key={l.slug} listing={l} />
          ))}
        </div>
        {featured.length === 0 && (
          <p className="rounded-xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-200">
            Henüz ilan eklenmemiş. Yönetim panelinden ilan ekleyebilirsiniz.
          </p>
        )}
      </section>

      {/* MÜLKÜNÜ SAT — CTA */}
      <section className="px-4 py-16">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl bg-brand-950 p-10 text-center sm:p-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-700/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Mülkünüzü satmak mı istiyorsunuz?
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-brand-100">
              Uzman ekibimizle gayrimenkulünüzün gerçek piyasa değerini öğrenin ve güvenle satışa çıkarın.
            </p>
            <Link
              href="/satici"
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 font-semibold text-brand-800 transition-colors hover:bg-brand-50"
            >
              Ücretsiz Değerleme Al
            </Link>
          </div>
        </div>
      </section>

      {/* HARİTA */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-7">
          <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">Haritada Keşfedin</h2>
          <p className="mt-1.5 text-slate-500">İlçe seçerek bölgedeki tüm ilanları harita üzerinde görüntüleyin.</p>
          <div className="mt-6 overflow-hidden rounded-xl ring-1 ring-slate-200">
            <ListingsMap points={points} height="480px" />
          </div>
        </div>
      </section>

      {/* SÜREÇ / NEDEN BİZ */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">{whyTitle}</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Kütahya gayrimenkul piyasasında güven, hız ve uzmanlık standartlarını belirliyoruz.
            </p>
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            {[
              { Icon: LineChart, title: "Veri Destekli Bölge Analizi", text: "Her ilanda bölge analizi, yatırım puanı ve gelişim potansiyeli otomatik sunulur." },
              { Icon: Headset, title: "Dakikalar İçinde İletişim", text: "Telefon, WhatsApp, randevu ve ekspertiz talebiyle saniyeler içinde bize ulaşın." },
              { Icon: ShieldCheck, title: "Güvenli & Şeffaf Satış", text: "Tüm satış sürecini şeffaf ve güvenli şekilde sizin için yönetiyoruz." },
            ].map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center">
                <span className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-brand-50 text-brand-700">
                  <f.Icon className="h-9 w-9" strokeWidth={1.6} />
                </span>
                <h3 className="font-display text-xl font-semibold text-brand-900">{f.title}</h3>
                <p className="mt-3 leading-relaxed text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MÜŞTERİ YORUMLARI — yalnız yayınlı yorum varsa */}
      {testimonials.length > 0 && (
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">Müşterilerimiz Ne Diyor?</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <figure key={i} className="rounded-xl bg-white p-6 ring-1 ring-slate-200">
              <div className="flex gap-0.5 text-gold-500">
                {Array.from({ length: Math.max(1, Math.min(5, t.stars)) }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-3 text-[15px] leading-relaxed text-slate-700">&ldquo;{t.text}&rdquo;</blockquote>
              <figcaption className="mt-4 border-t border-slate-100 pt-3">
                <p className="font-semibold text-brand-900">{t.name}</p>
                <p className="text-[13px] text-slate-500">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
      )}

      {/* İLÇELER */}
      <section className="mx-auto max-w-7xl px-4">
        <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">İlçelere Göre Ara</h2>
        <p className="mt-1.5 text-slate-500">Kütahya merkez ve tüm ilçelerde güncel ilanlar.</p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {DISTRICTS.map((d) => (
            <Link
              key={d.slug}
              href={`/ilanlar?ilce=${encodeURIComponent(d.name)}`}
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:text-brand-700 hover:ring-brand-300"
            >
              {d.name}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <NotFoundCTA />
      </section>
    </>
  );
}
