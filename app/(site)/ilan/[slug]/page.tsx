import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, BadgeCheck, Check, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildAnalysis } from "@/lib/analysis";
import { formatPrice, formatDate, parseJsonArray } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { publicImageUrl } from "@/lib/media";
import { SITE } from "@/lib/site";
import Gallery from "@/components/Gallery";
import ContactButtons from "@/components/ContactButtons";
import StartConversation from "@/components/messaging/StartConversation";
import { getUserSession } from "@/lib/userAuth";
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
import { groupListingAmenities } from "@/lib/listingAmenities";

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
    where: { slug, moderationStatus: "approved", status: { not: "passive" } },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      agent: {
        select: {
          name: true, title: true, agency: true, logo: true, slug: true,
          publicProfile: true, status: true,
          _count: { select: { listings: { where: { status: "active", moderationStatus: "approved" } } } },
        },
      },
      agencyRef: {
        select: {
          name: true, slug: true, logo: true, status: true, published: true, verifiedAt: true,
          _count: { select: { listings: { where: { status: "active", moderationStatus: "approved" } } } },
        },
      },
      amenities: { orderBy: { sortOrder: "asc" }, select: { key: true } },
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
  // notFound(): status gerçekten 404 olsun. Metadata'da erken dönersek gövde
  // streaming'e girer ve HTTP 200 + soft-404 oluşur (SEO için zararlı).
  if (!listing) notFound();
  const title = listing.metaTitle || listing.title;
  const description =
    listing.metaDescription || listing.description.slice(0, 155);
  const image = publicImageUrl(listing.images[0]?.url);
  return {
    title,
    description,
    alternates: { canonical: `${SITE.url}/ilan/${listing.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE.url}/ilan/${listing.slug}`,
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

const CREDIT_LABELS: Record<string, string> = { yes: "Uygun", no: "Uygun değil", unknown: "Teyit edilmeli" };
const USAGE_LABELS: Record<string, string> = { vacant: "Boş", tenant: "Kiracılı", owner: "Mülk sahibi kullanıyor" };
const CONDITION_LABELS: Record<string, string> = { new: "Sıfır", resale: "İkinci el", under_construction: "Yapım aşamasında" };
const DEED_TYPE_LABELS: Record<string, string> = {
  kat_mulkiyeti: "Kat mülkiyeti",
  kat_irtifaki: "Kat irtifakı",
  arsa_tapulu: "Arsa tapulu",
  mustakil_tapu: "Müstakil tapu",
  hisseli_tapu: "Hisseli tapu",
};
const OCCUPANCY_LABELS: Record<string, string> = { available: "İskânlı", unavailable: "İskânsız", pending: "Başvuru sürecinde" };

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
  const amenityGroups = groupListingAmenities(listing.amenities.map((item) => item.key));

  // Bölge analizi skorlarını göster/gizle (Setting: analysis_scores; "0" ise gizli, varsayılan göster)
  const scoresSetting = await prisma.setting.findUnique({ where: { key: "analysis_scores" } });
  const session = await getUserSession();
  const showScores = scoresSetting?.value !== "0";

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

  const publicCoordinates =
    listing.locationVisibility === "hidden" || listing.lat == null || listing.lng == null
      ? null
      : listing.locationVisibility === "exact"
        ? { lat: listing.lat, lng: listing.lng }
        : { lat: Math.round(listing.lat * 100) / 100, lng: Math.round(listing.lng * 100) / 100 };
  const mapPoints =
    publicCoordinates
      ? [{
          id: listing.id, slug: listing.slug, title: listing.title, price: listing.price,
          currency: listing.currency, district: listing.district, neighborhood: listing.neighborhood,
          propertyType: listing.propertyType, rooms: listing.rooms, areaGross: listing.areaGross,
          featured: listing.featured, coverImage: listing.images[0]?.url ?? null,
          lat: publicCoordinates.lat, lng: publicCoordinates.lng,
        }]
      : [];

  const isLand = listing.propertyType === "arsa" || listing.propertyType === "tarla";
  const isCommercial = listing.propertyType === "isyeri";
  const isResidential = !isLand && !isCommercial;
  const isSold = listing.status === "sold";
  const agentLogo = publicImageUrl(listing.agent?.logo);

  // Brüt=Net olduğunda "125 / 125" yerine tek değer göster (gereksiz tekrar olmasın).
  const areaLabel = listing.areaGross
    ? listing.areaNet && listing.areaNet !== listing.areaGross
      ? `${listing.areaGross} / ${listing.areaNet} m²`
      : `${listing.areaGross} m²`
    : null;

  // Künye kartları — türe göre anlamlı alanlar. Boş (—) kartlar aşağıda filtrelenir,
  // böylece işyeri ilanında "Oda Sayısı: —" gibi anlamsız kartlar görünmez.
  const keyMetrics: { label: string; value: string }[] = (isLand
    ? [
        { label: "Alan", value: listing.areaGross ? `${listing.areaGross} m²` : "—" },
        { label: "İmar Durumu", value: listing.zoningStatus || "—" },
        { label: "Ada / Parsel", value: listing.parcelVisibility && (listing.adaNo || listing.parselNo) ? `${listing.adaNo || "-"} / ${listing.parselNo || "-"}` : "—" },
        { label: "Tapu Durumu", value: listing.deedStatus || "—" },
      ]
    : isCommercial
    ? [
        { label: "Alan", value: areaLabel || "—" },
        { label: "Bulunduğu Kat", value: listing.floor != null ? `${listing.floor}${listing.totalFloors ? ` / ${listing.totalFloors}` : ""}` : "—" },
        { label: "İmar Durumu", value: listing.zoningStatus || "—" },
        { label: "Isıtma", value: listing.heating || "—" },
      ]
    : [
        { label: "Oda Sayısı", value: listing.rooms || "—" },
        { label: "Brüt / Net m²", value: listing.areaGross ? `${listing.areaGross}${listing.areaNet ? ` / ${listing.areaNet}` : ""}` : "—" },
        { label: "Bina Yaşı", value: listing.buildingAge != null ? String(listing.buildingAge) : "—" },
        { label: "Bulunduğu Kat", value: listing.floor != null ? `${listing.floor}${listing.totalFloors ? ` / ${listing.totalFloors}` : ""}` : "—" },
      ]
  ).filter((m) => m.value && m.value !== "—");

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
    <div className="mx-auto max-w-7xl px-5 py-8 pb-36 sm:px-6 lg:pb-10">
      <TrackView listingId={listing.id} district={listing.district} />
      {!isSold && <MobileContactBar listingId={listing.id} listingTitle={listing.title} district={listing.district} />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-700">Ana Sayfa</Link>
        <span className="mx-2">/</span>
        <Link href="/ilanlar" className="hover:text-brand-700">İlanlar</Link>
        <span className="mx-2">/</span>
        <Link href={`/ilanlar?ilce=${encodeURIComponent(listing.district)}`} className="hover:text-brand-700">{listing.district}</Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-12">
        {/* SOL: galeri + detay */}
        <div className="space-y-10 lg:col-span-8">
          <Gallery images={listing.images} title={listing.title} />

          <div className="border-y border-stone bg-paper py-7 sm:px-7">
            <div className="flex flex-col justify-between gap-5 border-b border-stone pb-6 md:flex-row md:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {isSold ? (
                    <span className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">Satıldı</span>
                  ) : !isLand ? (
                    <span className="rounded-md bg-brand-700 px-2.5 py-1 text-xs font-semibold text-white">Satılık</span>
                  ) : null}
                  <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {PROPERTY_TYPE_LABELS[listing.propertyType] || listing.propertyType}
                  </span>
                  {listing.verified && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                      <BadgeCheck className="h-3.5 w-3.5" /> Doğrulanmış
                    </span>
                  )}
                  <span className="text-xs text-slate-400">İlan No: {listing.referenceNo || listing.id.slice(-6).toUpperCase()}</span>
                </div>
                <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">{listing.title}</h1>
                <p className="mt-2 inline-flex items-center gap-1.5 text-slate-500">
                  <MapPin className="h-4 w-4 text-slate-400" /> {listing.neighborhood ? `${listing.neighborhood}, ` : ""}{listing.district} / Kütahya
                </p>
              </div>
              <div className="shrink-0">
                <span className="inline-block text-[30px] font-bold leading-tight tabular-nums text-gold-800">
                  {formatPrice(listing.price, listing.currency)}
                </span>
              </div>
            </div>

            {/* Künye — en önemli metrikler */}
            <div className="mt-6 grid grid-cols-2 divide-x divide-stone border-y border-stone md:grid-cols-4">
              {keyMetrics.map((m) => (
                <div key={m.label} className="px-3 py-4 sm:px-4">
                  <p className="mb-1 text-[13px] font-medium uppercase tracking-wide text-slate-500">{m.label}</p>
                  <p className="font-display text-lg font-semibold text-slate-900">{m.value}</p>
                </div>
              ))}
            </div>

            <h2 className="mt-9 border-b border-stone pb-3 font-display text-xl font-semibold text-ink">Tüm detaylar</h2>
            <div className="mt-3 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <div>
                <DetailRow label="Mülk Türü" value={PROPERTY_TYPE_LABELS[listing.propertyType]} />
                <DetailRow label="İlçe" value={listing.district} />
                <DetailRow label="Mahalle" value={listing.neighborhood} />
                {isResidential && <DetailRow label="Oda Sayısı" value={listing.rooms} />}
                {!isLand && <DetailRow label="Brüt / Net m²" value={areaLabel} />}
                {isLand && <DetailRow label="Alan" value={listing.areaGross ? `${listing.areaGross} m²` : null} />}
                {!isLand && <DetailRow label="Bulunduğu Kat" value={listing.floor} />}
                {!isLand && <DetailRow label="Kat Sayısı" value={listing.totalFloors} />}
              </div>
              <div>
                {!isLand && <DetailRow label="Bina Yaşı" value={listing.buildingAge} />}
                {!isLand && <DetailRow label="Isıtma" value={listing.heating} />}
                {!isLand && <DetailRow label="Banyo Sayısı" value={listing.bathroomCount} />}
                {!isLand && <DetailRow label="Aidat" value={listing.dues != null ? `${listing.dues.toLocaleString("tr-TR")} ₺` : null} />}
                <DetailRow label="Krediye Uygunluk" value={CREDIT_LABELS[listing.creditEligible || ""]} />
                <DetailRow label="Kullanım Durumu" value={USAGE_LABELS[listing.usageStatus || ""]} />
                <DetailRow label="Taşınmaz Durumu" value={CONDITION_LABELS[listing.propertyCondition || ""]} />
                <DetailRow label="Tapu Tipi" value={DEED_TYPE_LABELS[listing.deedType || ""] || listing.deedType} />
                <DetailRow label="İskân Durumu" value={OCCUPANCY_LABELS[listing.occupancyPermit || ""] || listing.occupancyPermit} />
                <DetailRow label="Takasa Uygunluk" value={listing.exchangeEligible == null ? null : listing.exchangeEligible ? "Uygun" : "Uygun değil"} />
                {(isLand || isCommercial) && <DetailRow label="İmar Durumu" value={listing.zoningStatus} />}
                {isLand && <DetailRow label="Tapu Durumu" value={listing.deedStatus} />}
                {isLand && listing.parcelVisibility && <DetailRow label="Ada / Parsel" value={listing.adaNo || listing.parselNo ? `${listing.adaNo || "-"} / ${listing.parselNo || "-"}` : null} />}
                {isLand && <DetailRow label="KAKS / Emsal" value={listing.kaks} />}
                {isResidential && <DetailRow label="Eşyalı" value={listing.furnished ? "Evet" : "Hayır"} />}
                {!isLand && <DetailRow label="Otopark" value={listing.parking ? "Var" : "Yok"} />}
                <DetailRow label="İlan Tarihi" value={formatDate(listing.createdAt)} />
                <DetailRow label="Geçerlilik Tarihi" value={listing.validUntil ? formatDate(listing.validUntil) : null} />
              </div>
            </div>

            {features.length > 0 && (
              <div className="mt-7">
                <h2 className="border-b border-stone pb-3 font-display text-xl font-semibold text-ink">Özellikler</h2>
                <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  {features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-[15px] text-slate-700">
                      <Check className="h-[18px] w-[18px] shrink-0 text-brand-600" strokeWidth={2.6} /> {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {amenityGroups.length > 0 && (
              <div className="mt-7">
                <h2 className="border-b border-stone pb-3 font-display text-xl font-semibold text-ink">Seçili özellikler</h2>
                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                  {amenityGroups.map((group) => (
                    <section key={group.key}>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{group.label}</h3>
                      <ul className="mt-3 space-y-2">
                        {group.items.map((item) => (
                          <li key={item.key} className="flex items-center gap-2 text-[15px] text-slate-700">
                            <Check className="h-[18px] w-[18px] shrink-0 text-brand-600" strokeWidth={2.6} />
                            {item.label}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-7">
              <h2 className="border-b border-stone pb-3 font-display text-xl font-semibold text-ink">Açıklama</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-700">{listing.description}</p>
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

          {/* VERİ DESTEKLİ BÖLGE ANALİZİ */}
          <AnalysisSection analysis={analysis} showScores={showScores} />

          {/* HARİTA */}
          {mapPoints.length > 0 && (
            <div className="border-y border-stone bg-paper py-6 sm:px-6">
              <h2 className="font-display text-xl font-bold text-slate-900">Konum</h2>
              <p className="mt-1 text-sm text-slate-500">{listing.district} / Kütahya</p>
              {listing.locationVisibility === "approximate" && (
                <p className="mt-1 text-xs text-slate-400">Mülk sahibinin gizliliği için yaklaşık konum gösterilmektedir.</p>
              )}
              <div className="mt-4 overflow-hidden border border-stone">
                <ListingsMap points={mapPoints} height="360px" showFilter={false} />
              </div>
            </div>
          )}
        </div>

        {/* SAĞ: iletişim (sticky) */}
        <aside className="lg:col-span-4">
          <div className="sticky top-20 space-y-4">
            <div id="ilan-iletisim" className="scroll-mt-24 border border-stone border-t-[3px] border-t-gold-700 bg-paper p-6 shadow-card">
              <span className={`inline-block text-2xl font-bold tabular-nums ${isSold ? "text-slate-500 line-through" : "text-gold-800"}`}>{formatPrice(listing.price, listing.currency)}</span>
              {isSold ? (
                <div className="mt-4 rounded-lg bg-red-50 p-4 ring-1 ring-red-100">
                  <p className="text-sm font-semibold text-red-800">Bu ilan satılmıştır.</p>
                  <p className="mt-1 text-sm text-red-700">Benzer fırsatlar için tüm ilanlarımıza göz atabilirsiniz.</p>
                  <Link href="/ilanlar" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">Benzer ilanları gör <ArrowRight className="h-4 w-4" /></Link>
                </div>
              ) : (
                <>
                  <p className="mt-3 text-sm text-slate-500">İletişime geçin, hemen yanıt verelim.</p>
                  <div className="mt-4">
                    <ContactButtons listingId={listing.id} listingTitle={listing.title} district={listing.district} isLoggedIn={!!session} defaultName={session?.name ?? ""} />
                  </div>
                  <div className="mt-2">
                    <StartConversation listingId={listing.id} isLoggedIn={!!session} hasAgent={!!listing.agent} />
                  </div>
                </>
              )}
              <div className="mt-4 border-t border-slate-100 pt-4">
                <ListingDetailActions listing={snapshot} />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <ShareButtons title={listing.title} />
              </div>
            </div>

            {/* Danışman etiketi */}
            {listing.agent && (
              <div className="border border-stone bg-paper p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">İlan Danışmanı</p>
                <div className="mt-3 flex items-center gap-3">
                  {agentLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={agentLogo}
                      alt={listing.agent.name}
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-800 text-lg font-bold text-gold-300">
                      {listing.agent.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">{listing.agent.name}</p>
                    <p className="truncate text-sm text-slate-500">
                      {listing.agent.title || "Gayrimenkul Danışmanı"}
                      {listing.agent.agency ? ` · ${listing.agent.agency}` : ""}
                    </p>
                  </div>
                </div>
                {listing.agent.publicProfile && listing.agent.status === "approved" && listing.agent._count.listings > 0 && (
                  <Link href={`/danisman/${listing.agent.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                    Danışman profilini incele <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {listing.agencyRef?.published && listing.agencyRef.status === "approved" && listing.agencyRef._count.listings > 0 && (
                  <Link href={`/emlak-ofisi/${listing.agencyRef.slug}`} className="mt-2 block text-sm font-semibold text-brand-700 hover:underline">
                    {listing.agencyRef.name} portföyünü gör
                  </Link>
                )}
                <p className="mt-3 text-[11px] text-slate-400">
                  Bu ilan, onaylı danışmanımız tarafından yayınlanmıştır. İletişim için yukarıdaki butonları kullanın.
                </p>
              </div>
            )}
            <div className="ceramic-grid border border-brand-100 bg-brand-50 p-5 text-center">
              <p className="text-sm font-semibold text-brand-900">Bu mülke benzer fırsatlar mı arıyorsunuz?</p>
              <Link href="/ilanlar" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">Tüm ilanları gör <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </aside>
      </div>

      {/* BENZER İLANLAR */}
      {similar.length > 0 && (
        <section className="mt-14">
          <p className="eyebrow">Portföyden</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-brand-950">Benzer ilanlar</h2>
          <p className="mt-1.5 text-slate-500">Bu mülke yakın diğer seçenekler.</p>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
