import { ExternalLink, Landmark } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LOCAL_RESOURCE_TYPES } from "@/lib/localResources";
import { PageHeader, StatusBadge, adminBtnGhost, adminBtnPrimary, adminCard, adminInput, adminLabel } from "@/components/admin/ui";
import { disableLocalResource, saveLocalResource } from "../actions";

export const dynamic = "force-dynamic";

type ResourceRow = Awaited<ReturnType<typeof getResources>>[number];

async function getResources() {
  return prisma.localResource.findMany({ orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { title: "asc" }] });
}

function ResourceFields({ resource }: { resource?: ResourceRow }) {
  return (
    <>
      {resource && <input type="hidden" name="id" value={resource.id} />}
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className={adminLabel}>Bağlantı başlığı *</span>
          <input name="title" required defaultValue={resource?.title ?? ""} className={adminInput} />
        </label>
        <label>
          <span className={adminLabel}>Kurum *</span>
          <input name="institution" required defaultValue={resource?.institution ?? ""} placeholder="Kütahya Belediyesi" className={adminInput} />
        </label>
        <label>
          <span className={adminLabel}>Araç türü</span>
          <select name="type" defaultValue={resource?.type ?? "municipality"} className={adminInput}>
            {Object.entries(LOCAL_RESOURCE_TYPES).map(([value, item]) => (
              <option key={value} value={value}>{item.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={adminLabel}>İlçe</span>
          <input name="district" defaultValue={resource?.district ?? ""} placeholder="Tüm Kütahya" className={adminInput} />
        </label>
        <label className="md:col-span-2">
          <span className={adminLabel}>Resmî HTTPS adresi *</span>
          <input name="url" type="url" required defaultValue={resource?.url ?? ""} placeholder="https://..." className={adminInput} />
        </label>
        <label>
          <span className={adminLabel}>Sıra</span>
          <input name="sortOrder" type="number" defaultValue={resource?.sortOrder ?? 0} className={adminInput} />
        </label>
      </div>
      <label className="mt-4 block">
        <span className={adminLabel}>Kısa açıklama</span>
        <textarea name="description" rows={3} defaultValue={resource?.description ?? ""} className={`${adminInput} h-auto py-3`} />
      </label>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-700">
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" name="active" defaultChecked={resource?.active ?? true} className="h-4 w-4 rounded" />
          Kamu sayfasında göster
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" name="checkedNow" className="h-4 w-4 rounded" />
          Bağlantıyı şimdi kontrol ettim
        </label>
      </div>
    </>
  );
}

export default async function AdminLocalResourcesPage() {
  const resources = await getResources();
  return (
    <div>
      <PageHeader title="Resmî Yerel Araçlar" description="Belediye, imar, parsel ve e-Devlet bağlantılarını yönetin" />

      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Yalnız doğruladığınız resmî kurum adreslerini ekleyin. Site, kullanıcıyı harici kuruma yönlendirdiğini açıkça belirtir ve hiçbir tapu ya da kimlik bilgisini kendi içinde toplamaz.
      </div>

      <details className={`${adminCard} mb-8 p-5`}>
        <summary className="cursor-pointer font-semibold text-slate-900">Yeni resmî bağlantı ekle</summary>
        <form action={saveLocalResource} className="mt-5">
          <ResourceFields />
          <button className={`${adminBtnPrimary} mt-5`}>Bağlantıyı Kaydet</button>
        </form>
      </details>

      <div className="space-y-4">
        {resources.length === 0 && (
          <div className={`${adminCard} p-10 text-center`}>
            <Landmark className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-3 font-medium text-slate-700">Henüz resmî bağlantı eklenmedi.</p>
          </div>
        )}
        {resources.map((resource) => (
          <details key={resource.id} className={`${adminCard} p-5`}>
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{resource.title}</span>
                    <StatusBadge tone={resource.active ? "success" : "neutral"}>{resource.active ? "Aktif" : "Pasif"}</StatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {resource.institution} · {LOCAL_RESOURCE_TYPES[resource.type]?.label ?? resource.type}
                    {resource.lastCheckedAt ? ` · Son kontrol ${resource.lastCheckedAt.toLocaleDateString("tr-TR")}` : " · Kontrol tarihi yok"}
                  </p>
                </div>
                <span className="text-sm font-medium text-brand-700">Düzenle</span>
              </div>
            </summary>
            <form action={saveLocalResource} className="mt-6 border-t border-stone pt-5">
              <ResourceFields resource={resource} />
              <div className="mt-5 flex flex-wrap gap-3">
                <button className={adminBtnPrimary}>Değişiklikleri Kaydet</button>
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className={adminBtnGhost}>
                  Bağlantıyı aç <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </form>
            {resource.active && (
              <form action={disableLocalResource} className="mt-3">
                <input type="hidden" name="id" value={resource.id} />
                <button className={adminBtnGhost}>Pasife al</button>
              </form>
            )}
          </details>
        ))}
      </div>
    </div>
  );
}
