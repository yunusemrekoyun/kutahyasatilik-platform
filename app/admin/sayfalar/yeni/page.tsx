import Link from "next/link";
import PageForm from "@/components/admin/PageForm";

export const dynamic = "force-dynamic";

export default function NewPage() {
  return (
    <div>
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/admin/sayfalar" className="hover:text-brand-700">Sayfalar</Link>
        <span className="mx-2">/</span>
        <span>Yeni Sayfa</span>
      </nav>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">Yeni İçerik Sayfası</h1>
      <PageForm />
    </div>
  );
}
