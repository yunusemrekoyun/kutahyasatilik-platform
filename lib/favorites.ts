import "server-only";
import { prisma } from "./prisma";

// Favori sorguları. Client `slug` ile çalışır; burada Listing.id'ye çözülür.
// GET dönüşü ListingCardData ile uyumlu (favoriler sayfası ListingCard render eder).

const CARD_SELECT = {
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
  images: { select: { url: true }, orderBy: { sortOrder: "asc" as const }, take: 1 },
} as const;

export async function favoriteCards(userId: string) {
  const favs = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { listing: { select: CARD_SELECT } },
  });
  return favs.map((f) => {
    const { images, ...rest } = f.listing;
    return { ...rest, coverImage: images[0]?.url ?? null };
  });
}

export async function addFavoriteBySlug(userId: string, slug: string): Promise<void> {
  const listing = await prisma.listing.findUnique({ where: { slug }, select: { id: true } });
  if (!listing) return;
  await prisma.favorite.upsert({
    where: { userId_listingId: { userId, listingId: listing.id } },
    create: { userId, listingId: listing.id },
    update: {},
  });
}

export async function removeFavoriteBySlug(userId: string, slug: string): Promise<void> {
  const listing = await prisma.listing.findUnique({ where: { slug }, select: { id: true } });
  if (!listing) return;
  await prisma.favorite.deleteMany({ where: { userId, listingId: listing.id } });
}

// Giriş anında localStorage favorilerini hesaba taşır (en çok 200 slug).
export async function mergeFavoriteSlugs(userId: string, slugs: string[]): Promise<void> {
  const clean = [...new Set(slugs.filter((s) => typeof s === "string"))].slice(0, 200);
  if (!clean.length) return;
  const listings = await prisma.listing.findMany({ where: { slug: { in: clean } }, select: { id: true } });
  if (!listings.length) return;
  await prisma.favorite.createMany({
    data: listings.map((l) => ({ userId, listingId: l.id })),
    skipDuplicates: true,
  });
}
