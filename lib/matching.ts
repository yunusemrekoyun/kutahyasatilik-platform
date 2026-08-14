import { prisma } from "./prisma";
import { PUBLIC_ACTIVE_LISTING } from "./listingFilters";

// Alıcı talebi (kayıtlı arama) ↔ ilan eşleştirme motoru.
//
// KAPSAM: BuyerAlert tamamen EMLAĞA özgüdür — alanları (propertyType, rooms,
// minArea, zoning) yalnız gayrimenkulde anlamlı ve kayıt yalnız "alıcı talebi"
// formundan (/api/buyer-alert, /api/v1/buyer-alert) yaratılıyor. Vasıta/teknoloji
// için kayıtlı arama arayüzü yok.
//
// Bu kapsam eskiden hiçbir yerde uygulanmıyordu: propertyType'ı boş bırakılmış bir
// talep, yeni eklenen bir TRAKTÖR ya da iPHONE ilanıyla eşleşip kullanıcıya
// "new_match" bildirimi gönderiyordu. Aşağıdaki iki yönlü emlak kapsamlaması bunu
// kapatıyor.
//
// Yeni kategorilere kayıtlı arama gerekirse BuyerAlert'e `category` kolonu eklenmeli;
// şu an kolon YOK, o yüzden kapsamlama kod tarafında.

const ALERT_CATEGORY = "emlak";

export type AlertCriteria = {
  propertyType?: string | null;
  listingType?: string | null;
  district?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minArea?: number | null;
  rooms?: string | null;
};

export type ListingForMatch = {
  propertyType: string;
  listingType?: string | null;
  district: string;
  price: number;
  areaGross?: number | null;
  rooms?: string | null;
  /**
   * Verilmezse `emlak` sayılır — `Listing.category` kolonunun DB varsayılanı da
   * budur, yani kategoriyi henüz taşımayan yazma yolları (admin `saveListing`)
   * doğru davranışı alır. Faz 6'da o yollar kategoriyi taşımaya başlayınca
   * değer buraya kendiliğinden akar.
   */
  category?: string | null;
};

// Bir alıcı talebine uyan AKTİF & ONAYLI EMLAK ilanlarını sorgular.
export function alertToListingWhere(alert: AlertCriteria): Record<string, unknown> {
  const where: Record<string, unknown> = {
    ...PUBLIC_ACTIVE_LISTING,
    category: ALERT_CATEGORY,
  };
  if (alert.propertyType) where.propertyType = alert.propertyType;
  if (alert.listingType) where.listingType = alert.listingType;
  if (alert.district) where.district = alert.district;
  if (alert.rooms) where.rooms = alert.rooms;
  if (alert.minPrice || alert.maxPrice) {
    where.price = {
      ...(alert.minPrice ? { gte: alert.minPrice } : {}),
      ...(alert.maxPrice ? { lte: alert.maxPrice } : {}),
    };
  }
  if (alert.minArea) where.areaGross = { gte: alert.minArea };
  return where;
}

export async function findListingsForAlert(alert: AlertCriteria, take = 12) {
  return prisma.listing.findMany({
    where: alertToListingWhere(alert),
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true, slug: true, title: true, price: true, currency: true,
      propertyType: true, district: true, neighborhood: true, rooms: true,
      areaGross: true, status: true, featured: true, verified: true,
      images: { select: { url: true }, orderBy: { sortOrder: "asc" as const }, take: 1 },
      agent: { select: { name: true } },
    },
  });
}

export async function countListingsForAlert(alert: AlertCriteria): Promise<number> {
  return prisma.listing.count({ where: alertToListingWhere(alert) });
}

// Bir ilana uyan AKTİF alıcı taleplerini sorgular (admin eşleştirme paneli için).
export function listingToAlertWhere(listing: ListingForMatch): Record<string, unknown> {
  return {
    status: "active",
    AND: [
      { OR: [{ propertyType: null }, { propertyType: listing.propertyType }] },
      { OR: [{ listingType: null }, { listingType: listing.listingType ?? "sale" }] },
      { OR: [{ district: null }, { district: listing.district }] },
      { OR: [{ maxPrice: null }, { maxPrice: { gte: listing.price } }] },
      { OR: [{ minPrice: null }, { minPrice: { lte: listing.price } }] },
      { OR: [{ rooms: null }, { rooms: listing.rooms ?? undefined }] },
      { OR: [{ minArea: null }, { minArea: { lte: listing.areaGross ?? 0 } }] },
    ],
  };
}

// Emlak dışı ilanların eşleşecek talebi yoktur (bkz. dosya başındaki KAPSAM notu).
function isAlertEligible(listing: ListingForMatch): boolean {
  return (listing.category ?? ALERT_CATEGORY) === ALERT_CATEGORY;
}

export async function findAlertsForListing(listing: ListingForMatch, take = 100) {
  if (!isAlertEligible(listing)) return [];
  return prisma.buyerAlert.findMany({
    where: listingToAlertWhere(listing),
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function countAlertsForListing(listing: ListingForMatch): Promise<number> {
  if (!isAlertEligible(listing)) return 0;
  return prisma.buyerAlert.count({ where: listingToAlertWhere(listing) });
}
