import { prisma } from "./prisma";

// Alıcı talebi (kayıtlı arama) ↔ ilan eşleştirme motoru.

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
};

// Bir alıcı talebine uyan AKTİF & ONAYLI ilanları sorgular.
export function alertToListingWhere(alert: AlertCriteria): Record<string, unknown> {
  const where: Record<string, unknown> = {
    status: "active",
    moderationStatus: "approved",
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

export async function findAlertsForListing(listing: ListingForMatch, take = 100) {
  return prisma.buyerAlert.findMany({
    where: listingToAlertWhere(listing),
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function countAlertsForListing(listing: ListingForMatch): Promise<number> {
  return prisma.buyerAlert.count({ where: listingToAlertWhere(listing) });
}
