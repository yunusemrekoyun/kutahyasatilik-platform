import { cache } from "react";
import { prisma } from "@/lib/prisma";

const PUBLIC_LISTING_WHERE = {
  status: "active",
  moderationStatus: "approved",
} as const;

const PUBLIC_AGENT_WHERE = {
  status: "approved",
  publicProfile: true,
  listings: { some: PUBLIC_LISTING_WHERE },
} as const;

const PUBLIC_AGENCY_WHERE = {
  status: "approved",
  published: true,
  listings: { some: PUBLIC_LISTING_WHERE },
} as const;

const listingCardSelect = {
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
  images: {
    select: { url: true },
    orderBy: { sortOrder: "asc" as const },
    take: 1,
  },
  agent: { select: { name: true, logo: true } },
} as const;

export type PublicListingCard = {
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
  coverImage: string | null;
  agentName: string | null;
  agentLogo: string | null;
};

export type PublicAgencyCard = {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  address: string | null;
  serviceDistricts: string[];
  verified: boolean;
  listingCount: number;
  agentCount: number;
};

export type PublicAgentCard = {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  logo: string | null;
  bio: string | null;
  experienceYears: number | null;
  specialties: string[];
  serviceDistricts: string[];
  listingCount: number;
  agency: { name: string; slug: string } | null;
};

export type PublicAgencyProfile = PublicAgencyCard & {
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  agents: PublicAgentCard[];
  listings: PublicListingCard[];
};

export type PublicAgentProfile = PublicAgentCard & {
  phone: string | null;
  whatsapp: string | null;
  listings: PublicListingCard[];
};

export type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

function parseStringList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);
  } catch {
    return [];
  }
}

function safeHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function toListingCard(row: {
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
  images: { url: string }[];
  agent: { name: string; logo: string | null } | null;
}): PublicListingCard {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: row.price,
    currency: row.currency,
    propertyType: row.propertyType,
    district: row.district,
    neighborhood: row.neighborhood,
    rooms: row.rooms,
    areaGross: row.areaGross,
    status: row.status,
    featured: row.featured,
    verified: row.verified,
    coverImage: row.images[0]?.url ?? null,
    agentName: row.agent?.name ?? null,
    agentLogo: row.agent?.logo ?? null,
  };
}

function toAgencyCard(row: {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  address: string | null;
  serviceDistricts: string | null;
  verifiedAt: Date | null;
  _count: { listings: number; agents: number };
}): PublicAgencyCard {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    logo: row.logo,
    coverImage: row.coverImage,
    description: row.description,
    address: row.address,
    serviceDistricts: parseStringList(row.serviceDistricts),
    verified: Boolean(row.verifiedAt),
    listingCount: row._count.listings,
    agentCount: row._count.agents,
  };
}

function toAgentCard(row: {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  logo: string | null;
  bio: string | null;
  experienceYears: number | null;
  specialties: string | null;
  serviceDistricts: string | null;
  _count: { listings: number };
  agencyRef: {
    name: string;
    slug: string;
    status: string;
    published: boolean;
  } | null;
}): PublicAgentCard {
  const publicAgency =
    row.agencyRef?.status === "approved" && row.agencyRef.published
      ? { name: row.agencyRef.name, slug: row.agencyRef.slug }
      : null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    title: row.title,
    logo: row.logo,
    bio: row.bio,
    experienceYears: row.experienceYears,
    specialties: parseStringList(row.specialties),
    serviceDistricts: parseStringList(row.serviceDistricts),
    listingCount: row._count.listings,
    agency: publicAgency,
  };
}

const agencyCardSelect = {
  id: true,
  slug: true,
  name: true,
  logo: true,
  coverImage: true,
  description: true,
  address: true,
  serviceDistricts: true,
  verifiedAt: true,
  _count: {
    select: {
      listings: { where: PUBLIC_LISTING_WHERE },
      agents: { where: PUBLIC_AGENT_WHERE },
    },
  },
} as const;

const agentCardSelect = {
  id: true,
  slug: true,
  name: true,
  title: true,
  logo: true,
  bio: true,
  experienceYears: true,
  specialties: true,
  serviceDistricts: true,
  agencyRef: {
    select: { name: true, slug: true, status: true, published: true },
  },
  _count: { select: { listings: { where: PUBLIC_LISTING_WHERE } } },
} as const;

