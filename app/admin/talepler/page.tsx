import Link from "next/link";
import { Phone, Mail, MessageCircle, Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDateTime, parseJsonArray } from "@/lib/format";
import { LEAD_TYPE_LABELS, LEAD_STATUS_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { updateLeadStatus, deleteLead, promoteLeadToOpportunity } from "../actions";
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

const STATUS_TONE: Record<string, "danger" | "warning" | "success" | "brand"> = {
  received: "danger",
  reviewing: "warning",
  contacted: "brand",
  resolved: "success",
  // eski değerler (geriye dönük)
  new: "danger",
  closed: "success",
};

const PER_PAGE = 50;

export default async function AdminLeads({
  searchParams,
}: {
  searchParams: Promise<{ tip?: string; durum?: string; sayfa?: string }>;
}) {
  const sp = await searchParams;
  const where: Record<string, unknown> = {};
  if (sp.tip) where.type = sp.tip;
  if (sp.durum) where.status = sp.durum;
  const page = Math.max(1, Number(sp.sayfa) || 1);

  // Sayfalama ZORUNLU: talepler sürekli birikir; sabit take ile fazlası ekranda
  // hiç görünmezdi ve başlıktaki sayaç gerçek toplamı değil o tavanı gösterirdi.
  const [total, leads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { listing: { select: { title: true, slug: true } } },
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const pageQs = (p: number) => {
    const qs = new URLSearchParams();
    if (sp.tip) qs.set("tip", sp.tip);
    if (sp.durum) qs.set("durum", sp.durum);
    if (p > 1) qs.set("sayfa", String(p));
    return qs.toString() ? `?${qs}` : "";
  };

  return (
    <div>
      <PageHeader title="Gelen Talepler" description={`${total} kayıt`} />

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
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${active ? "bg-brand-700 text-white" : "bg-paper text-ink border border-stone hover:border-brand-300"}`}
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
                    <span className="text-xs text-muted/70">{formatDateTime(l.createdAt)}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-ink">{l.name}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                    <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline"><Phone className="h-4 w-4" /> {l.phone}</a>
                    {l.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4 text-muted/70" /> {l.email}</span>}
                    <a href={`https://wa.me/${l.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-green-600 hover:underline"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Durum güncelle */}
                  <form action={updateLeadStatus} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={l.id} />
                    <select name="status" defaultValue={l.status} className="rounded-control border border-stone px-2 py-1.5 text-xs">
                      <option value="received">Alındı</option>
                      <option value="reviewing">İnceleniyor</option>
                      <option value="contacted">İletişim kuruldu</option>
                      <option value="resolved">Sonuçlandı</option>
                    </select>
                    <button className="rounded-control bg-canvas px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-stone">Kaydet</button>
                  </form>
                  {l.type === "seller" && (
                    <form action={promoteLeadToOpportunity}>
                      <input type="hidden" name="id" value={l.id} />
                      <button className="rounded-control bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">Fırsata Dönüştür</button>
                    </form>
                  )}
                  <form action={deleteLead}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="rounded-control px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50">Sil</button>
                  </form>
                </div>
              </div>

              {/* Detaylar */}
              <div className="mt-3 grid gap-x-6 gap-y-1 text-sm text-muted sm:grid-cols-2 lg:grid-cols-3">
                {l.district && <p><span className="text-muted/70">İlçe:</span> {l.district}</p>}
                {l.neighborhood && <p><span className="text-muted/70">Mahalle:</span> {l.neighborhood}</p>}
                {l.propertyType && <p><span className="text-muted/70">Mülk:</span> {PROPERTY_TYPE_LABELS[l.propertyType] || l.propertyType}</p>}
                {l.estimatedPrice && <p><span className="text-muted/70">İstenen Fiyat:</span> {l.estimatedPrice}</p>}
                {l.preferredDate && <p><span className="text-muted/70">Tercih:</span> {l.preferredDate}</p>}
                {l.lat != null && l.lng != null && (
                  <p>
                    <span className="text-muted/70">Konum:</span>{" "}
                    <a href={`https://www.google.com/maps?q=${l.lat},${l.lng}`} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">Haritada gör</a>
                  </p>
                )}
                {l.utmSource && <p><span className="text-muted/70">Kaynak:</span> {l.utmSource}</p>}
                {l.listing && (
                  <p className="lg:col-span-3">
                    <span className="text-muted/70">İlan:</span>{" "}
                    <Link href={`/ilan/${l.listing.slug}`} target="_blank" className="text-brand-700 hover:underline">{l.listing.title}</Link>
                  </p>
                )}
              </div>

              {l.message && (
                <p className="mt-3 rounded-control bg-canvas p-3 text-sm text-ink">{l.message}</p>
              )}

              {photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {photos.map((p, i) => (
                    <a key={i} href={p} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p} alt="" className="h-20 w-20 rounded-control object-cover border border-stone" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">Sayfa {page} / {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/talepler${pageQs(page - 1)}`} className="rounded-control bg-paper px-3 py-1.5 font-medium text-ink border border-stone hover:border-brand-300">‹ Önceki</Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/talepler${pageQs(page + 1)}`} className="rounded-control bg-paper px-3 py-1.5 font-medium text-ink border border-stone hover:border-brand-300">Sonraki ›</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
