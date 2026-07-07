import Link from "next/link";
import { Star, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createOpportunity, selectWinningBid, closeOpportunity } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";
import { DISTRICTS, PROPERTY_TYPES } from "@/lib/constants";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

const OPP_STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: "Açık (teklif toplanıyor)", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  selecting: { label: "Seçim", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  awarded: { label: "Kazanan seçildi", cls: "bg-teal-50 text-teal-700 ring-teal-200" },
  listed: { label: "İlana dönüştü", cls: "bg-green-50 text-green-700 ring-green-200" },
  closed: { label: "Kapatıldı", cls: "bg-slate-100 text-slate-500 ring-slate-200" },
};

type BidRow = { id: string; commissionPct: number; note: string | null; status: string; agent: { name: string } | null };
type Opp = {
  id: string; title: string; description: string | null; district: string | null;
  propertyType: string | null; estimatedPrice: number | null; areaGross: number | null; rooms: string | null;
  status: string; listingId: string | null; biddingEndsAt: Date | null; bids: BidRow[];
};

export default async function AdminFirsatlarPage() {
  let opps: Opp[] = [];
  try {
    opps = await prisma.portfolioOpportunity.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { bids: { orderBy: { commissionPct: "asc" }, include: { agent: { select: { name: true } } } } },
    });
  } catch {
    /* tablo henüz yoksa */
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Portföy Fırsatları</h1>
        <p className="mt-1 text-sm text-slate-500">
          Mülk sahibi talebi → fırsat → emlakçılar komisyon teklifi verir → kazananı seç → ilan otomatik oluşur (kazanan emlakçıya, onay bekler).
        </p>
      </div>

      {/* Yeni fırsat */}
      <section className="mb-6 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="font-bold text-slate-900">Yeni fırsat</h2>
        <form action={createOpportunity} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input name="title" required placeholder="Başlık (örn. 3+1 Daire · Merkez)" className={`${inputCls} sm:col-span-2`} />
          <textarea name="description" rows={2} placeholder="Açıklama (opsiyonel)" className={`${inputCls} sm:col-span-2`} />
          <select name="district" defaultValue="" className={inputCls}>
            <option value="">İlçe (ops.)</option>
            {DISTRICTS.map((d) => <option key={d.slug} value={d.name}>{d.name}</option>)}
          </select>
          <select name="propertyType" defaultValue="" className={inputCls}>
            <option value="">Tür (ops.)</option>
            {PROPERTY_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <input name="estimatedPrice" type="number" min={0} placeholder="Tahmini fiyat ₺" className={inputCls} />
          <input name="areaGross" type="number" min={0} placeholder="m²" className={inputCls} />
          <input name="rooms" placeholder="Oda (3+1)" className={inputCls} />
          <input name="biddingDays" type="number" min={1} defaultValue={7} placeholder="Teklif süresi (gün)" className={inputCls} />
          <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 sm:col-span-2">
            Fırsat Oluştur
          </button>
        </form>
      </section>

      {opps.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 ring-1 ring-slate-200">Henüz fırsat yok.</div>
      ) : (
        <div className="space-y-4">
          {opps.map((o) => {
            const s = OPP_STATUS[o.status] ?? OPP_STATUS.open;
            const canSelect = o.status === "open" || o.status === "selecting";
            return (
              <div key={o.id} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{o.title}</p>
                    <p className="text-sm text-slate-500">
                      {[o.district, o.rooms, o.areaGross ? `${o.areaGross} m²` : null, o.estimatedPrice ? formatPrice(o.estimatedPrice, "TRY") : null].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${s.cls}`}>{s.label}</span>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Teklifler ({o.bids.length}) — düşük komisyon üstte</p>
                  {o.bids.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-400">Henüz teklif yok.</p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {o.bids.map((b, idx) => (
                        <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                          <span className="flex items-center gap-2">
                            {idx === 0 && canSelect && <Star className="h-4 w-4 fill-current text-amber-500" />}
                            <span className="font-medium text-slate-800">{b.agent?.name ?? "—"}</span>
                            <span className="rounded bg-white px-2 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-slate-200">%{b.commissionPct.toFixed(1)} komisyon</span>
                            {b.status === "won" && <span className="text-xs font-semibold text-green-600">Kazandı</span>}
                            {b.note && <span className="text-xs text-slate-400">— {b.note}</span>}
                          </span>
                          {canSelect && (
                            <form action={selectWinningBid}>
                              <input type="hidden" name="opportunityId" value={o.id} />
                              <input type="hidden" name="bidId" value={b.id} />
                              <button type="submit" className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700">Kazanan Seç</button>
                            </form>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-4">
                  {o.listingId && (
                    <Link href={`/admin/ilanlar/${o.listingId}`} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                      Oluşan ilanı düzenle <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                  {canSelect && (
                    <form action={closeOpportunity}>
                      <input type="hidden" name="id" value={o.id} />
                      <button type="submit" className="text-xs font-medium text-slate-400 hover:text-red-600">Kapat</button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
