import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import type { ListingCardData } from "@/components/ListingCard";
import { getDistrictStats } from "./districtStats";
import { computeBadges } from "./badges";
import { buildOrderBy, buildWhere, type ListingFilter } from "./listingFilters";

export { buildOrderBy, buildWhere } from "./listingFilters";
export type { ListingFilter } from "./listingFilters";

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  price: true,
  currency: true,
  propertyType: true,
  district: true,
  neighborhood: true,
  rooms: true,
  areaGross: true,
  status: true,
  featured: true,
  verified: true,
  createdAt: true,
  images: { select: { url: true }, orderBy: { sortOrder: "asc" as const }, take: 1 },
  agent: { select: { name: true, title: true, logo: true } },
};

type RawCard = {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  propertyType: string;
  district: string;
  neighborhood: string | null;
  rooms: string | null;
  areaGross: number | null;
  status: string;
  featured: boolean;
  verified: boolean;
  createdAt: Date;
  images: { url: string }[];
  agent: { name: string; title: string | null; logo: string | null } | null;
};

// Son 7 günde ilan başına görüntülenme — TÜM ilanlar için tek, cache'li sorgu.
// Eskiden her liste render'ında (id'lere göre) groupBy çalışıyordu; artık 5 dk'da bir.
const getRecentViewsMap = unstable_cache(
  async (): Promise<Record<string, number>> => {
    const since = new Date(Date.now() - 7 * 86_400_000);
    const grouped = await prisma.analyticsEvent.groupBy({
      by: ["listingId"],
      where: { type: "view", createdAt: { gte: since }, listingId: { not: null } },
      _count: { _all: true },
    });
    const map: Record<string, number> = {};
    for (const g of grouped) {
      if (g.listingId) map[g.listingId] = g._count._all;
    }
    return map;
  },
  ["recent-views-7d"],
  { revalidate: 300 }
);

// Ham satırları rozetlerle birlikte kart verisine çevirir.
async function decorate(rows: RawCard[]): Promise<ListingCardData[]> {
  const [stats, views] = await Promise.all([
    getDistrictStats(),
    getRecentViewsMap(),
  ]);
  return rows.map((l) => {
    const stat = stats.get(l.district);
    const badges = computeBadges({
      price: l.price,
      propertyType: l.propertyType,
      areaGross: l.areaGross,
      createdAt: l.createdAt,
      recentViews: views[l.id] ?? 0,
      avgPriceDaire: stat?.avgPriceDaire ?? null,
      avgPriceArsaM2: stat?.avgPriceArsaM2 ?? null,
    });
    return {
      id: l.id,
      slug: l.slug,
      title: l.title,
      price: l.price,
      currency: l.currency,
      propertyType: l.propertyType,
      district: l.district,
      neighborhood: l.neighborhood,
      rooms: l.rooms,
      areaGross: l.areaGross,
      status: l.status,
      featured: l.featured,
      verified: l.verified,
      coverImage: l.images[0]?.url ?? null,
      badges,
      agentName: l.agent?.name ?? null,
      agentLogo: l.agent?.logo ?? null,
    };
  });
}

export async function getListings(filter: ListingFilter = {}, take = 60): Promise<ListingCardData[]> {
  const rows = await prisma.listing.findMany({
    where: buildWhere(filter),
    orderBy: buildOrderBy(filter.sort),
    take,
    select: cardSelect,
  });
  return decorate(rows as RawCard[]);
}

export async function getListingsPaged(
  filter: ListingFilter = {},
  page = 1,
  perPage = 12
): Promise<{ items: ListingCardData[]; total: number; page: number; perPage: number; totalPages: number }> {
  const where = buildWhere(filter);
  const [rows, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: buildOrderBy(filter.sort),
      skip: (page - 1) * perPage,
      take: perPage,
      select: cardSelect,
    }),
    // Mobil sonsuz listede totalPages navigasyonu belirlediği için bu değer anlık olmalı.
    // Listing tablosundaki moderationStatus+status birleşik indeksleri sayımı destekler.
    prisma.listing.count({ where }),
  ]);
  return {
    items: await decorate(rows as RawCard[]),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getFeaturedListings(take = 6): Promise<ListingCardData[]> {
  const rows = await prisma.listing.findMany({
    where: { status: "active", moderationStatus: "approved" },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take,
    select: cardSelect,
  });
  return decorate(rows as RawCard[]);
}

export async function getMapPoints(filter: ListingFilter = {}) {
  const rows = await prisma.listing.findMany({
    where: {
      ...buildWhere(filter),
      locationVisibility: { not: "hidden" },
      lat: { not: null },
      lng: { not: null },
    },
    select: {
      id: true, slug: true, title: true, price: true, currency: true,
      district: true, neighborhood: true, propertyType: true, rooms: true,
      areaGross: true, featured: true, lat: true, lng: true, locationVisibility: true,
      images: { select: { url: true }, orderBy: { sortOrder: "asc" as const }, take: 1 },
    },
    take: 300,
  });
  return rows
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({
      id: r.id, slug: r.slug, title: r.title, price: r.price,
      currency: r.currency, district: r.district, neighborhood: r.neighborhood,
      propertyType: r.propertyType, rooms: r.rooms, areaGross: r.areaGross,
      featured: r.featured,
      lat: r.locationVisibility === "exact" ? r.lat as number : Math.round((r.lat as number) * 100) / 100,
      lng: r.locationVisibility === "exact" ? r.lng as number : Math.round((r.lng as number) * 100) / 100,
      coverImage: r.images[0]?.url ?? null,
    }));
}
