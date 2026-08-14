import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PUBLIC_ACTIVE_LISTING } from "@/lib/listingFilters";

export type MarketplaceStats = {
  activeListings: number;
  soldListings: number;
  activeDistricts: number;
  approvedAgencies: number;
  publicAgents: number;
  /** Kategori bazında (emlak / vasita / teknoloji) aktif ilan sayısı. */
  categoryCounts: Record<string, number>;
  /** Alt tür bazında (daire / arsa / otomobil ...) aktif ilan sayısı. */
  subTypeCounts: Record<string, number>;
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

    const [categories, subTypes, districts, soldListings, approvedAgencies, publicAgents] = await Promise.all([
      // İKİ KIRILIM birden gerekiyor:
      // - categoryCounts: ana sayfadaki kategori girişleri (Vasıta, Teknoloji)
      // - subTypeCounts : emlak landing kutuları (Daire, Arsa, Villa...) — bunlar
      //   propertyType ile anahtarlanır. Yalnız kategoriye çevirmek o kutuların
      //   hepsini 0 gösteriyordu.
      prisma.listing.groupBy({
        by: ["category"],
        where: { ...publicListingWhere, status: "active" },
        _count: { _all: true },
      }),
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
          listings: { some: PUBLIC_ACTIVE_LISTING },
        },
      }),
      prisma.agent.count({
        where: {
          status: "approved",
          publicProfile: true,
          listings: { some: PUBLIC_ACTIVE_LISTING },
          OR: [
            { agencyId: null },
            { agencyRef: { is: { status: "approved", published: true } } },
          ],
        },
      }),
    ]);

    const categoryCounts = Object.fromEntries(
      categories.map((category) => [category.category, category._count._all]),
    );
    const subTypeCounts = Object.fromEntries(
      subTypes.map((row) => [row.propertyType, row._count._all]),
    );
    const activeListings = categories.reduce((total, category) => total + category._count._all, 0);

    return {
      activeListings,
      soldListings,
      activeDistricts: districts.filter((district) => district._count._all > 0).length,
      approvedAgencies,
      publicAgents,
      categoryCounts,
      subTypeCounts,
    };
  },
  ["public-marketplace-stats-v2"],
  { revalidate: 300, tags: ["marketplace-stats"] },
);
