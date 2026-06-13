import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildAnalysis } from "@/lib/analysis";
import { formatPrice, formatDate, parseJsonArray } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { SITE } from "@/lib/site";
import Gallery from "@/components/Gallery";
import ContactButtons from "@/components/ContactButtons";
import AnalysisSection from "@/components/AnalysisSection";
import ListingMedia from "@/components/ListingMedia";
import PriceHistoryCard from "@/components/PriceHistoryCard";
import ListingsMap from "@/components/ListingsMap";
import ListingCard from "@/components/ListingCard";
import NotFoundCTA from "@/components/NotFoundCTA";
import TrackView from "@/components/TrackView";
import ListingDetailActions from "@/components/ListingDetailActions";
import ShareButtons from "@/components/ShareButtons";
import MobileContactBar from "@/components/MobileContactBar";
import RecentlyViewed from "@/components/RecentlyViewed";

export const revalidate = 300; // ISR: her 5 dakikada yenilenir (CDN cache + admin revalidatePath)

// Onaylı ilanları build'de önceden üret (ISR cache'lenebilir olur).
// Yeni ilanlar talep anında üretilip cache'lenir (dynamicParams varsayılan true).
export async function generateStaticParams() {
  const listings = await prisma.listing.findMany({
    where: { moderationStatus: "approved", status: { not: "passive" } },
    select: { slug: true },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
  return listings.map((l) => ({ slug: l.slug }));
}

async function getListing(slug: string) {
  return prisma.listing.findFirst({
    where: { slug, moderationStatus: "approved" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      agent: { select: { name: true, title: true, agency: true } },
      priceHistory: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) return { title: "İlan bulunamadı" };
  const title = listing.metaTitle || listing.title;
  const description =
    listing.metaDescription || listing.description.slice(0, 155);
  const image = listing.images[0]?.url;
  return {
    title,
    description,
    alternates: { canonical: `${SITE.url}/ilan/${listing.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
  };
}

const DetailRow = ({ label, value }: { label: string; value?: string | number | null }) =>
  value === null || value === undefined || value === "" ? null : (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800 text-right">{value}</span>
    </div>
  );

export default async function ListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();

  // Görüntülenme sayacı (best-effort)
  prisma.listing.update({ where: { id: listing.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const district = await prisma.district.findFirst({ where: { name: listing.district } });
  const analysis = buildAnalysis(listing, district);
  const features = parseJsonArray(listing.features);

  // Benzer ilanlar
  const similarRaw = await prisma.listing.findMany({
    where: {
      status: "active",
      moderationStatus: "approved",
      id: { not: listing.id },
      OR: [{ district: listing.district }, { propertyType: listing.propertyType }],
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 3,
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });
  const similar = similarRaw.map((l) => ({
    slug: l.slug, title: l.title, price: l.price, currency: l.currency,
    propertyType: l.propertyType, district: l.district, neighborhood: l.neighborhood,
    rooms: l.rooms, areaGross: l.areaGross, status: l.status, featured: l.featured,
    coverImage: l.images[0]?.url ?? null,
  }));

  const mapPoints =
    listing.lat != null && listing.lng != null
      ? [{
          id: listing.id, slug: listing.slug, title: listing.title, price: listing.price,
          currency: listing.currency, district: listing.district, neighborhood: listing.neighborhood,
          propertyType: listing.propertyType, rooms: listing.rooms, areaGross: listing.areaGross,
          featured: listing.featured, coverImage: listing.images[0]?.url ?? null,
          lat: listing.lat, lng: listing.lng,
        }]
      : [];

  const isLand = listing.propertyType === "arsa" || listing.propertyType === "tarla";

  const snapshot = {
    slug: listing.slug, title: listing.title, price: listing.price, currency: listing.currency,
    propertyType: listing.propertyType, district: listing.district, neighborhood: listing.neighborhood,
    rooms: listing.rooms, areaGross: listing.areaGross, areaNet: listing.areaNet,
    floor: listing.floor, buildingAge: listing.buildingAge, heating: listing.heating,
    status: listing.status, featured: listing.featured, coverImage: listing.images[0]?.url ?? null,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: listing.description,
    url: `${SITE.url}/ilan/${listing.slug}`,
    image: listing.images.map((i) => i.url),
    datePosted: listing.createdAt.toISOString(),
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: listing.currency,
      availability: listing.status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.district,
      addressRegion: "Kütahya",
      addressCountry: "TR",
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-36 lg:pb-6">
      <TrackView listingId={listing.id} district={listing.district} />
      <MobileContactBar listingId={listing.id} listingTitle={listing.title} district={listing.district} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-700">Ana Sayfa</Link>
        <span className="mx-2">/</span>
        <Link href="/ilanlar" className="hover:text-brand-700">İlanlar</Link>
        <span className="mx-2">/</span>
        <Link href={`/ilanlar?ilce=${encodeURIComponent(listing.district)}`} className="hover:text-brand-700">{listing.district}</Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* SOL: galeri + detay */}
        <div className="lg:col-span-2 space-y-8">
          <Gallery images={listing.images} title={listing.title} />

          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                    {PROPERTY_TYPE_LABELS[listing.propertyType] || listing.propertyType}
                  </span>
                  {listing.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 ring-1 ring-green-200">
                      ✓ Doğrulanmış İlan
                    </span>
                  )}
                </div>
                <h1 className="mt-2 text-2xl font-extrabold text-slate-900">{listing.title}</h1>
                <p className="mt-1 inline-flex items-center gap-1.5 text-slate-500">
                  <MapPin className="h-4 w-4 text-gold-500" /> {listing.neighborhood ? `${listing.neighborhood}, ` : ""}{listing.district} / Kütahya
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-brand-700">{formatPrice(listing.price, listing.currency)}</p>
                <p className="text-xs text-slate-400">İlan No: {listing.id.slice(-6).toUpperCase()}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-8 sm:grid-cols-2">
              <div>
                <DetailRow label="Mülk Türü" value={PROPERTY_TYPE_LABELS[listing.propertyType]} />
                <DetailRow label="İlçe" value={listing.district} />
                <DetailRow label="Mahalle" value={listing.neighborhood} />
                {!isLand && <DetailRow label="Oda Sayısı" value={listing.rooms} />}
                {!isLand && <DetailRow label="Brüt / Net m²" value={listing.areaGross ? `${listing.areaGross}${listing.areaNet ? ` / ${listing.areaNet}` : ""} m²` : null} />}
                {isLand && <DetailRow label="Alan" value={listing.areaGross ? `${listing.areaGross} m²` : null} />}
                {!isLand && <DetailRow label="Bulunduğu Kat" value={listing.floor} />}
                {!isLand && <DetailRow label="Kat Sayısı" value={listing.totalFloors} />}
              </div>
              <div>
                {!isLand && <DetailRow label="Bina Yaşı" value={listing.buildingAge} />}
                {!isLand && <DetailRow label="Isıtma" value={listing.heating} />}
                {isLand && <DetailRow label="İmar Durumu" value={listing.zoningStatus} />}
                {isLand && <DetailRow label="Tapu Durumu" value={listing.deedStatus} />}
                {isLand && <DetailRow label="Ada / Parsel" value={listing.adaNo || listing.parselNo ? `${listing.adaNo || "-"} / ${listing.parselNo || "-"}` : null} />}
                {isLand && <DetailRow label="KAKS / Emsal" value={listing.kaks} />}
                {!isLand && <DetailRow label="Eşyalı" value={listing.furnished ? "Evet" : "Hayır"} />}
                {!isLand && <DetailRow label="Otopark" value={listing.parking ? "Var" : "Yok"} />}
                <DetailRow label="İlan Tarihi" value={formatDate(listing.createdAt)} />
              </div>
            </div>

            {features.length > 0 && (
              <div className="mt-5">
                <h3 className="font-semibold text-slate-900">Özellikler</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {features.map((f) => (
                    <span key={f} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">✓ {f}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="font-semibold text-slate-900">Açıklama</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{listing.description}</p>
            </div>
          </div>

          {/* FİYAT GEÇMİŞİ */}
          <PriceHistoryCard history={listing.priceHistory} currency={listing.currency} />

          {/* VIDEO & SANAL TUR */}
          <ListingMedia
            videoUrl={listing.videoUrl}
            droneUrl={listing.droneUrl}
            virtualTourUrl={listing.virtualTourUrl}
          />

          {/* AI ANALİZ */}
          <AnalysisSection analysis={analysis} />

          {/* HARİTA */}
          {mapPoints.length > 0 && (
            <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Konum</h2>
              <p className="text-sm text-slate-500">{listing.district} / Kütahya</p>
              <div className="mt-4">
                <ListingsMap points={mapPoints} height="360px" showFilter={false} />
              </div>
            </div>
          )}
        </div>

        {/* SAĞ: iletişim (sticky) */}
        <aside className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-prestige">
              <p className="font-display text-3xl font-bold text-brand-800">{formatPrice(listing.price, listing.currency)}</p>
              <p className="mt-0.5 text-sm text-slate-500">İletişime geçin, hemen yanıt verelim.</p>
              <div className="mt-4">
                <ContactButtons listingId={listing.id} listingTitle={listing.title} district={listing.district} />
              </div>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <ListingDetailActions listing={snapshot} />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <ShareButtons title={listing.title} />
              </div>
            </div>

            {/* Danışman etiketi */}
            {listing.agent && (
              <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">İlan Danışmanı</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-700 to-brand-900 text-lg font-bold text-gold-300">
                    {listing.agent.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">{listing.agent.name}</p>
                    <p className="truncate text-sm text-slate-500">
                      {listing.agent.title || "Gayrimenkul Danışmanı"}
                      {listing.agent.agency ? ` · ${listing.agent.agency}` : ""}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-slate-400">
                  Bu ilan, onaylı danışmanımız tarafından yayınlanmıştır. İletişim için yukarıdaki butonları kullanın.
                </p>
              </div>
            )}
            <div className="rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100 text-center">
              <p className="text-sm font-semibold text-brand-900">Bu mülke benzer fırsatlar mı arıyorsunuz?</p>
              <Link href="/ilanlar" className="mt-2 inline-block text-sm font-bold text-brand-700 hover:underline">Tüm ilanları gör →</Link>
            </div>
          </div>
        </aside>
      </div>

      {/* BENZER İLANLAR */}
      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold text-brand-900">Benzer İlanlar</h2>
          <div className="gold-divider mt-2 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {similar.map((l) => (
              <ListingCard key={l.slug} listing={l} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed excludeSlug={listing.slug} />

      <section className="mt-14">
        <NotFoundCTA />
      </section>
    </div>
  );
}
