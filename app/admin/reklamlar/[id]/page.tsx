import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PopupForm from "@/components/admin/PopupForm";

export const dynamic = "force-dynamic";

export default async function EditPopup({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const popup = await prisma.popup.findUnique({ where: { id } });
  if (!popup) notFound();

  return (
    <div>
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/admin/reklamlar" className="hover:text-brand-700">Reklamlar</Link>
        <span className="mx-2">/</span>
        <span>Düzenle</span>
      </nav>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">Reklamı Düzenle</h1>
      <PopupForm
        popup={{
          id: popup.id,
          title: popup.title,
          body: popup.body,
          imageUrl: popup.imageUrl,
          linkUrl: popup.linkUrl,
          linkText: popup.linkText,
          active: popup.active,
          frequency: popup.frequency,
          delaySec: popup.delaySec,
        }}
      />
    </div>
  );
}
