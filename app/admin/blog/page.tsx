import Link from "next/link";
import Image from "next/image";
import { PlusCircle, Eye, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { deletePost } from "../actions";
import { PageHeader, StatusBadge, adminCard, adminBtnPrimary } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminBlog() {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader title="Blog" description={`${posts.length} yazı`}>
        <Link href="/admin/blog/yeni" className={adminBtnPrimary}>
          <PlusCircle className="h-4 w-4" /> Yeni Yazı
        </Link>
      </PageHeader>

      <div className={`overflow-hidden ${adminCard}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone bg-canvas text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="p-3">Yazı</th>
              <th className="p-3">Durum</th>
              <th className="p-3">Tarih</th>
              <th className="p-3 text-center"><Eye className="mx-auto h-4 w-4" /></th>
              <th className="p-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Henüz yazı yok. İlk blog yazınızı ekleyin.</td></tr>
            )}
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-canvas">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      {p.coverImage && <Image src={p.coverImage} alt="" fill sizes="64px" className="object-cover" />}
                    </div>
                    <span className="line-clamp-2 max-w-[280px] font-medium text-slate-800">{p.title}</span>
                  </div>
                </td>
                <td className="p-3">
                  <StatusBadge tone={p.status === "published" ? "success" : "neutral"}>
                    {p.status === "published" ? "Yayında" : "Taslak"}
                  </StatusBadge>
                </td>
                <td className="p-3 whitespace-nowrap text-slate-600">{formatDate(p.createdAt)}</td>
                <td className="p-3 text-center tabular-nums text-slate-600">{p.viewCount}</td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    {p.status === "published" && (
                      <Link href={`/blog/${p.slug}`} target="_blank" title="Görüntüle" className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"><ExternalLink className="h-4 w-4" /></Link>
                    )}
                    <Link href={`/admin/blog/${p.id}`} title="Düzenle" className="grid h-8 w-8 place-items-center rounded-md text-brand-700 hover:bg-brand-50"><Pencil className="h-4 w-4" /></Link>
                    <form action={deletePost}>
                      <input type="hidden" name="id" value={p.id} />
                      <button title="Sil" className="grid h-8 w-8 place-items-center rounded-md text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
