import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { PUBLIC_VISIBLE_LISTING } from "@/lib/listingFilters";
import { publicImageUrl } from "@/lib/media";
import { cardFonts } from "@/lib/share/fonts";
import { CARD_SIZES, ShareCard, type CardVariant } from "@/lib/share/card";
import { SHARE_LISTING_SELECT, toShareCardData, type ShareListingRow } from "@/lib/share/data";
import { requestOrigin } from "@/lib/apiMedia";

export const runtime = "nodejs";
// Kart içeriği ilan verisine bağlı; ilan güncellenince kart da yenilenmeli.
export const revalidate = 300;

/**
 * İlan paylaşım kartı — PNG üretir.
 *
 *   /api/share/<slug>            -> 1200x630 (WhatsApp/Facebook link önizlemesi)
 *   /api/share/<slug>?v=story    -> 1080x1920 (Instagram hikâyesi)
 *
 * Kart SUNUCUDA üretiliyor ki web, iOS ve Android birebir aynı görseli alsın.
 * Cihazda üretim (view-shot) piksel oranına bağlı olduğu için 1080x1920
 * garanti edilemiyor ve iki platformda farklı çiziliyor.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const variant: CardVariant = req.nextUrl.searchParams.get("v") === "story" ? "story" : "og";

  const listing = await prisma.listing.findFirst({
    where: { slug, ...PUBLIC_VISIBLE_LISTING },
    select: SHARE_LISTING_SELECT,
  });
  if (!listing) return new Response("İlan bulunamadı", { status: 404 });

  // satori uzak görseli kendisi indiriyor, bu yüzden MUTLAK URL şart.
  const relative = publicImageUrl(listing.images[0]?.url ?? null);
  const base = (process.env.NEXT_PUBLIC_MEDIA_URL?.trim() || requestOrigin(req)).replace(/\/+$/, "");
  const imageUrl = relative ? (/^https?:\/\//i.test(relative) ? relative : base + relative) : null;

  const data = toShareCardData(listing as ShareListingRow, imageUrl);

  return new ImageResponse(<ShareCard data={data} variant={variant} />, {
    ...CARD_SIZES[variant],
    fonts: cardFonts(),
    headers: {
      // Kart deterministik: aynı ilan + aynı boyut = aynı görsel.
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
