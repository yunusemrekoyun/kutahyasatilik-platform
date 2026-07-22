export type ListingFilter = {
  propertyType?: string;
  listingType?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  rooms?: string;
  zoning?: string;
  furnished?: boolean;
  parking?: boolean;
  balcony?: boolean;
  inSite?: boolean;
  verified?: boolean;
  q?: string;
  sort?: string;
  agencySlug?: string;
  agentSlug?: string;
};

export function buildWhere(filter: ListingFilter) {
  const where: Record<string, unknown> = {
    status: { not: "passive" },
    moderationStatus: "approved",
  };
  if (filter.propertyType) where.propertyType = filter.propertyType;
  if (filter.listingType) where.listingType = filter.listingType;
  if (filter.district) where.district = filter.district;
  if (filter.rooms) where.rooms = filter.rooms;
  if (filter.agencySlug) {
    where.status = "active";
    where.agencyRef = {
      is: { slug: filter.agencySlug, status: "approved", published: true },
    };
  }
  if (filter.agentSlug) {
    where.status = "active";
    where.agent = {
      is: { slug: filter.agentSlug, status: "approved", publicProfile: true },
    };
  }

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

  if (filter.zoning) where.zoningStatus = { contains: filter.zoning, mode: "insensitive" };
  if (filter.furnished) where.furnished = true;
  if (filter.parking) where.parking = true;
  if (filter.balcony) where.balcony = true;
  if (filter.inSite) where.inSite = true;
  if (filter.verified) where.verified = true;

  if (filter.q) {
    const q = filter.q.trim();
    const or: Record<string, unknown>[] = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { neighborhood: { contains: q, mode: "insensitive" } },
      {
        AND: [
          { locationVisibility: "exact" },
          { address: { contains: q, mode: "insensitive" } },
        ],
      },
    ];
    if (/^[a-z0-9]{4,12}$/i.test(q)) or.push({ id: { endsWith: q.toLowerCase() } });
    where.OR = or;
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
