import { Building2, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/format";
import { PageHeader, StatusBadge, adminBtnGhost, adminBtnPrimary, adminCard, adminInput, adminLabel } from "@/components/admin/ui";
import { saveAgency, unpublishAgency } from "../actions";

export const dynamic = "force-dynamic";

type AgencyRow = Awaited<ReturnType<typeof getAgencies>>[number];

async function getAgencies() {
  return prisma.agency.findMany({
    orderBy: [{ published: "desc" }, { name: "asc" }],
    include: { _count: { select: { agents: true, listings: true } } },
  });
}

function AgencyFields({ agency }: { agency?: AgencyRow }) {
  return (
    <>
      {agency && <input type="hidden" name="id" value={agency.id} />}
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className={adminLabel}>Firma adı *</span>
          <input name="name" required defaultValue={agency?.name ?? ""} className={adminInput} />
        </label>
        <label>
          <span className={adminLabel}>URL kısa adı</span>
          <input name="slug" defaultValue={agency?.slug ?? ""} placeholder="ornek-emlak" className={adminInput} />
        </label>
        <label>
          <span className={adminLabel}>Telefon</span>
          <input name="phone" inputMode="tel" defaultValue={agency?.phone ?? ""} className={adminInput} />
        </label>
        <label>
          <span className={adminLabel}>WhatsApp</span>
          <input name="whatsapp" inputMode="tel" defaultValue={agency?.whatsapp ?? ""} className={adminInput} />
        </label>
        <label>
          <span className={adminLabel}>E-posta</span>
          <input name="email" type="email" defaultValue={agency?.email ?? ""} className={adminInput} />
        </label>
        <label>
          <span className={adminLabel}>Web sitesi (HTTPS)</span>
          <input name="website" type="url" defaultValue={agency?.website ?? ""} placeholder="https://" className={adminInput} />
        </label>
        <label>
          <span className={adminLabel}>Logo URL</span>
          <input name="logo" defaultValue={agency?.logo ?? ""} placeholder="/uploads/... veya https://" className={adminInput} />
        </label>
        <label>
          <span className={adminLabel}>Kapak görseli URL</span>
          <input name="coverImage" defaultValue={agency?.coverImage ?? ""} placeholder="/uploads/... veya https://" className={adminInput} />
        </label>
        <label>
          <span className={adminLabel}>Durum</span>
          <select name="status" defaultValue={agency?.status ?? "pending"} className={adminInput}>
            <option value="pending">İncelemede</option>
            <option value="approved">Onaylı</option>
            <option value="rejected">Reddedildi</option>
            <option value="suspended">Askıda</option>
          </select>
        </label>
        <label>
          <span className={adminLabel}>Hizmet verilen ilçeler</span>
          <input
            name="serviceDistricts"
            defaultValue={parseJsonArray(agency?.serviceDistricts).join(", ")}
            placeholder="Merkez, Tavşanlı, Simav"
            className={adminInput}
          />
        </label>
      </div>
      <label className="mt-4 block">
        <span className={adminLabel}>Adres</span>
        <input name="address" defaultValue={agency?.address ?? ""} className={adminInput} />
      </label>
      <label className="mt-4 block">
        <span className={adminLabel}>Firma tanıtımı</span>
        <textarea name="description" rows={4} defaultValue={agency?.description ?? ""} className={`${adminInput} h-auto py-3`} />
      </label>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-700">
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" name="published" defaultChecked={agency?.published ?? false} className="h-4 w-4 rounded" />
          Kamu dizininde yayınla
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" name="verified" defaultChecked={Boolean(agency?.verifiedAt)} className="h-4 w-4 rounded" />
          Doğrulanmış firma
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" name="showPhone" defaultChecked={agency?.showPhone ?? false} className="h-4 w-4 rounded" />
          Telefonu göster
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" name="showWhatsapp" defaultChecked={agency?.showWhatsapp ?? false} className="h-4 w-4 rounded" />
          WhatsApp&apos;ı göster
        </label>
      </div>
    </>
  );
}

export default async function AdminAgenciesPage() {
  const agencies = await getAgencies();

  return (
    <div>
      <PageHeader title="Firmalar" description={`${agencies.length} firma · kamu dizini ve portföy sahipliği`} />

      <div className="mb-6 flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <p>Bir profil yalnız <strong>Onaylı</strong> ve <strong>Kamu dizininde yayınla</strong> seçenekleri birlikte açıkken görünür. İletişim bilgileri ayrıca açık izin gerektirir.</p>
      </div>

      <details className={`${adminCard} mb-8 p-5`}>
        <summary className="cursor-pointer font-semibold text-slate-900">Yeni firma ekle</summary>
        <form action={saveAgency} className="mt-5">
          <AgencyFields />
          <button className={`${adminBtnPrimary} mt-5`}>Firmayı Kaydet</button>
        </form>
      </details>

      <div className="space-y-4">
        {agencies.length === 0 && (
          <div className={`${adminCard} p-10 text-center`}>
            <Building2 className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-3 font-medium text-slate-700">Henüz firma kaydı yok.</p>
          </div>
        )}
        {agencies.map((agency) => (
          <details key={agency.id} className={`${adminCard} p-5`}>
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{agency.name}</span>
                    <StatusBadge tone={agency.published && agency.status === "approved" ? "success" : "neutral"}>
                      {agency.published && agency.status === "approved" ? "Yayında" : "Yayında değil"}
                    </StatusBadge>
                    {agency.verifiedAt && <StatusBadge tone="brand">Doğrulandı</StatusBadge>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{agency._count.listings} ilan · {agency._count.agents} danışman · /emlak-ofisi/{agency.slug}</p>
                </div>
                <span className="text-sm font-medium text-brand-700">Düzenle</span>
              </div>
            </summary>
            <form action={saveAgency} className="mt-6 border-t border-stone pt-5">
              <AgencyFields agency={agency} />
              <button className={`${adminBtnPrimary} mt-5`}>Değişiklikleri Kaydet</button>
            </form>
            {agency.published && (
              <form action={unpublishAgency} className="mt-3">
                <input type="hidden" name="id" value={agency.id} />
                <button className={adminBtnGhost}>Yayından kaldır</button>
              </form>
            )}
          </details>
        ))}
      </div>
    </div>
  );
}
