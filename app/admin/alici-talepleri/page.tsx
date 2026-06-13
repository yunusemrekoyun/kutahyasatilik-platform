import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatNumber } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { countListingsForAlert } from "@/lib/matching";
import { updateAlertStatus, deleteAlert } from "../actions";

export const dynamic = "force-dynamic";

function waLink(phone: string, name: string) {
  const digits = phone.replace(/[^\d]/g, "").replace(/^0/, "90");
  const msg = encodeURIComponent(`Merhaba ${name}, Kütahya Satılık'tan ulaşıyoruz. Aradığınız kriterlere uygun ilanlarımız hakkında bilgi vermek isteriz.`);
  return `https://wa.me/${digits}?text=${msg}`;
}

function criteriaText(a: {
  propertyType: string | null; district: string | null; listingType: string | null;
  minPrice: number | null; maxPrice: number | null; minArea: number | null; rooms: string | null;
}) {
  const parts: string[] = [];
  parts.push(a.listingType === "rent" ? "Kiralık" : "Satılık");
  if (a.propertyType) parts.push(PROPERTY_TYPE_LABELS[a.propertyType] || a.propertyType);
  if (a.district) parts.push(a.district);
  if (a.rooms) parts.push(a.rooms);
  if (a.minArea) parts.push(`${a.minArea}+ m²`);
  if (a.maxPrice) parts.push(`≤ ${formatNumber(a.maxPrice)} ₺`);
  if (a.minPrice) parts.push(`≥ ${formatNumber(a.minPrice)} ₺`);
  return parts.join(" · ");
}

export default async function AdminBuyerAlerts() {
  const alerts = await prisma.buyerAlert.findMany({ orderBy: { createdAt: "desc" } });
  const counts = await Promise.all(alerts.map((a) => countListingsForAlert(a)));

  const active = alerts.filter((a) => a.status === "active").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Alıcı Talepleri</h1>
        <p className="text-sm text-slate-500">{alerts.length} talep · {active} aktif · her talep için stoktaki uygun ilan sayısı gösterilir</p>
      </div>

      {alerts.length === 0 && (
        <p className="rounded-2xl bg-white p-10 text-center text-slate-400 ring-1 ring-slate-200">
          Henüz alıcı talebi yok. /alici-talebi sayfasından gelen talepler burada listelenir.
        </p>
      )}

      <div className="space-y-3">
        {alerts.map((a, i) => (
          <div key={a.id} className={`rounded-2xl bg-white p-5 ring-1 ${counts[i] > 0 ? "ring-green-200" : "ring-slate-200"}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900">{a.name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {a.status === "active" ? "Aktif" : "Kapalı"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">📞 {a.phone}{a.email ? ` · ${a.email}` : ""}</p>
                <p className="mt-1 text-sm font-medium text-brand-700">🎯 {criteriaText(a)}</p>
                {a.note && <p className="mt-1 text-sm text-slate-500">“{a.note}”</p>}
                <p className="mt-1 text-xs text-slate-400">{formatDate(a.createdAt)}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-lg px-3 py-1.5 text-sm font-bold ${counts[i] > 0 ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-400"}`}>
                  {counts[i]} uygun ilan
                </span>
                {counts[i] > 0 && a.district && (
                  <Link href={`/ilanlar?ilce=${encodeURIComponent(a.district)}`} target="_blank" className="text-xs font-semibold text-brand-700 hover:underline">
                    Uygun ilanları gör →
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <a href={`tel:${a.phone.replace(/[^\d+]/g, "")}`} className="rounded-lg bg-brand-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-800">📞 Ara</a>
              <a href={waLink(a.phone, a.name)} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-green-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-green-700">💬 WhatsApp</a>
              <form action={updateAlertStatus}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="status" value={a.status === "active" ? "closed" : "active"} />
                <button className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                  {a.status === "active" ? "Kapat" : "Yeniden Aç"}
                </button>
              </form>
              <form action={deleteAlert} className="ml-auto">
                <input type="hidden" name="id" value={a.id} />
                <button className="rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">Sil</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
