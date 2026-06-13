import Link from "next/link";
import PopupForm from "@/components/admin/PopupForm";

export const dynamic = "force-dynamic";

export default function NewPopup() {
  return (
    <div>
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/admin/reklamlar" className="hover:text-brand-700">Reklamlar</Link>
        <span className="mx-2">/</span>
        <span>Yeni Reklam</span>
      </nav>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">Yeni Pop-up Reklam</h1>
      <PopupForm />
    </div>
  );
}
