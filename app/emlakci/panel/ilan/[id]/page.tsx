import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAgentSession } from "@/lib/agentAuth";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/format";
import { MODERATION_STATUS_LABELS } from "@/lib/constants";
import AgentListingForm from "@/components/agent/AgentListingForm";

export const dynamic = "force-dynamic";

export default async function EditAgentListing({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getAgentSession();
  if (!session) redirect("/giris");

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      amenities: { orderBy: { sortOrder: "asc" }, select: { key: true } },
    },
  });

  // Sadece kendi ilanını düzenleyebilir
  if (!listing || listing.agentId !== session.agentId) notFound();

  const data = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    propertyType: listing.propertyType,
    listingType: listing.listingType,
    status: listing.status,
    price: listing.price,
    currency: listing.currency,
    district: listing.district,
    neighborhood: listing.neighborhood,
    address: listing.address,
    lat: listing.lat,
    lng: listing.lng,
    areaGross: listing.areaGross,
    areaNet: listing.areaNet,
    rooms: listing.rooms,
    floor: listing.floor,
    totalFloors: listing.totalFloors,
    buildingAge: listing.buildingAge,
    heating: listing.heating,
    furnished: listing.furnished,
    inSite: listing.inSite,
    balcony: listing.balcony,
    parking: listing.parking,
    creditEligible: listing.creditEligible,
    usageStatus: listing.usageStatus,
    propertyCondition: listing.propertyCondition,
    bathroomCount: listing.bathroomCount,
    dues: listing.dues,
    exchangeEligible: listing.exchangeEligible,
    deedType: listing.deedType,
    occupancyPermit: listing.occupancyPermit,
    validUntil: listing.validUntil,
    deedStatus: listing.deedStatus,
    zoningStatus: listing.zoningStatus,
    adaNo: listing.adaNo,
    parselNo: listing.parselNo,
    kaks: listing.kaks,
    locationVisibility: listing.locationVisibility,
    parcelVisibility: listing.parcelVisibility,
    videoUrl: listing.videoUrl,
    droneUrl: listing.droneUrl,
    virtualTourUrl: listing.virtualTourUrl,
    features: parseJsonArray(listing.features),
    images: listing.images.map((i) => ({ url: i.url })),
    amenities: listing.amenities,
  };

  return (
    <div>
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/emlakci/panel" className="hover:text-brand-700">Panel</Link>
        <span className="mx-2">/</span>
        <span>İlanı Düzenle</span>
      </nav>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold text-slate-900">İlanı Düzenle</h1>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {MODERATION_STATUS_LABELS[listing.moderationStatus]}
        </span>
      </div>
      <AgentListingForm listing={data} />
    </div>
  );
}
