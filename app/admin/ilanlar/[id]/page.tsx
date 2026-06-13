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
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!listing) notFound();

  const data = {
    ...listing,
    features: parseJsonArray(listing.features),
    images: listing.images.map((i) => ({ url: i.url })),
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">İlanı Düzenle</h1>
      <ListingForm listing={data} />
    </div>
  );
}
