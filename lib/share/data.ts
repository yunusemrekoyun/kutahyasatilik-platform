/**
 * İlan kaydından paylaşım kartı verisi üretir.
 *
 * Kart hem web hem mobil tarafından kullanıldığı için "kartta ne yazacak"
 * kararı burada, tek yerde veriliyor — iki istemcinin ayrı ayrı özet
 * hesaplaması, kategori kapsamında yaşadığımız sapmaların aynısını üretirdi.
 */
import { CATEGORY_LABELS, getSubTypeLabel, summarizeAttributes } from "../categories";
import type { ShareCardData } from "./card";

export type ShareListingRow = {
  id: string;
  title: string;
  price: number;
  currency: string;
  category: string;
  propertyType: string;
  district: string;
  neighborhood: string | null;
  rooms: string | null;
  areaGross: number | null;
  status: string;
  referenceNo: string | null;
  attributes: unknown;
  images: { url: string }[];
};

/**
 * Kartta gösterilecek 2-3 kısa özellik.
 *
 * Emlakta oda ve m² gerçek kolonlarda, diğer kategorilerde JSONB niteliklerde.
 * Bu ayrım sitenin her yerinde geçerli; kart da aynı kuralı izliyor.
 */
function factsFor(listing: ShareListingRow): string[] {
  if (listing.category === "emlak") {
    return [
      listing.rooms ?? "",
      listing.areaGross ? `${listing.areaGross} m²` : "",
    ].filter(Boolean);
  }
  return summarizeAttributes(listing.category, listing.attributes).slice(0, 3);
}

export function toShareCardData(listing: ShareListingRow, imageUrl: string | null): ShareCardData {
  return {
    title: listing.title,
    price: listing.price,
    currency: listing.currency,
    district: listing.district,
    neighborhood: listing.neighborhood,
    categoryLabel: CATEGORY_LABELS[listing.category] ?? "İlan",
    subTypeLabel: getSubTypeLabel(listing.category, listing.propertyType),
    facts: factsFor(listing),
    imageUrl,
    sold: listing.status === "sold",
    // referenceNo boşsa id'nin sonu: kartta her zaman bir geri dönüş anahtarı olsun.
    referenceNo: listing.referenceNo || listing.id.slice(-6).toUpperCase(),
  };
}

export const SHARE_LISTING_SELECT = {
  id: true,
  title: true,
  price: true,
  currency: true,
  category: true,
  propertyType: true,
  district: true,
  neighborhood: true,
  rooms: true,
  areaGross: true,
  status: true,
  referenceNo: true,
  attributes: true,
  images: { select: { url: true }, orderBy: { sortOrder: "asc" as const }, take: 1 },
} as const;
