import { prisma } from "@/lib/prisma";
import { saveTestimonial, deleteTestimonial } from "../actions";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none";

export default async function AdminTestimonials() {
  const items = await prisma.testimonial.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Müşteri Yorumları</h1>
        <p className="text-sm text-slate-500">Ana sayfada gösterilen yorumları buradan yönetin. {items.length} yorum.</p>
      </div>

      {/* Yeni yorum ekle */}
      <form action={saveTestimonial} className="rounded-xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="font-bold text-slate-900">Yeni Yorum Ekle</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input name="name" required placeholder="Ad Soyad *" className={inputCls} />
          <input name="role" placeholder="Rol / Konum (örn. Daire Sahibi · Merkez)" className={inputCls} />
        </div>
        <textarea name="text" required rows={2} placeholder="Yorum metni *" className={`${inputCls} mt-3`} />
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            Yıldız
            <select name="stars" defaultValue="5" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} ★</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            Sıra
            <input name="sortOrder" type="number" defaultValue={0} className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="published" defaultChecked className="h-4 w-4 rounded border-slate-300" />
            Yayında
          </label>
          <button className="ml-auto rounded-lg bg-brand-700 px-5 py-2 text-sm font-bold text-white hover:bg-brand-800">
            + Ekle
          </button>
        </div>
      </form>

      {/* Mevcut yorumlar */}
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="rounded-xl bg-white p-8 text-center text-slate-400 ring-1 ring-slate-200">Henüz yorum yok.</p>
        )}
        {items.map((t) => (
          <form key={t.id} action={saveTestimonial} className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <input type="hidden" name="id" value={t.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="name" required defaultValue={t.name} className={inputCls} />
              <input name="role" defaultValue={t.role ?? ""} placeholder="Rol / Konum" className={inputCls} />
            </div>
            <textarea name="text" required rows={2} defaultValue={t.text} className={`${inputCls} mt-3`} />
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                Yıldız
                <select name="stars" defaultValue={String(t.stars)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
                  {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} ★</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                Sıra
                <input name="sortOrder" type="number" defaultValue={t.sortOrder} className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="published" defaultChecked={t.published} className="h-4 w-4 rounded border-slate-300" />
                Yayında
              </label>
              <div className="ml-auto flex items-center gap-2">
                <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-900">Kaydet</button>
                <button
                  formAction={deleteTestimonial}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Sil
                </button>
              </div>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
