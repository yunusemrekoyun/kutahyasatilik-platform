import Link from "next/link";
import { Phone, Mail, MessageCircle, Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDateTime, parseJsonArray } from "@/lib/format";
import { LEAD_TYPE_LABELS, LEAD_STATUS_LABELS } from "@/lib/constants";
import { updateLeadStatus, deleteLead } from "../actions";
import { PageHeader, StatusBadge, EmptyState, adminCard } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const TYPE_TABS = [
  { key: "", label: "Tümü" },
  { key: "seller", label: "Satıcılar" },
  { key: "appointment", label: "Randevu" },
  { key: "expertise", label: "Ekspertiz" },
  { key: "price_offer", label: "Teklif" },
  { key: "contact", label: "İletişim" },
];

const STATUS_TONE: Record<string, "danger" | "warning" | "success"> = {
  new: "danger",
  contacted: "warning",
  closed: "success",
};

export default async function AdminLeads({
  searchParams,
}: {
  searchParams: Promise<{ tip?: string; durum?: string }>;
}) {
  const sp = await searchParams;
  const where: Record<string, unknown> = {};
  if (sp.tip) where.type = sp.tip;
  if (sp.durum) where.status = sp.durum;

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { listing: { select: { title: true, slug: true } } },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="Gelen Talepler" description={`${leads.length} kayıt`} />

      {/* Tip sekmeleri */}
      <div className="flex flex-wrap gap-2">
        {TYPE_TABS.map((t) => {
          const active = (sp.tip || "") === t.key;
          const qs = new URLSearchParams();
          if (t.key) qs.set("tip", t.key);
          if (sp.durum) qs.set("durum", sp.durum);
          return (
            <Link
              key={t.key}
              href={`/admin/talepler${qs.toString() ? `?${qs}` : ""}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${active ? "bg-brand-700 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-brand-300"}`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 space-y-3">
        {leads.length === 0 && (
          <EmptyState Icon={Inbox} title="Bu filtreye uygun talep yok" text="Farklı bir sekme seçin ya da tüm talepleri görüntüleyin." />
        )}
        {leads.map((l) => {
          const photos = parseJsonArray(l.photos);
          return (
            <div key={l.id} className={`${adminCard} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone="brand">{LEAD_TYPE_LABELS[l.type] || l.type}</StatusBadge>
                    <StatusBadge tone={STATUS_TONE[l.status] || "neutral"}>{LEAD_STATUS_LABELS[l.status]}</StatusBadge>
                    <span className="text-xs text-slate-400">{formatDateTime(l.createdAt)}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{l.name}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                    <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline"><Phone className="h-4 w-4" /> {l.phone}</a>
                    {l.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4 text-slate-400" /> {l.email}</span>}
                    <a href={`https://wa.me/${l.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-green-600 hover:underline"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Durum güncelle */}
                  <form action={updateLeadStatus} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={l.id} />
                    <select name="status" defaultValue={l.status} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
                      <option value="new">Yeni</option>
                      <option value="contacted">Arandı</option>
                      <option value="closed">Kapandı</option>
                    </select>
                    <button className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">Kaydet</button>
                  </form>
                  <form action={deleteLead}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="rounded-lg px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50">Sil</button>
                  </form>
                </div>
              </div>

              {/* Detaylar */}
              <div className="mt-3 grid gap-x-6 gap-y-1 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                {l.district && <p><span className="text-slate-400">İlçe:</span> {l.district}</p>}
                {l.neighborhood && <p><span className="text-slate-400">Mahalle:</span> {l.neighborhood}</p>}
                {l.propertyType && <p><span className="text-slate-400">Mülk:</span> {l.propertyType}</p>}
                {l.estimatedPrice && <p><span className="text-slate-400">Tahmini Fiyat:</span> {l.estimatedPrice}</p>}
                {l.preferredDate && <p><span className="text-slate-400">Tercih:</span> {l.preferredDate}</p>}
                {l.utmSource && <p><span className="text-slate-400">Kaynak:</span> {l.utmSource}</p>}
                {l.listing && (
                  <p className="lg:col-span-3">
                    <span className="text-slate-400">İlan:</span>{" "}
                    <Link href={`/ilan/${l.listing.slug}`} target="_blank" className="text-brand-700 hover:underline">{l.listing.title}</Link>
                  </p>
                )}
              </div>

              {l.message && (
                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{l.message}</p>
              )}

              {photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {photos.map((p, i) => (
                    <a key={i} href={p} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p} alt="" className="h-20 w-20 rounded-lg object-cover ring-1 ring-slate-200" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
