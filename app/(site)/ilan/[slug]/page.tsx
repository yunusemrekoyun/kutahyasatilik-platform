import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, BadgeCheck, Check, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildAnalysis } from "@/lib/analysis";
import { formatPrice, formatDate, parseJsonArray } from "@/lib/format";
import { CATEGORY_LABELS, describeAttributes, getSubTypeLabel, summarizeAttributes } from "@/lib/categories";
import { publicImageUrl } from "@/lib/media";
import { SITE } from "@/lib/site";
import Gallery from "@/components/Gallery";
import ContactButtons from "@/components/ContactButtons";
import SellerPhone from "@/components/SellerPhone";
import { PUBLIC_ACTIVE_LISTING, PUBLIC_VISIBLE_LISTING } from "@/lib/listingFilters";
import { cardSelect, decorate, type RawCard } from "@/lib/listings";
import StartConversation from "@/components/messaging/StartConversation";
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

// Build'de yalnız en güncel ilanları önceden üret; gerisi ilk talepte üretilip
// cache'lenir (dynamicParams varsayılan true). revalidate 300 olduğu için geniş
// bir set'i build'de üretmenin faydası yok — sayfalar zaten 5 dakikada tazeleniyor;
// buna karşılık her ek sayfa deploy süresine ve build'in DB yüküne ekleniyor.
export async function generateStaticParams() {
  const listings = await prisma.listing.findMany({
    where: PUBLIC_VISIBLE_LISTING,
    select: { slug: true },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  return listings.map((l) => ({ slug: l.slug }));
}

async function getListing(slug: string) {
  return prisma.listing.findFirst({
    where: { slug, ...PUBLIC_VISIBLE_LISTING },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      agent: {
        select: {
          name: true, title: true, agency: true, logo: true, slug: true,
          publicProfile: true, status: true,
          _count: { select: { listings: { where: PUBLIC_ACTIVE_LISTING } } },
        },
      },
      agencyRef: {
        select: {
          name: true, slug: true, logo: true, status: true, published: true, verifiedAt: true,
          _count: { select: { listings: { where: PUBLIC_ACTIVE_LISTING } } },
        },
      },
      // Bireysel ilanlarda danışman yok; sahibi kullanıcıdır. Telefon "Telefonu
      // Göster" perdesinin arkasında sunuluyor (bkz. components/SellerPhone.tsx).
      user: { select: { name: true, phone: true } },
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
  // Link önizlemesi TASARLANMIŞ KART: eskiden ham ilan fotoğrafı veriliyordu,
  // WhatsApp'ta fiyat/konum görünmüyor ve kadraj rastgele kırpılıyordu.
  const card = `${SITE.url}/api/share/${listing.slug}`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE.url}/ilan/${listing.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE.url}/ilan/${listing.slug}`,
      images: [{ url: card, width: 1200, height: 630, alt: listing.title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [card] },
  };
}

const DetailRow = ({ label, value }: { label: string; value?: string | number | null }) =>
  value === null || value === undefined || value === "" ? null : (
    <div className="flex justify-between gap-4 border-b border-stone py-2.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-ink text-right">{value}</span>
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

  // Görüntülenme sayacı burada DEĞİL: sayfa ISR ile cache'lendiği için render
  // başına artış gerçek ziyareti yansıtmaz. Sayaç <TrackView /> → /api/track
  // yolunda, olay kaydıyla aynı yerde artırılır.

  // Bu üç sorgu birbirinden bağımsız; ardışık await ile üç ayrı gidiş-dönüş oluyordu.
  // İlk ikisi YALNIZ bölge analizini besliyor, o da yalnız emlakta çiziliyor:
  // her vasıta ilanında iki gereksiz sorgu çalışıyordu.
  const needsAnalysis = listing.category === "emlak";
  const [district, scoresSetting, similarRaw] = await Promise.all([
    needsAnalysis ? prisma.district.findFirst({ where: { name: listing.district } }) : null,
    // Bölge analizi skorlarını göster/gizle (Setting: analysis_scores; "0" ise gizli, varsayılan göster)
    needsAnalysis ? prisma.setting.findUnique({ where: { key: "analysis_scores" } }) : null,
    // Benzer ilanlar — kategori KAPSAM koşulu, tercih değil: kategorisiz
    // sorguda bir otomobilin altına aynı ilçedeki daireler geliyordu.
    prisma.listing.findMany({
      where: {
        ...PUBLIC_ACTIVE_LISTING,
        id: { not: listing.id },
        category: listing.category,
        OR: [{ district: listing.district }, { propertyType: listing.propertyType }],
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 3,
      select: cardSelect,
    }),
  ]);

  const analysis = needsAnalysis ? buildAnalysis(listing, district) : null;
  const features = parseJsonArray(listing.features);
  const amenityGroups = groupListingAmenities(listing.amenities.map((item) => item.key));
  const showScores = scoresSetting?.value !== "0";
  // Elle kopyalanan alan listesi yerine ortak kart sözleşmesi: category ve
  // attributeSummary düşerse kart kendini emlak sanıyor (ham "otomobil" etiketi,
  // km/yıl özeti yok).
  const similar = await decorate(similarRaw as RawCard[]);

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

  // Emlak dışı kategorilerde propertyType "otomobil" gibi bir değer taşır.
  // isResidential'ı kategoriye bağlamazsak vasıta ilanı konut sayılıp
  // "Oda Sayısı" gibi satırları göstermeye çalışır.
  const isRealEstate = listing.category === "emlak";
  const attributeRows = describeAttributes(listing.category, listing.attributes);
  const isLand = isRealEstate && (listing.propertyType === "arsa" || listing.propertyType === "tarla");
  const isCommercial = isRealEstate && listing.propertyType === "isyeri";
  const isResidential = isRealEstate && !isLand && !isCommercial;
  const isSold = listing.status === "sold";
  const categoryLabel = CATEGORY_LABELS[listing.category] ?? "İlanlar";
  // JSON-LD Product dalı için: nitelikler JSONB'de, tipi burada daraltıyoruz.
  const attributeValues = (listing.attributes ?? {}) as Record<string, unknown>;
  const jsonLdBrand = typeof attributeValues.marka === "string" ? attributeValues.marka : null;
  const jsonLdCondition = typeof attributeValues.durum === "string" ? attributeValues.durum : null;
  const agentLogo = publicImageUrl(listing.agent?.logo);

  // Brüt=Net olduğunda "125 / 125" yerine tek değer göster (gereksiz tekrar olmasın).
  const areaLabel = listing.areaGross
    ? listing.areaNet && listing.areaNet !== listing.areaGross
      ? `${listing.areaGross} / ${listing.areaNet} m²`
      : `${listing.areaGross} m²`
    : null;

  // Künye kartları — türe göre anlamlı alanlar. Boş (—) kartlar aşağıda filtrelenir,
  // böylece işyeri ilanında "Oda Sayısı: —" gibi anlamsız kartlar görünmez.
  const keyMetrics: { label: string; value: string }[] = (!isRealEstate
    ? attributeRows.slice(0, 4).map((row) => ({ label: row.label, value: row.value }))
    : isLand
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

  // Favori / karşılaştır / son gezilenler bu kopyayı localStorage'a yazar; sayfa
  // bir daha okunmaz. category ve attributeSummary buradan düşerse ilan o üç
  // yüzeyde emlak kartına dönüşür (ham alt tür etiketi, boş m²/oda satırları).
  const snapshot = {
    slug: listing.slug, title: listing.title, price: listing.price, currency: listing.currency,
    category: listing.category, propertyType: listing.propertyType,
    attributeSummary: isRealEstate ? undefined : summarizeAttributes(listing.category, listing.attributes),
    district: listing.district, neighborhood: listing.neighborhood,
    rooms: isRealEstate ? listing.rooms : null,
    areaGross: isRealEstate ? listing.areaGross : null,
    areaNet: isRealEstate ? listing.areaNet : null,
    floor: isRealEstate ? listing.floor : null,
    buildingAge: isRealEstate ? listing.buildingAge : null,
    heating: isRealEstate ? listing.heating : null,
    status: listing.status, featured: listing.featured, coverImage: listing.images[0]?.url ?? null,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    // Vasıta/teknoloji ilanı RealEstateListing olarak işaretlenirse arama
    // motorlarına yanlış bilgi veririz; onlar genel ürün olarak yayımlanır.
    "@type": isRealEstate ? "RealEstateListing" : "Product",
    name: listing.title,
    description: listing.description,
    url: `${SITE.url}/ilan/${listing.slug}`,
    image: listing.images.map((i) => i.url),
    // datePosted ve address RealEstateListing alanları; Product şemasında
    // geçersiz. Ürün dalında yerlerini brand/itemCondition alıyor.
    ...(isRealEstate
      ? { datePosted: listing.createdAt.toISOString() }
      : {
          ...(jsonLdBrand ? { brand: { "@type": "Brand", name: jsonLdBrand } } : {}),
          itemCondition:
            jsonLdCondition === "sifir"
              ? "https://schema.org/NewCondition"
              : "https://schema.org/UsedCondition",
        }),
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
      {!isSold && (
        <MobileContactBar
          listingId={listing.id}
          listingTitle={listing.title}
          district={listing.district}
          category={listing.category}
          hasOwnSeller={!!listing.agent || !!listing.user}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Sayfa yolu" className="mb-4 text-sm text-muted">
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
                    <span className="rounded-control bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">Satıldı</span>
                  ) : !isLand ? (
                    <span className="rounded-control bg-brand-700 px-2.5 py-1 text-xs font-semibold text-white">Satılık</span>
                  ) : null}
                  <span className="inline-block rounded-control bg-canvas px-2.5 py-1 text-xs font-semibold text-muted">
                    {getSubTypeLabel(listing.category, listing.propertyType)}
                  </span>
                  {listing.verified && (
                    <span className="inline-flex items-center gap-1 rounded-control bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                      <BadgeCheck className="h-3.5 w-3.5" /> Doğrulanmış
                    </span>
                  )}
                  <span className="text-xs text-muted/70">İlan No: {listing.referenceNo || listing.id.slice(-6).toUpperCase()}</span>
                </div>
                <h1 className="mt-3 max-w-3xl text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">{listing.title}</h1>
                <p className="mt-2 inline-flex items-center gap-1.5 text-muted">
                  <MapPin className="h-4 w-4 text-muted/70" /> {listing.neighborhood ? `${listing.neighborhood}, ` : ""}{listing.district} / Kütahya
                </p>
              </div>
              <div className="shrink-0">
                <span className="inline-block text-[28px] font-bold leading-tight tabular-nums text-brand-800">
                  {formatPrice(listing.price, listing.currency)}
                </span>
              </div>
            </div>

            {/* Künye — en önemli metrikler. Hepsi boşsa (nitelik girilmemiş bir
                emlak dışı ilan) çizgili boş bir şerit kalıyordu. */}
            {keyMetrics.length > 0 && (
              <div className="mt-6 grid grid-cols-2 divide-x divide-stone border-y border-stone md:grid-cols-4">
                {keyMetrics.map((m) => (
                  <div key={m.label} className="px-3 py-4 sm:px-4">
                    <p className="mb-1 text-[13px] font-medium uppercase tracking-wide text-muted">{m.label}</p>
                    <p className="text-base font-semibold text-ink">{m.value}</p>
                  </div>
                ))}
              </div>
            )}

            <h2 className="mt-9 border-b border-stone pb-3 text-lg font-bold text-ink">Tüm detaylar</h2>
            <div className="mt-3 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {isRealEstate ? (
              <>
              <div>
                <DetailRow label="Mülk Türü" value={getSubTypeLabel(listing.category, listing.propertyType)} />
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
              </>
              ) : (
              <>
              {/* Emlak dışı kategoriler: satırlar kayıttan üretilir */}
              <div>
                <DetailRow label="Tür" value={getSubTypeLabel(listing.category, listing.propertyType)} />
                <DetailRow label="İlçe" value={listing.district} />
                <DetailRow label="Mahalle" value={listing.neighborhood} />
                {attributeRows.slice(0, Math.ceil(attributeRows.length / 2)).map((row) => (
                  <DetailRow key={row.key} label={row.label} value={row.value} />
                ))}
              </div>
              <div>
                {attributeRows.slice(Math.ceil(attributeRows.length / 2)).map((row) => (
                  <DetailRow key={row.key} label={row.label} value={row.value} />
                ))}
                <DetailRow label="İlan Tarihi" value={formatDate(listing.createdAt)} />
              </div>
              </>
              )}
            </div>

            {features.length > 0 && (
              <div className="mt-7">
                <h2 className="border-b border-stone pb-3 text-lg font-bold text-ink">Özellikler</h2>
                <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  {features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-[15px] text-ink">
                      <Check className="h-[18px] w-[18px] shrink-0 text-brand-600" strokeWidth={2.6} /> {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isRealEstate && amenityGroups.length > 0 && (
              <div className="mt-7">
                <h2 className="border-b border-stone pb-3 text-lg font-bold text-ink">Seçili özellikler</h2>
                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                  {amenityGroups.map((group) => (
                    <section key={group.key}>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{group.label}</h3>
                      <ul className="mt-3 space-y-2">
                        {group.items.map((item) => (
                          <li key={item.key} className="flex items-center gap-2 text-[15px] text-ink">
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
              <h2 className="border-b border-stone pb-3 text-lg font-bold text-ink">Açıklama</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink">{listing.description}</p>
            </div>
          </div>

          {/* FİYAT GEÇMİŞİ */}
          <PriceHistoryCard history={listing.priceHistory} currency={listing.currency} />

          {/* VIDEO & SANAL TUR */}
          <ListingMedia
            videoUrl={listing.videoUrl}
            droneUrl={listing.droneUrl}
            virtualTourUrl={listing.virtualTourUrl}
            category={listing.category}
          />

          {/* VERİ DESTEKLİ BÖLGE ANALİZİ — m² fiyatı, imar ve yatırım skoru
              üzerine kurulu olduğu için yalnız emlak ilanlarında anlamlı */}
          {isRealEstate && analysis && <AnalysisSection analysis={analysis} showScores={showScores} />}

          {/* HARİTA */}
          {mapPoints.length > 0 && (
            <div className="border-y border-stone bg-paper py-6 sm:px-6">
              <h2 className="text-lg font-bold text-ink">Konum</h2>
              <p className="mt-1 text-sm text-muted">{listing.district} / Kütahya</p>
              {listing.locationVisibility === "approximate" && (
                <p className="mt-1 text-xs text-muted/70">İlan sahibinin gizliliği için yaklaşık konum gösterilmektedir.</p>
              )}
              <div className="mt-4 overflow-hidden border border-stone">
                <ListingsMap points={mapPoints} height="360px" showFilter={false} />
              </div>
            </div>
          )}
        </div>

        {/* SAĞ: iletişim (sticky) */}
        <aside aria-label="İlan iletişim ve satıcı bilgileri" className="lg:col-span-4">
          <div className="sticky top-20 space-y-4">
            <div id="ilan-iletisim" tabIndex={-1} className="scroll-mt-24 border border-stone border-t-[3px] border-t-gold-700 bg-paper p-6 shadow-card outline-none">
              <span className={`inline-block text-2xl font-bold tabular-nums ${isSold ? "text-muted line-through" : "text-brand-800"}`}>{formatPrice(listing.price, listing.currency)}</span>
              {isSold ? (
                <div className="mt-4 rounded-control bg-red-50 p-4 ring-1 ring-red-100">
                  <p className="text-sm font-semibold text-red-800">Bu ilan satılmıştır.</p>
                  <p className="mt-1 text-sm text-red-700">Benzer fırsatlar için tüm ilanlarımıza göz atabilirsiniz.</p>
                  <Link href="/ilanlar" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">Benzer ilanları gör <ArrowRight className="h-4 w-4" /></Link>
                </div>
              ) : (
                <>
                  <p className="mt-3 text-sm text-muted">İletişime geçin, hemen yanıt verelim.</p>
                  {listing.agent ? (
                    <>
                      <div className="mt-4">
                        <ContactButtons listingId={listing.id} listingTitle={listing.title} district={listing.district} category={listing.category} />
                      </div>
                      <div className="mt-2">
                        <StartConversation listingId={listing.id} canMessage sellerLabel="Danışmana" />
                      </div>
                    </>
                  ) : listing.user ? (
                    /* Bireysel ilan: sitenin genel numarası yerine SATICININ kendisi.
                       Telefon perde arkasında, mesajlaşma Conversation.ownerUserId
                       üzerinden (Faz 7 şema değişikliği). */
                    <>
                      {listing.user.phone ? (
                        <div className="mt-4">
                          <SellerPhone phone={listing.user.phone} listingId={listing.id} district={listing.district} />
                        </div>
                      ) : null}
                      <div className={listing.user.phone ? "mt-2" : "mt-4"}>
                        <StartConversation listingId={listing.id} canMessage />
                      </div>
                    </>
                  ) : (
                    /* Ne danışman ne bireysel sahip: talep formu tek kanal. */
                    <div className="mt-4">
                      <ContactButtons listingId={listing.id} listingTitle={listing.title} district={listing.district} category={listing.category} />
                    </div>
                  )}
                </>
              )}
              <div className="mt-4 border-t border-stone pt-4">
                <ListingDetailActions listing={snapshot} />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-stone pt-4">
                <ShareButtons title={listing.title} />
              </div>
            </div>

            {/* Satıcı etiketi — kurumsal ilan. Danışman emlak dışı bir ilan da
                yayınlayabiliyor (emlakçı paneli kategori seçtiriyor), o yüzden
                başlık ve unvan kategoriye bağlı. */}
            {listing.agent && (
              <div className="border border-stone bg-paper p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted/70">
                  {isRealEstate ? "İlan Danışmanı" : "Satıcı"}
                </p>
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
                    <p className="truncate font-bold text-ink">{listing.agent.name}</p>
                    <p className="truncate text-sm text-muted">
                      {listing.agent.title || (isRealEstate ? "Gayrimenkul Danışmanı" : "Kurumsal satıcı")}
                      {listing.agent.agency ? ` · ${listing.agent.agency}` : ""}
                    </p>
                  </div>
                </div>
                {listing.agent.publicProfile && listing.agent.status === "approved" && listing.agent._count.listings > 0 && (
                  <Link href={`/danisman/${listing.agent.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                    {isRealEstate ? "Danışman profilini incele" : "Satıcının diğer ilanları"} <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {listing.agencyRef?.published && listing.agencyRef.status === "approved" && listing.agencyRef._count.listings > 0 && (
                  <Link href={`/emlak-ofisi/${listing.agencyRef.slug}`} className="mt-2 block text-sm font-semibold text-brand-700 hover:underline">
                    {listing.agencyRef.name} ilanlarını gör
                  </Link>
                )}
                <p className="mt-3 text-[11px] text-muted/70">
                  {isRealEstate
                    ? "Bu ilan, onaylı danışmanımız tarafından yayınlanmıştır. İletişim için yukarıdaki butonları kullanın."
                    : "Bu ilan, onaylı kurumsal satıcı tarafından yayınlanmıştır. İletişim için yukarıdaki butonları kullanın."}
                </p>
              </div>
            )}
            {!listing.agent && listing.user && (
              <div className="rounded-card border border-stone bg-paper p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">İlan Sahibi</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-800 text-lg font-bold text-gold-300">
                    {listing.user.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">{listing.user.name}</p>
                    <p className="truncate text-sm text-muted">Bireysel satıcı</p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-muted">
                  Bu ilan bireysel bir satıcı tarafından yayınlanmıştır. Alışverişte dikkatli olun;
                  ödeme yapmadan önce ürünü ve satıcıyı doğrulayın.
                </p>
              </div>
            )}
            <div className="rounded-card border border-stone bg-canvas p-5 text-center">
              <p className="text-sm font-semibold text-brand-900">Bu ilana benzer fırsatlar mı arıyorsunuz?</p>
              <Link
                href={`/ilanlar?kategori=${listing.category}`}
                className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline"
              >
                {categoryLabel} ilanlarını gör <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* BENZER İLANLAR */}
      {similar.length > 0 && (
        <section className="mt-14">
          <p className="eyebrow">{categoryLabel}</p>
          <h2 className="mt-2 text-xl font-bold text-ink">Benzer ilanlar</h2>
          <p className="mt-1.5 text-muted">
            {isRealEstate ? "Bu mülke yakın diğer seçenekler." : "Bu ilana yakın diğer seçenekler."}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((l) => (
              <ListingCard key={l.slug} listing={l} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed excludeSlug={listing.slug} />

      <section className="mt-14">
        <NotFoundCTA category={listing.category} />
      </section>
    </div>
  );
}
