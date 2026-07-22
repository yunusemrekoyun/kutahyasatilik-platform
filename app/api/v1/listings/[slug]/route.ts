import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/format";
import { requestOrigin } from "@/lib/apiMedia";
import { buildAnalysis } from "@/lib/analysis";

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
      agent: {
        select: {
          name: true, title: true, agency: true, logo: true, slug: true, phone: true,
          publicProfile: true, showPhone: true, showWhatsapp: true, status: true,
          _count: { select: { listings: { where: { status: "active", moderationStatus: "approved" } } } },
        },
      },
      agencyRef: {
        select: {
          name: true, slug: true, logo: true, phone: true, whatsapp: true, verifiedAt: true,
          status: true, published: true, showPhone: true, showWhatsapp: true,
          _count: { select: { listings: { where: { status: "active", moderationStatus: "approved" } } } },
        },
      },
      amenities: { orderBy: { sortOrder: "asc" }, select: { key: true, label: true, group: true } },
      priceHistory: { orderBy: { createdAt: "asc" }, select: { price: true, createdAt: true } },
    },
  });

  if (!l) {
    return NextResponse.json({ ok: false, error: "İlan bulunamadı" }, { status: 404 });
  }

  // Görüntülenme sayacını artır (web server-component paritesi) — fire-and-forget.
  // Emlakçı metriği mobil trafiği de saysın.
  prisma.listing.update({ where: { id: l.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const origin = requestOrigin(req);
  const [district, scoresSetting, similarRaw] = await Promise.all([
    prisma.district.findFirst({ where: { name: l.district } }),
    prisma.setting.findUnique({ where: { key: "analysis_scores" }, select: { value: true } }),
    prisma.listing.findMany({
      where: {
        status: "active",
        moderationStatus: "approved",
        id: { not: l.id },
        OR: [{ district: l.district }, { propertyType: l.propertyType }],
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 3,
      include: { images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } } },
    }),
  ]);
  const analysis = buildAnalysis(l, district);
  const publicCoordinates =
    l.locationVisibility === "hidden" || l.lat == null || l.lng == null
      ? { lat: null, lng: null }
      : l.locationVisibility === "exact"
        ? { lat: l.lat, lng: l.lng }
        : { lat: Math.round(l.lat * 100) / 100, lng: Math.round(l.lng * 100) / 100 };
  const similar = similarRaw.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    price: item.price,
    currency: item.currency,
    propertyType: item.propertyType,
    district: item.district,
    neighborhood: item.neighborhood,
    rooms: item.rooms,
    areaGross: item.areaGross,
    status: item.status,
    featured: item.featured,
    verified: item.verified,
    coverImage: absolutize(item.images[0]?.url ?? null, origin),
    agentName: null,
  }));

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
      address: l.locationVisibility === "exact" ? l.address : null,
      lat: publicCoordinates.lat,
      lng: publicCoordinates.lng,
      locationVisibility: l.locationVisibility,
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
      creditEligible: l.creditEligible,
      usageStatus: l.usageStatus,
      propertyCondition: l.propertyCondition,
      bathroomCount: l.bathroomCount,
      dues: l.dues,
      exchangeEligible: l.exchangeEligible,
      deedType: l.deedType,
      occupancyPermit: l.occupancyPermit,
      validUntil: l.validUntil,
      deedStatus: l.deedStatus,
      zoningStatus: l.zoningStatus,
      adaNo: l.parcelVisibility ? l.adaNo : null,
      parselNo: l.parcelVisibility ? l.parselNo : null,
      parcelVisibility: l.parcelVisibility,
      kaks: l.kaks,
      videoUrl: l.videoUrl,
      droneUrl: l.droneUrl,
      virtualTourUrl: l.virtualTourUrl,
      featured: l.featured,
      verified: l.verified,
      // increment fire-and-forget çalıştığı için okunan değer 1 geride kalır; +1 ile telafi.
      viewCount: l.viewCount + 1,
      createdAt: l.createdAt,
      images: l.images.map((im) => ({ url: absolutize(im.url, origin), alt: im.alt })),
      // Emlakçı logosu mobil için mutlak URL'e çevrilir.
      agent: l.agent && l.agent.status === "approved" ? {
        name: l.agent.name,
        title: l.agent.title,
        agency: l.agent.agency,
        slug: l.agent.publicProfile && l.agent._count.listings > 0 ? l.agent.slug : null,
        logo: absolutize(l.agent.logo, origin),
        phone: l.agent.showPhone ? l.agent.phone : null,
        whatsapp: l.agent.showWhatsapp ? l.agent.phone : null,
      } : null,
      agency: l.agencyRef?.published && l.agencyRef.status === "approved" && l.agencyRef._count.listings > 0 ? {
        name: l.agencyRef.name,
        slug: l.agencyRef.slug,
        logo: absolutize(l.agencyRef.logo, origin),
        verified: Boolean(l.agencyRef.verifiedAt),
        phone: l.agencyRef.showPhone ? l.agencyRef.phone : null,
        whatsapp: l.agencyRef.showWhatsapp ? (l.agencyRef.whatsapp || l.agencyRef.phone) : null,
      } : null,
      features: parseJsonArray(l.features),
      amenities: l.amenities,
      priceHistory: l.priceHistory,
      similar,
      analysis,
      analysisVisible: scoresSetting?.value !== "0",
    },
  });
}
