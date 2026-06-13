import Link from "next/link";
import {
  Building2, LandPlot, Home as HomeIcon, Trees, LineChart, Headset, ShieldCheck,
  CheckCircle2, MapPin, Award, Star, BarChart3, ArrowRight, Phone,
} from "lucide-react";
import { getFeaturedListings, getMapPoints } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { DISTRICTS, LANDING_PAGES } from "@/lib/constants";
import { SITE, telLink } from "@/lib/site";
import ListingCard from "@/components/ListingCard";
import HomeSearch from "@/components/HomeSearch";
import SellerForm from "@/components/SellerForm";
import ListingsMap from "@/components/ListingsMap";
import NotFoundCTA from "@/components/NotFoundCTA";
import TrackView from "@/components/TrackView";

export const revalidate = 300; // ISR: her 5 dakikada yenilenir (CDN cache + admin revalidatePath)

const TESTIMONIALS = [
  { name: "Ahmet Y.", role: "Daire Sahibi · Merkez", text: "Dairemi 3 hafta içinde, beklediğim fiyata sattılar. Süreç boyunca her adımda bilgilendirildim. Çok profesyonel bir ekip.", stars: 5 },
  { name: "Selin K.", role: "Yatırımcı · Tavşanlı", text: "Yatırımlık arsa ararken bölge analizleri çok işime yaradı. Doğru lokasyonu seçmemde gerçekten yardımcı oldular.", stars: 5 },
  { name: "Mehmet D.", role: "Alıcı · Simav", text: "WhatsApp'tan yazdım, yarım saat içinde aradılar ve ertesi gün mülkü gezdik. Hız ve ilgi mükemmeldi.", stars: 5 },
];

