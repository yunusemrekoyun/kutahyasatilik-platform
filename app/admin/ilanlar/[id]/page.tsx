import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/format";
import ListingForm from "@/components/admin/ListingForm";

export const dynamic = "force-dynamic";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listing, agencies] = await Promise.all([
    prisma.listing.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        amenities: { orderBy: { sortOrder: "asc" }, select: { key: true } },
      },
    }),
    prisma.agency.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, status: true } }),
  ]);
  if (!listing) notFound();

  const data = {
    ...listing,
    features: parseJsonArray(listing.features),
    images: listing.images.map((i) => ({ url: i.url })),
    amenities: listing.amenities,
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">İlanı Düzenle</h1>
      <ListingForm listing={data} agencies={agencies} />
    </div>
  );
}
