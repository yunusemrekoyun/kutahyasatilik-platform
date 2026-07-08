import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DistrictForm from "@/components/admin/DistrictForm";

export const dynamic = "force-dynamic";

export default async function EditDistrict({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const district = await prisma.district.findUnique({ where: { id } });
  if (!district) notFound();

  return (
    <div>
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/admin/ilceler" className="hover:text-brand-700">İlçe Verisi</Link>
        <span className="mx-2">/</span>
        <span>Düzenle</span>
      </nav>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">İlçeyi Düzenle</h1>
      <DistrictForm
        district={{
          id: district.id,
          name: district.name,
          slug: district.slug,
          lat: district.lat,
          lng: district.lng,
          investmentScore: district.investmentScore,
          valueGrowth3yPct: district.valueGrowth3yPct,
          valueGrowth5yPct: district.valueGrowth5yPct,
          avgPriceDaire: district.avgPriceDaire,
          avgPriceArsaM2: district.avgPriceArsaM2,
          description: district.description,
          transportNote: district.transportNote,
          nearbySchools: district.nearbySchools,
          nearbyHospitals: district.nearbyHospitals,
          sortOrder: district.sortOrder,
        }}
      />
    </div>
  );
}