async function getHomeTexts() {
  const keys = [
    "home_hero_badge", "home_hero_title", "home_hero_highlight",
    "home_hero_subtitle", "home_stat_sales", "home_stat_years", "home_why_title",
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

  const testimonials = dbTestimonials.length > 0 ? dbTestimonials : TESTIMONIALS;

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

  return (
    <>
      <TrackView />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 text-white">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px)", backgroundSize: "34px 34px" }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:py-20 lg:grid-cols-2">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium ring-1 ring-gold-400/40">
              <Star className="h-3.5 w-3.5 fill-current text-gold-400" /> {heroBadge}
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
              {heroTitle}
              <span className="text-gold-400"> {heroHighlight}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-brand-100">{heroSubtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/ilanlar" className="rounded-xl bg-gold-500 px-6 py-3.5 text-center font-bold text-brand-950 transition hover:bg-gold-400">
                İlanları İncele
              </Link>
              <a href={telLink()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-3.5 text-center font-bold text-white ring-1 ring-white/30 transition hover:bg-white/20">
                <Phone className="h-4 w-4" /> {SITE.phone}
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-brand-100">
              <Link href="/degerleme" className="inline-flex items-center gap-1.5 font-medium text-gold-300 underline-offset-4 hover:underline">
                <BarChart3 className="h-4 w-4" /> Evimin değeri ne kadar?
              </Link>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-gold-400" /> Komisyonlu Güvenli Satış</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-gold-400" /> Yatırım Danışmanlığı</span>
            </div>
          </div>

          {/* SATICI FORMU */}
          <div className="animate-fade-up rounded-3xl bg-white p-6 text-slate-900 shadow-2xl sm:p-7" id="satici-formu">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold text-brand-900">Mülkünüzü Satmak mı İstiyorsunuz?</h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Formu doldurun, uzman ekibimiz <strong className="text-brand-700">ücretsiz değerleme</strong> için sizi arasın.
              </p>
            </div>
            <div className="mt-5">
              <SellerForm />
            </div>
          </div>
        </div>
      </section>

      {/* ARAMA / FİLTRE BANDI */}
      <section className="relative z-10 mx-auto -mt-7 max-w-6xl px-4">
        <HomeSearch />
      </section>

      {/* İSTATİSTİK BANDI */}
      <section className="border-b border-slate-200 bg-white pt-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4">
          {[
            { v: `${totalActive}+`, l: "Aktif İlan", Icon: Building2 },
            { v: `${totalSold + Number(statSales || 850)}+`, l: "Tamamlanan Satış", Icon: CheckCircle2 },
            { v: "13", l: "İlçede Hizmet", Icon: MapPin },
            { v: `${statYears}+`, l: "Yıl Tecrübe", Icon: Award },
          ].map((s) => (
            <div key={s.l} className="flex flex-col items-center text-center">
              <span className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <s.Icon className="h-5 w-5" />
              </span>
              <p className="font-display text-3xl font-bold text-brand-800 sm:text-4xl">{s.v}</p>
              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KATEGORİLER */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-brand-900">Ne Arıyorsunuz?</h2>
          <div className="gold-divider mx-auto mt-3" />
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {LANDING_PAGES.map((c) => {
            const Icon =
              c.propertyType === "daire" ? Building2 :
              c.propertyType === "arsa" ? LandPlot :
              c.propertyType === "villa" ? HomeIcon : Trees;
            return (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="group rounded-2xl bg-white p-7 text-center ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-prestige hover:ring-brand-200"
              >
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 transition group-hover:from-brand-700 group-hover:to-brand-900 group-hover:text-gold-300">
                  <Icon className="h-7 w-7" strokeWidth={1.6} />
                </span>
                <h3 className="mt-4 font-semibold text-slate-800 group-hover:text-brand-700">{c.title}</h3>
                <p className="mt-1 inline-flex items-center justify-center gap-1 text-xs font-medium text-gold-600 opacity-0 transition group-hover:opacity-100">
                  İncele <ArrowRight className="h-3 w-3" />
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ÖNE ÇIKAN İLANLAR */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-gold-600">Vitrin</p>
            <h2 className="font-display text-3xl font-bold text-brand-900">Öne Çıkan İlanlar</h2>
            <div className="gold-divider mt-2" />
          </div>
          <Link href="/ilanlar" className="hidden text-sm font-semibold text-brand-700 hover:underline sm:inline-flex">
            Tümünü Gör →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* HARİTA */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:p-8">
          <h2 className="font-display text-3xl font-bold text-brand-900">Haritada Keşfedin</h2>
          <p className="mt-1 text-slate-600">İlçe seçerek bölgedeki tüm ilanları harita üzerinde görüntüleyin.</p>
          <div className="mt-6">
            <ListingsMap points={points} height="480px" />
          </div>
        </div>
      </section>

      {/* SÜREÇ / NEDEN BİZ */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-brand-900">{whyTitle}</h2>
            <div className="gold-divider mx-auto mt-3" />
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { Icon: LineChart, title: "Veri Destekli Bölge Analizi", text: "Her ilanda bölge analizi, yatırım puanı ve gelişim potansiyeli otomatik sunulur." },
              { Icon: Headset, title: "Dakikalar İçinde İletişim", text: "Telefon, WhatsApp, randevu ve ekspertiz talebiyle saniyeler içinde bize ulaşın." },
              { Icon: ShieldCheck, title: "Güvenli & Şeffaf Satış", text: "Tüm satış sürecini şeffaf ve güvenli şekilde sizin için yönetiyoruz." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl bg-brand-50 p-7 ring-1 ring-brand-100">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-brand-700 ring-1 ring-brand-100">
                  <f.Icon className="h-6 w-6" strokeWidth={1.7} />
                </span>
                <h3 className="mt-4 text-lg font-bold text-brand-900">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MÜŞTERİ YORUMLARI */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-brand-900">Müşterilerimiz Ne Diyor?</h2>
          <div className="gold-divider mx-auto mt-3" />
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <figure key={i} className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
              <div className="flex gap-0.5 text-gold-400">
                {Array.from({ length: Math.max(1, Math.min(5, t.stars)) }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-3 text-sm leading-relaxed text-slate-700">&ldquo;{t.text}&rdquo;</blockquote>
              <figcaption className="mt-4 border-t border-slate-100 pt-3">
                <p className="font-semibold text-brand-900">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* İLÇELER */}
      <section className="mx-auto max-w-7xl px-4">
        <h2 className="font-display text-2xl font-bold text-brand-900">İlçelere Göre Ara</h2>
        <div className="gold-divider mt-2 mb-5" />
        <div className="flex flex-wrap gap-3">
          {DISTRICTS.map((d) => (
            <Link
              key={d.slug}
              href={`/ilanlar?ilce=${encodeURIComponent(d.name)}`}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:text-brand-700 hover:ring-brand-300"
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
