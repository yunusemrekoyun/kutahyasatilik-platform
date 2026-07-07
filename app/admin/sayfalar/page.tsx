import Link from "next/link";
import { Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { deletePage } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminPages() {
  const pages = await prisma.page.findMany({ orderBy: [{ menuOrder: "asc" }, { createdAt: "desc" }] });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sayfalar</h1>
          <p className="text-sm text-slate-500">{pages.length} içerik sayfası</p>
        </div>
        <Link href="/admin/sayfalar/yeni" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-800">
          + Yeni Sayfa
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
              <th className="p-3">Başlık</th>
              <th className="p-3">Adres</th>
              <th className="p-3">Durum</th>
              <th className="p-3">Menü</th>
              <th className="p-3">Güncelleme</th>
              <th className="p-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">Henüz sayfa yok. Hakkımızda, KVKK gibi sayfalar ekleyin.</td></tr>
            )}
            {pages.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-800">{p.title}</td>
                <td className="p-3 text-slate-500">/sayfa/{p.slug}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "published" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                    {p.status === "published" ? "Yayında" : "Taslak"}
                  </span>
                </td>
                <td className="p-3 text-slate-600">{p.showInMenu ? <Check className="h-4 w-4" /> : "—"}</td>
                <td className="p-3 text-slate-600">{formatDate(p.updatedAt)}</td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-2">
                    {p.status === "published" && (
                      <Link href={`/sayfa/${p.slug}`} target="_blank" className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100">Gör</Link>
                    )}
                    <Link href={`/admin/sayfalar/${p.id}`} className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">Düzenle</Link>
                    <form action={deletePage}>
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
