import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PUBLIC_ACTIVE_LISTING } from "@/lib/listingFilters";

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
      // `propertyType` ile gruplanıyordu: daire, otomobil ve telefon aynı düzlemde
      // sayılıyor, "Kategoriler" başlığı altında alt türler listeleniyordu. Artık
      // gerçek kategori kırılımı — ana sayfa kategori girişleri bunu tüketecek.
      prisma.listing.groupBy({
        by: ["category"],
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
