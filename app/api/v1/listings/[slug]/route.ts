import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/format";
import { requestOrigin } from "@/lib/apiMedia";

// Mobil ilan detayı — web detay sayfasıyla (app/(site)/ilan/[slug]) aynı veri kaynağı.
// Onaylı + pasif olmayan ilan; görseller mobil için mutlak URL'e çevrilir.

function absolutize(path: string | null, origin: string): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = (process.env.NEXT_PUBLIC_MEDIA_URL?.trim() || origin).replace(/\/+$/, "");
  return base + (path.startsWith("/") ? path : "/" + path);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const l = await prisma.listing.findFirst({
    where: { slug, moderationStatus: "approved", status: { not: "passive" } },
    include: {
      images: { orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
      agent: { select: { name: true, title: true, agency: true, logo: true } },
    },
  });

  if (!l) {
    return NextResponse.json({ ok: false, error: "İlan bulunamadı" }, { status: 404 });
  }

  const origin = requestOrigin(req);

  return NextResponse.json({
    ok: true,
    listing: {
      id: l.id,
      slug: l.slug,
      title: l.title,
      description: l.description,
      propertyType: l.propertyType,
      listingType: l.listingType,
      price: l.price,
      currency: l.currency,
      status: l.status,
      district: l.district,
      neighborhood: l.neighborhood,
      address: l.address,
      lat: l.lat,
      lng: l.lng,
      rooms: l.rooms,
      areaGross: l.areaGross,
      areaNet: l.areaNet,
      floor: l.floor,
      totalFloors: l.totalFloors,
      buildingAge: l.buildingAge,
      heating: l.heating,
      furnished: l.furnished,
      balcony: l.balcony,
      parking: l.parking,
      inSite: l.inSite,
      deedStatus: l.deedStatus,
      zoningStatus: l.zoningStatus,
      adaNo: l.adaNo,
      parselNo: l.parselNo,
      kaks: l.kaks,
      videoUrl: l.videoUrl,
      droneUrl: l.droneUrl,
      virtualTourUrl: l.virtualTourUrl,
      featured: l.featured,
      verified: l.verified,
      viewCount: l.viewCount,
      createdAt: l.createdAt,
      images: l.images.map((im) => ({ url: absolutize(im.url, origin), alt: im.alt })),
      // Emlakçı logosu mobil için mutlak URL'e çevrilir.
      agent: l.agent ? { ...l.agent, logo: absolutize(l.agent.logo, origin) } : null,
      features: parseJsonArray(l.features),
    },
  });
}
