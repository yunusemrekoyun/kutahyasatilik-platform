import Link from "next/link";
import { Phone, Mail, MessageCircle, ArrowLeft } from "lucide-react";
import { getAgentSession } from "@/lib/agentAuth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { LEAD_TYPE_LABELS } from "@/lib/constants";
import RequestStatusStepper from "@/components/RequestStatusStepper";
import { updateAgentLeadStatus } from "../actions";

export const dynamic = "force-dynamic";

const PER_PAGE = 50;

export default async function AgentLeads({
  searchParams,
}: {
  searchParams: Promise<{ sayfa?: string }>;
}) {
  const session = await getAgentSession();
  const page = Math.max(1, Number((await searchParams).sayfa) || 1);
  // Yalnız emlakçının kendi ilanlarına gelen talepler.
  // Sayfalama ZORUNLU: sabit take ile eski talepler emlakçıya hiç görünmezdi.
  const where = { listing: { agentId: session!.agentId } };
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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/emlakci/panel" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" /> Panele dön
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold text-ink">Gelen Talepler</h1>
        <p className="text-sm text-muted">İlanlarınıza gelen talepler ve süreç durumları. Durumu ilerlettikçe kullanıcı da görür.</p>
      </div>

      {leads.length === 0 && (
        <div className="bg-paper p-8 text-center text-sm text-muted/70 border border-stone">
          Henüz ilanlarınıza gelen bir talep yok.
        </div>
      )}

      <div className="space-y-3">
        {leads.map((l) => (
          <div key={l.id} className="bg-paper p-5 border border-stone">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{LEAD_TYPE_LABELS[l.type] || l.type}</span>
                  <span className="text-xs text-muted/70">{formatDateTime(l.createdAt)}</span>
                </div>
                <h3 className="mt-2 font-semibold text-ink">{l.name}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                  <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline"><Phone className="h-4 w-4" /> {l.phone}</a>
                  {l.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4 text-muted/70" /> {l.email}</span>}
                  <a href={`https://wa.me/${l.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-green-600 hover:underline"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                </div>
                {l.listing && (
                  <p className="mt-1 text-sm text-muted">
                    İlan: <Link href={`/ilan/${l.listing.slug}`} target="_blank" className="text-brand-700 hover:underline">{l.listing.title}</Link>
                  </p>
                )}
              </div>

              {/* Durum güncelle */}
              <form action={updateAgentLeadStatus} className="flex items-center gap-1">
                <input type="hidden" name="id" value={l.id} />
                <select name="status" defaultValue={l.status} className="rounded-lg border border-stone px-2 py-1.5 text-xs">
                  <option value="received">Alındı</option>
                  <option value="reviewing">İnceleniyor</option>
                  <option value="contacted">İletişim kuruldu</option>
                  <option value="resolved">Sonuçlandı</option>
                </select>
                <button className="rounded-lg bg-brand-800 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-900">Kaydet</button>
              </form>
            </div>

            {l.message && <p className="mt-3 rounded-lg bg-canvas p-3 text-sm text-ink">{l.message}</p>}

            <div className="mt-4 border-t border-stone pt-4">
              <RequestStatusStepper status={l.status} />
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Sayfa {page} / {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/emlakci/panel/talepler${page - 1 > 1 ? `?sayfa=${page - 1}` : ""}`} className="rounded-lg bg-paper px-3 py-1.5 font-medium text-ink border border-stone hover:border-brand-300">‹ Önceki</Link>
            )}
            {page < totalPages && (
              <Link href={`/emlakci/panel/talepler?sayfa=${page + 1}`} className="rounded-lg bg-paper px-3 py-1.5 font-medium text-ink border border-stone hover:border-brand-300">Sonraki ›</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
