import Link from "next/link";
import { Phone, Mail, MessageCircle, ArrowLeft } from "lucide-react";
import { getAgentSession } from "@/lib/agentAuth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { LEAD_TYPE_LABELS } from "@/lib/constants";
import RequestStatusStepper from "@/components/RequestStatusStepper";
import { updateAgentLeadStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function AgentLeads() {
  const session = await getAgentSession();
  // Yalnız emlakçının kendi ilanlarına gelen talepler.
  const leads = await prisma.lead.findMany({
    where: { listing: { agentId: session!.agentId } },
    orderBy: { createdAt: "desc" },
    include: { listing: { select: { title: true, slug: true } } },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/emlakci/panel" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" /> Panele dön
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Gelen Talepler</h1>
        <p className="text-sm text-slate-500">İlanlarınıza gelen talepler ve süreç durumları. Durumu ilerlettikçe kullanıcı da görür.</p>
      </div>

      {leads.length === 0 && (
        <div className="rounded-lg bg-paper p-8 text-center text-sm text-slate-400 ring-1 ring-stone">
          Henüz ilanlarınıza gelen bir talep yok.
        </div>
      )}

      <div className="space-y-3">
        {leads.map((l) => (
          <div key={l.id} className="rounded-lg bg-paper p-5 ring-1 ring-stone">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{LEAD_TYPE_LABELS[l.type] || l.type}</span>
                  <span className="text-xs text-slate-400">{formatDateTime(l.createdAt)}</span>
                </div>
                <h3 className="mt-2 font-semibold text-slate-900">{l.name}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                  <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline"><Phone className="h-4 w-4" /> {l.phone}</a>
                  {l.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4 text-slate-400" /> {l.email}</span>}
                  <a href={`https://wa.me/${l.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-green-600 hover:underline"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                </div>
                {l.listing && (
                  <p className="mt-1 text-sm text-slate-500">
                    İlan: <Link href={`/ilan/${l.listing.slug}`} target="_blank" className="text-brand-700 hover:underline">{l.listing.title}</Link>
                  </p>
                )}
              </div>

              {/* Durum güncelle */}
              <form action={updateAgentLeadStatus} className="flex items-center gap-1">
                <input type="hidden" name="id" value={l.id} />
                <select name="status" defaultValue={l.status} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
                  <option value="received">Alındı</option>
                  <option value="reviewing">İnceleniyor</option>
                  <option value="contacted">İletişim kuruldu</option>
                  <option value="resolved">Sonuçlandı</option>
                </select>
                <button className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-900">Kaydet</button>
              </form>
            </div>

            {l.message && <p className="mt-3 rounded-lg bg-canvas p-3 text-sm text-slate-700">{l.message}</p>}

            <div className="mt-4 border-t border-stone pt-4">
              <RequestStatusStepper status={l.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
