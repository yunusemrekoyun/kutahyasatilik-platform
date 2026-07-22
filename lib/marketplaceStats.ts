import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export type MarketplaceStats = {
  activeListings: number;
  soldListings: number;
  activeDistricts: number;
  approvedAgencies: number;
  publicAgents: number;
  categoryCounts: Record<string, number>;
};

/**
 * Public marketplace totals come exclusively from records that are eligible for
 * display. CMS claims and private/pending profiles are deliberately excluded.
 */
export const getMarketplaceStats = unstable_cache(
  async (): Promise<MarketplaceStats> => {
    const publicListingWhere = {
      moderationStatus: "approved",
    } as const;

    const [categories, districts, soldListings, approvedAgencies, publicAgents] = await Promise.all([
      prisma.listing.groupBy({
        by: ["propertyType"],
        where: { ...publicListingWhere, status: "active" },
        _count: { _all: true },
      }),
      prisma.listing.groupBy({
        by: ["district"],
        where: { ...publicListingWhere, status: "active" },
        _count: { _all: true },
      }),
      prisma.listing.count({
        where: { ...publicListingWhere, status: "sold" },
      }),
      prisma.agency.count({
        where: {
          status: "approved",
          published: true,
          listings: { some: { moderationStatus: "approved", status: "active" } },
        },
      }),
      prisma.agent.count({
        where: {
          status: "approved",
          publicProfile: true,
          listings: { some: { moderationStatus: "approved", status: "active" } },
          OR: [
            { agencyId: null },
            { agencyRef: { is: { status: "approved", published: true } } },
          ],
        },
      }),
    ]);

    const categoryCounts = Object.fromEntries(
      categories.map((category) => [category.propertyType, category._count._all]),
    );
    const activeListings = categories.reduce((total, category) => total + category._count._all, 0);

    return {
      activeListings,
      soldListings,
      activeDistricts: districts.filter((district) => district._count._all > 0).length,
      approvedAgencies,
      publicAgents,
      categoryCounts,
    };
  },
  ["public-marketplace-stats-v1"],
  { revalidate: 300, tags: ["marketplace-stats"] },
);