export async function getPublicAgencies(
  requestedPage = 1,
  perPage = 12,
  query?: string
): Promise<PagedResult<PublicAgencyCard>> {
  const search = query?.trim().slice(0, 80);
  const where = search
    ? {
        AND: [
          PUBLIC_AGENCY_WHERE,
          {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { address: { contains: search, mode: "insensitive" as const } },
              { serviceDistricts: { contains: search, mode: "insensitive" as const } },
            ],
          },
        ],
      }
    : PUBLIC_AGENCY_WHERE;
  const total = await prisma.agency.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const rows = await prisma.agency.findMany({
    where,
    orderBy: [{ verifiedAt: "desc" }, { name: "asc" }],
    skip: (page - 1) * perPage,
    take: perPage,
    select: agencyCardSelect,
  });

  return { items: rows.map(toAgencyCard), total, page, perPage, totalPages };
}

export async function getPublicAgents(
  requestedPage = 1,
  perPage = 12,
  query?: string
): Promise<PagedResult<PublicAgentCard>> {
  const search = query?.trim().slice(0, 80);
  const where = search
    ? {
        AND: [
          PUBLIC_AGENT_WHERE,
          {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { title: { contains: search, mode: "insensitive" as const } },
              { specialties: { contains: search, mode: "insensitive" as const } },
              { serviceDistricts: { contains: search, mode: "insensitive" as const } },
              { agencyRef: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          },
        ],
      }
    : PUBLIC_AGENT_WHERE;
  const total = await prisma.agent.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const rows = await prisma.agent.findMany({
    where,
    orderBy: [{ approvedAt: "desc" }, { name: "asc" }],
    skip: (page - 1) * perPage,
    take: perPage,
    select: agentCardSelect,
  });

  return { items: rows.map(toAgentCard), total, page, perPage, totalPages };
}

export const getPublicAgency = cache(async (slug: string): Promise<PublicAgencyProfile | null> => {
  const agency = await prisma.agency.findFirst({
    where: { ...PUBLIC_AGENCY_WHERE, slug },
    select: {
      ...agencyCardSelect,
      phone: true,
      whatsapp: true,
      website: true,
      showPhone: true,
      showWhatsapp: true,
      agents: {
        where: PUBLIC_AGENT_WHERE,
        orderBy: [{ approvedAt: "desc" }, { name: "asc" }],
        take: 12,
        select: agentCardSelect,
      },
      listings: {
        where: PUBLIC_LISTING_WHERE,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: 12,
        select: listingCardSelect,
      },
    },
  });
  if (!agency) return null;

  return {
    ...toAgencyCard(agency),
    phone: agency.showPhone ? agency.phone : null,
    whatsapp: agency.showWhatsapp ? agency.whatsapp : null,
    website: safeHttpsUrl(agency.website),
    agents: agency.agents.map(toAgentCard),
    listings: agency.listings.map(toListingCard),
  };
});

export const getPublicAgent = cache(async (slug: string): Promise<PublicAgentProfile | null> => {
  const agent = await prisma.agent.findFirst({
    where: { ...PUBLIC_AGENT_WHERE, slug },
    select: {
      ...agentCardSelect,
      phone: true,
      showPhone: true,
      showWhatsapp: true,
      listings: {
        where: PUBLIC_LISTING_WHERE,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: 12,
        select: listingCardSelect,
      },
    },
  });
  if (!agent) return null;

  const card = toAgentCard(agent);
  return {
    ...card,
    phone: agent.showPhone ? agent.phone : null,
    whatsapp: agent.showWhatsapp ? agent.phone : null,
    listings: agent.listings.map(toListingCard),
  };
});

export async function getPublicDirectorySlugs() {
  const [agencies, agents] = await Promise.all([
    prisma.agency.findMany({
      where: PUBLIC_AGENCY_WHERE,
      select: { slug: true, updatedAt: true },
    }),
    prisma.agent.findMany({
      where: PUBLIC_AGENT_WHERE,
      select: { slug: true, approvedAt: true, createdAt: true },
    }),
  ]);

  return {
    agencies,
    agents: agents.map((agent) => ({
      slug: agent.slug,
      updatedAt: agent.approvedAt ?? agent.createdAt,
    })),
  };
}

export const getPublicListingOwner = cache(
  async (kind: "agency" | "agent", slug: string): Promise<{ name: string; slug: string } | null> => {
    if (kind === "agency") {
      return prisma.agency.findFirst({
        where: { ...PUBLIC_AGENCY_WHERE, slug },
        select: { name: true, slug: true },
      });
    }

    return prisma.agent.findFirst({
      where: { ...PUBLIC_AGENT_WHERE, slug },
      select: { name: true, slug: true },
    });
  }
);
