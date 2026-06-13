import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { deletePost } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminBlog() {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Blog</h1>
          <p className="text-sm text-slate-500">{posts.length} yazı</p>
        </div>
        <Link href="/admin/blog/yeni" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-800">
          + Yeni Yazı
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
              <th className="p-3">Yazı</th>
              <th className="p-3">Durum</th>
              <th className="p-3">Tarih</th>
              <th className="p-3 text-center">👁️</th>
              <th className="p-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Henüz yazı yok. İlk blog yazınızı ekleyin.</td></tr>
            )}
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      {p.coverImage && <Image src={p.coverImage} alt="" fill sizes="64px" className="object-cover" />}
                    </div>
                    <span className="line-clamp-2 max-w-[280px] font-medium text-slate-800">{p.title}</span>
                  </div>
                </td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "published" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                    {p.status === "published" ? "Yayında" : "Taslak"}
                  </span>
                </td>
                <td className="p-3 text-slate-600">{formatDate(p.createdAt)}</td>
                <td className="p-3 text-center text-slate-600">{p.viewCount}</td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-2">
                    {p.status === "published" && (
                      <Link href={`/blog/${p.slug}`} target="_blank" className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100">Gör</Link>
                    )}
                    <Link href={`/admin/blog/${p.id}`} className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">Düzenle</Link>
                    <form action={deletePost}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50">Sil</button>
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
