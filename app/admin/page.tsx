import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatNumber, formatDateTime } from "@/lib/format";
import { LEAD_TYPE_LABELS } from "@/lib/constants";
import { getAnalyticsStats } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // Ağır analitik sayımlar cache'li (5 dk, özet+ham); ucuz sorgular taze.
  const [analytics, totalLeads, newLeads, activeListings, soldListings, topListings, leadsByListing, recentLeads] =
    await Promise.all([
      getAnalyticsStats(),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "new" } }),
      prisma.listing.count({ where: { status: "active" } }),
      prisma.listing.count({ where: { status: "sold" } }),
      prisma.listing.findMany({
        orderBy: { viewCount: "desc" },
        take: 6,
        select: { id: true, slug: true, title: true, viewCount: true },
      }),
      prisma.lead.groupBy({
        by: ["listingId"],
        where: { listingId: { not: null } },
        _count: { listingId: true },
        orderBy: { _count: { listingId: "desc" } },
        take: 6,
      }),
      prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    ]);

  const listingIds = leadsByListing.map((l) => l.listingId!).filter(Boolean);
  const listingMap = new Map(
    (await prisma.listing.findMany({ where: { id: { in: listingIds } }, select: { id: true, title: true, slug: true } }))
      .map((l) => [l.id, l])
  );

  const stats = [
    { label: "İlan Görüntülenme", value: analytics.views, icon: "👁️", color: "text-brand-700" },
    { label: "Telefon Tıklama", value: analytics.phoneClicks, icon: "📞", color: "text-green-600" },
    { label: "WhatsApp Tıklama", value: analytics.whatsappClicks, icon: "💬", color: "text-green-600" },
    { label: "Toplam Dönüşüm", value: analytics.conversions, icon: "🎯", color: "text-gold-600" },
    { label: "Toplam Talep", value: totalLeads, icon: "📬", color: "text-brand-700" },
    { label: "Yeni Talep", value: newLeads, icon: "🆕", color: "text-red-600" },
    { label: "Aktif İlan", value: activeListings, icon: "🏠", color: "text-slate-700" },
    { label: "Satılan", value: soldListings, icon: "✅", color: "text-slate-700" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">Panel</h1>
        <Link href="/admin/ilanlar/yeni" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-800">
          + Yeni İlan
        </Link>
      </div>

      {/* İstatistik kartları */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{s.icon}</span>
            </div>
            <p className={`mt-3 text-3xl font-black ${s.color}`}>{formatNumber(s.value)}</p>
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* En çok görüntülenen ilçeler */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h2 className="font-bold text-slate-900">En Çok Görüntülenen İlçeler</h2>
          <div className="mt-4 space-y-3">
            {analytics.districtViews.length === 0 && <p className="text-sm text-slate-400">Henüz veri yok.</p>}
            {analytics.districtViews.map((d) => {
              const max = analytics.districtViews[0].count || 1;
              const pct = Math.round((d.count / max) * 100);
              return (
                <div key={d.district}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{d.district}</span>
                    <span className="text-slate-500">{d.count}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* En çok görüntülenen ilanlar */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h2 className="font-bold text-slate-900">En Çok Görüntülenen İlanlar</h2>
          <div className="mt-4 space-y-2">
            {topListings.length === 0 && <p className="text-sm text-slate-400">Henüz veri yok.</p>}
            {topListings.map((l) => (
              <Link key={l.id} href={`/ilan/${l.slug}`} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50">
                <span className="line-clamp-1 text-sm text-slate-700">{l.title}</span>
                <span className="ml-2 shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                  👁️ {l.viewCount}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* En çok talep alan ilanlar */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h2 className="font-bold text-slate-900">En Çok Talep Alan İlanlar</h2>
          <div className="mt-4 space-y-2">
            {leadsByListing.length === 0 && <p className="text-sm text-slate-400">Henüz talep yok.</p>}
            {leadsByListing.map((l) => {
              const listing = listingMap.get(l.listingId!);
              if (!listing) return null;
              return (
                <Link key={l.listingId} href={`/ilan/${listing.slug}`} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50">
                  <span className="line-clamp-1 text-sm text-slate-700">{listing.title}</span>
                  <span className="ml-2 shrink-0 rounded-full bg-gold-50 px-2.5 py-0.5 text-xs font-semibold text-gold-600">
                    📬 {l._count.listingId}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Dönüşüm kaynakları */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h2 className="font-bold text-slate-900">Dönüşüm Kaynakları (Son 30 Gün)</h2>
          <p className="text-xs text-slate-400">Google Ads dönüşüm takibi (utm_source / gclid)</p>
          <div className="mt-4 space-y-2">
            {analytics.bySource.length === 0 && <p className="text-sm text-slate-400">Henüz dönüşüm verisi yok.</p>}
            {analytics.bySource.map((s) => (
              <div key={s.source} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-sm font-medium text-slate-700">{s.source}</span>
                <span className="text-sm font-bold text-brand-700">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Son talepler */}
      <div className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Son Gelen Talepler</h2>
          <Link href="/admin/talepler" className="text-sm font-semibold text-brand-700 hover:underline">Tümü →</Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="py-2 pr-4">Tarih</th>
                <th className="py-2 pr-4">Tip</th>
                <th className="py-2 pr-4">Ad</th>
                <th className="py-2 pr-4">Telefon</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-slate-400">Henüz talep yok.</td></tr>
              )}
              {recentLeads.map((l) => (
                <tr key={l.id} className="border-b border-slate-50">
                  <td className="py-2.5 pr-4 text-slate-500 whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
                  <td className="py-2.5 pr-4"><span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{LEAD_TYPE_LABELS[l.type] || l.type}</span></td>
                  <td className="py-2.5 pr-4 font-medium text-slate-800">{l.name}</td>
                  <td className="py-2.5 pr-4"><a href={`tel:${l.phone}`} className="text-brand-700 hover:underline">{l.phone}</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
