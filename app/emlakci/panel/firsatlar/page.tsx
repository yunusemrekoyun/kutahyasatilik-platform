import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAgentSession } from "@/lib/agentAuth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { submitBid } from "../actions";

export const dynamic = "force-dynamic";

type Opp = {
  id: string; title: string; description: string | null; district: string | null;
  propertyType: string | null; estimatedPrice: number | null; areaGross: number | null; rooms: string | null;
  biddingEndsAt: Date | null;
  bids: { commissionPct: number; note: string | null }[];
};

export default async function AgentOpportunitiesPage() {
  const session = await getAgentSession();
  const agentId = session!.agentId;

  let opps: Opp[] = [];
  try {
    opps = await prisma.portfolioOpportunity.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { bids: { where: { agentId }, select: { commissionPct: true, note: true } } },
    });
  } catch {
    /* tablo henüz yoksa */
  }

  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Portföy Fırsatları</h1>
          <p className="text-sm text-slate-500">Komisyon teklifinizi verin. En uygun teklif kazanır; kazanırsanız ilan size atanır.</p>
        </div>
        <Link href="/emlakci/panel" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline"><ArrowLeft className="h-4 w-4" />Panel</Link>
      </div>

      {opps.length === 0 ? (
        <div className="rounded-lg bg-paper p-10 text-center text-sm text-slate-500 ring-1 ring-stone">
          Şu an açık portföy fırsatı yok.
        </div>
      ) : (
        <div className="space-y-4">
          {opps.map((o) => {
            const myBid = o.bids[0];
            return (
              <div key={o.id} className="rounded-lg bg-paper p-5 ring-1 ring-stone">
                <p className="font-semibold text-slate-900">{o.title}</p>
                <p className="text-sm text-slate-500">
                  {[
                    o.district,
                    o.propertyType ? PROPERTY_TYPE_LABELS[o.propertyType] || o.propertyType : null,
                    o.rooms,
                    o.areaGross ? `${o.areaGross} m²` : null,
                    o.estimatedPrice ? `~${formatPrice(o.estimatedPrice, "TRY")}` : null,
                  ].filter(Boolean).join(" · ")}
                </p>
                {o.biddingEndsAt && (
                  <p className="mt-1 text-xs font-medium text-amber-600">
                    Son teklif: {new Date(o.biddingEndsAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
                {o.description && <p className="mt-2 text-sm text-slate-600">{o.description}</p>}

                {myBid && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                    Mevcut teklifiniz: %{myBid.commissionPct.toFixed(1)}
                  </p>
                )}

                <form action={submitBid} className="mt-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="opportunityId" value={o.id} />
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Komisyon (%)</span>
                    <input name="commissionPct" type="number" step="0.1" min={0} max={100} required defaultValue={myBid?.commissionPct ?? ""} placeholder="2.5" className={`${inputCls} w-28`} />
                  </label>
                  <label className="block flex-1">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Not (opsiyonel)</span>
                    <input name="note" defaultValue={myBid?.note ?? ""} placeholder="Kısa not" className={inputCls} />
                  </label>
                  <button type="submit" className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-bold text-brand-950 hover:bg-gold-400">
                    {myBid ? "Teklifi Güncelle" : "Teklif Ver"}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
