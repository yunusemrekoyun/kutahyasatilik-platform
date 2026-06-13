import ListingForm from "@/components/admin/ListingForm";

export const dynamic = "force-dynamic";

export default function NewListingPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">Yeni İlan Ekle</h1>
      <ListingForm />
    </div>
  );
}
