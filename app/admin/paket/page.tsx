import { prisma } from "@/lib/prisma";
import { savePackage } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-paper px-3.5 py-2.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

export default async function AdminPackagePage() {
  let pkg: Awaited<ReturnType<typeof prisma.package.findFirst>> = null;
  try {
    pkg = await prisma.package.findFirst({ orderBy: { createdAt: "asc" } });
  } catch {
    /* tablo henüz yoksa (migration deploy edilmedi) — boş formla devam */
  }

  let featuresText = "";
  if (pkg?.features) {
    try {
      const arr = JSON.parse(pkg.features);
      if (Array.isArray(arr)) featuresText = arr.join("\n");
    } catch {
      /* yoksay */
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Paket</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tek emlakçı paketi. Alanları düzenleyebilirsiniz; yeni paket oluşturulmaz. Teklif
          oluşturulduğunda paketin adı/özellikleri/fiyatı teklife kopyalanır (snapshot).
        </p>
      </div>

      <form action={savePackage} className="space-y-6">
        {pkg && <input type="hidden" name="id" value={pkg.id} />}

        <section className="rounded-lg bg-paper p-6 ring-1 ring-stone">
          <h2 className="font-bold text-slate-900">Temel</h2>
          <div className="mt-4 grid gap-4">
            <label className="block">
              <span className={labelCls}>Paket Adı</span>
              <input name="name" defaultValue={pkg?.name ?? "Kurumsal Emlakçı Paketi"} className={inputCls} />
            </label>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <label className="block">
                <span className={labelCls}>Ücret (₺)</span>
                <input name="price" type="number" min={0} defaultValue={pkg?.price ?? 2500} className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>Dönem</span>
                <select name="interval" defaultValue={pkg?.interval ?? "monthly"} className={inputCls}>
                  <option value="monthly">Aylık</option>
                  <option value="yearly">Yıllık</option>
                  <option value="one_time">Tek seferlik</option>
                </select>
              </label>
              <label className="flex items-center gap-2 pt-7 text-sm text-slate-700">
                <input type="checkbox" name="active" defaultChecked={pkg?.active ?? true} className="h-4 w-4 rounded border-slate-300" />
                Aktif
              </label>
            </div>
            <label className="block">
              <span className={labelCls}>Açıklama</span>
              <textarea name="description" rows={2} defaultValue={pkg?.description ?? "Kurumsal emlak ofisleri için tam erişim paketi."} className={inputCls} />
            </label>
          </div>
        </section>

        <section className="rounded-lg bg-paper p-6 ring-1 ring-stone">
          <h2 className="font-bold text-slate-900">Kotalar & Özellikler</h2>
          <div className="mt-4 grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className={labelCls}>İlan kotası</span>
                <input name="listingQuota" type="number" min={0} defaultValue={pkg?.listingQuota ?? ""} placeholder="Boş = sınırsız" className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>Öne çıkarma kotası</span>
                <input name="featuredQuota" type="number" min={0} defaultValue={pkg?.featuredQuota ?? ""} placeholder="Boş = yok" className={inputCls} />
              </label>
            </div>
            <label className="block">
              <span className={labelCls}>Özellikler (her satıra bir madde)</span>
              <textarea
                name="features"
                rows={6}
                defaultValue={featuresText || "Sınırsız ilan\nPortföy fırsatlarına erişim\nLead yönetimi\nEmlakçı paneli\nTeknik destek\nPlatform görünürlüğü"}
                className={inputCls}
              />
            </label>
          </div>
        </section>

        <button type="submit" className="rounded-lg bg-brand-700 px-6 py-3 font-bold text-white hover:bg-brand-800">
          Kaydet
        </button>
      </form>
    </div>
  );
}
