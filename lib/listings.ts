import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import type { ListingCardData } from "@/components/ListingCard";
import { getDistrictStats } from "./districtStats";
import { computeBadges } from "./badges";

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

export type ListingFilter = {
  propertyType?: string;
  listingType?: string; // sale | rent
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  rooms?: string;
  zoning?: string; // imar durumu (içerir)
  // olanaklar (true ise zorunlu)
  furnished?: boolean;
  parking?: boolean;
  balcony?: boolean;
  inSite?: boolean;
  verified?: boolean;
  q?: string;
  sort?: string;
};

export function buildWhere(filter: ListingFilter) {
  const where: Record<string, unknown> = {
    status: { not: "passive" },
    moderationStatus: "approved", // onaysız emlakçı ilanları gizli
  };
  if (filter.propertyType) where.propertyType = filter.propertyType;
  if (filter.listingType) where.listingType = filter.listingType;
  if (filter.district) where.district = filter.district;
  if (filter.rooms) where.rooms = filter.rooms;

  if (filter.minArea || filter.maxArea) {
    where.areaGross = {
      ...(filter.minArea ? { gte: filter.minArea } : {}),
      ...(filter.maxArea ? { lte: filter.maxArea } : {}),
    };
  }
  if (filter.minPrice || filter.maxPrice) {
    where.price = {
      ...(filter.minPrice ? { gte: filter.minPrice } : {}),
      ...(filter.maxPrice ? { lte: filter.maxPrice } : {}),
    };
  }

  if (filter.zoning) where.zoningStatus = { contains: filter.zoning };

  // Olanak filtreleri (sadece işaretliyse uygulanır)
  if (filter.furnished) where.furnished = true;
  if (filter.parking) where.parking = true;
  if (filter.balcony) where.balcony = true;
  if (filter.inSite) where.inSite = true;
  if (filter.verified) where.verified = true;

  if (filter.q) {
    where.OR = [
      { title: { contains: filter.q } },
      { description: { contains: filter.q } },
      { neighborhood: { contains: filter.q } },
      { address: { contains: filter.q } },
    ];
  }
  return where;
}

export function buildOrderBy(sort?: string) {
  switch (sort) {
    case "price_asc": return [{ price: "asc" as const }];
    case "price_desc": return [{ price: "desc" as const }];
    case "oldest": return [{ createdAt: "asc" as const }];
    default: return [{ featured: "desc" as const }, { createdAt: "desc" as const }];
  }
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

// Filtresiz toplam sayım (en sık durum) cache'lenir; 52k+ satırda her istekteki
// count(*) maliyetini kaldırır. Filtreli sorgularda sayım taze hesaplanır (index'li).
const getCachedTotalCount = unstable_cache(
  async (): Promise<number> =>
    prisma.listing.count({ where: { status: { not: "passive" }, moderationStatus: "approved" } }),
  ["listing-total-approved"],
  { revalidate: 120 }
);

export async function getListingsPaged(
  filter: ListingFilter = {},
  page = 1,
  perPage = 12
): Promise<{ items: ListingCardData[]; total: number; page: number; perPage: number; totalPages: number }> {
  const where = buildWhere(filter);
  // Ekstra filtre yoksa (yalnızca status + moderationStatus) sayım cache'li gelir.
  const isUnfiltered = Object.keys(where).length === 2;
  const [rows, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: buildOrderBy(filter.sort),
      skip: (page - 1) * perPage,
      take: perPage,
      select: cardSelect,
    }),
    isUnfiltered ? getCachedTotalCount() : prisma.listing.count({ where }),
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
    where: { ...buildWhere(filter), lat: { not: null }, lng: { not: null } },
    select: {
      id: true, slug: true, title: true, price: true, currency: true,
      district: true, neighborhood: true, propertyType: true, rooms: true,
      areaGross: true, featured: true, lat: true, lng: true,
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
      featured: r.featured, lat: r.lat as number, lng: r.lng as number,
      coverImage: r.images[0]?.url ?? null,
    }));
}
