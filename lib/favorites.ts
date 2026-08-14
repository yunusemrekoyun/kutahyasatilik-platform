import "server-only";
import { prisma } from "./prisma";
import { cardSelect, decorate, type RawCard } from "./listings";

// Favori sorguları. Client `slug` ile çalışır; burada Listing.id'ye çözülür.
// GET dönüşü ListingCardData ile uyumlu (favoriler sayfası ListingCard render eder).
//
// Kart alanları lib/listings.ts'ten geliyor. Burada kendi select kopyası durduğu
// sürece `category` ve `attributeSummary` eksik geliyordu; ListingCard'ın
// `!category → emlak` fallback'i yüzünden favorideki bir vasıta ilanı emlak gibi
// çiziliyordu (ham "otomobil" etiketi, kayıp "2019 · 120.000 km" özeti, rozet yok).
//
// Not: favori listesi bilerek görünürlük filtresi UYGULAMIYOR — kullanıcının kendi
// kaydettiği ilan, sonradan pasife alınsa bile listesinde kalır. Bu davranış
// değiştirilmedi.

export async function favoriteCards(userId: string) {
  const favs = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { listing: { select: cardSelect } },
  });
  return decorate(favs.map((f) => f.listing) as RawCard[]);
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
