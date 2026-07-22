import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAgent } from "@/lib/apiAgent";
import { absolutizeUrl } from "@/lib/apiMedia";
import { parseJsonArray } from "@/lib/format";
import { deleteUploadFiles } from "@/lib/uploadDeletion";
import { deleteVideo } from "@/lib/videoStorage";
import { upsertAgentListing, AgentListingError } from "@/lib/apiAgentListing";
import { revalidatePath, revalidateTag } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tek ilanın tüm alanları (düzenleme formu) — sahiplik kontrollü.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await resolveApiAgent(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const { id } = await params;
  const l = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { select: { url: true }, orderBy: { sortOrder: "asc" } },
      amenities: { select: { key: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!l || l.agentId !== a.agent.id) return NextResponse.json({ ok: false, error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json({
    ok: true,
    listing: {
      id: l.id, slug: l.slug, title: l.title, description: l.description,
      propertyType: l.propertyType, listingType: l.listingType, status: l.status,
      price: l.price, currency: l.currency, district: l.district, neighborhood: l.neighborhood,
      address: l.address, lat: l.lat, lng: l.lng, areaGross: l.areaGross, areaNet: l.areaNet,
      rooms: l.rooms, floor: l.floor, totalFloors: l.totalFloors, buildingAge: l.buildingAge,
      heating: l.heating, furnished: l.furnished, inSite: l.inSite, balcony: l.balcony, parking: l.parking,
      creditEligible: l.creditEligible, usageStatus: l.usageStatus, propertyCondition: l.propertyCondition,
      bathroomCount: l.bathroomCount, dues: l.dues, exchangeEligible: l.exchangeEligible,
      deedType: l.deedType, occupancyPermit: l.occupancyPermit, validUntil: l.validUntil,
      deedStatus: l.deedStatus, zoningStatus: l.zoningStatus, adaNo: l.adaNo, parselNo: l.parselNo, kaks: l.kaks,
      locationVisibility: l.locationVisibility, parcelVisibility: l.parcelVisibility,
      videoUrl: l.videoUrl, droneUrl: l.droneUrl, virtualTourUrl: l.virtualTourUrl,
      moderationStatus: l.moderationStatus, note: l.note,
      features: parseJsonArray(l.features),
      amenities: l.amenities.map((item) => item.key),
      images: l.images.map((im) => ({ url: absolutizeUrl(im.url, req) })),
    },
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await resolveApiAgent(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
  try {
    const r = await upsertAgentListing(a.agent.id, id, body);
    revalidateTag("marketplace-stats", { expire: 0 });
    revalidatePath("/emlak-ofisleri");
    revalidatePath("/danismanlar");
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    if (e instanceof AgentListingError) return NextResponse.json({ ok: false, error: e.message }, { status: e.status });
    return NextResponse.json({ ok: false, error: "İlan kaydedilemedi" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await resolveApiAgent(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const { id } = await params;
  const owned = await prisma.listing.findUnique({
    where: { id },
    select: { agentId: true, videoUrl: true, images: { select: { url: true } } },
  });
  if (!owned || owned.agentId !== a.agent.id) return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 403 });
  await prisma.listing.delete({ where: { id } });
  await deleteUploadFiles(owned.images.map((i) => i.url));
  await deleteVideo(owned.videoUrl);
  revalidateTag("marketplace-stats", { expire: 0 });
  revalidatePath("/emlak-ofisleri");
  revalidatePath("/danismanlar");
  return NextResponse.json({ ok: true });
}
