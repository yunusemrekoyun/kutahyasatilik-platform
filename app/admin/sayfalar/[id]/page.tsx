import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageForm from "@/components/admin/PageForm";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) notFound();

  return (
    <div>
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/admin/sayfalar" className="hover:text-brand-700">Sayfalar</Link>
        <span className="mx-2">/</span>
        <span>Düzenle</span>
      </nav>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">Sayfayı Düzenle</h1>
      <PageForm
        page={{
          id: page.id,
          title: page.title,
          slug: page.slug,
          content: page.content,
          status: page.status,
          showInMenu: page.showInMenu,
          menuOrder: page.menuOrder,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
        }}
      />
    </div>
  );
}
