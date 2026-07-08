import Link from "next/link";
import DistrictForm from "@/components/admin/DistrictForm";

export const dynamic = "force-dynamic";

export default function NewDistrict() {
  return (
    <div>
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/admin/ilceler" className="hover:text-brand-700">İlçe Verisi</Link>
        <span className="mx-2">/</span>
        <span>Yeni İlçe</span>
      </nav>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">Yeni İlçe</h1>
      <DistrictForm />
    </div>
  );
}
