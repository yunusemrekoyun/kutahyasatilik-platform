import ListingForm from "@/components/admin/ListingForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const agencies = await prisma.agency.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, status: true },
  });
  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">Yeni İlan Ekle</h1>
      <ListingForm agencies={agencies} />
    </div>
  );
}
