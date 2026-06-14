import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

// Dashboard'un AĞIR analitik sayımlarını request'ler arası cache'ler (5 dk).
// Ömür-boyu toplam = AnalyticsDaily (özet/arşiv) + son 90 gün ham AnalyticsEvent.
// Böylece event tablosu budanmış olsa bile tarihsel toplam korunur ve dashboard
// her açılışta milyonlarca satır taramaz.

export const CONVERSION_TYPES = ["seller_lead", "appointment", "expertise", "price_offer", "conversion"];

async function lifetimeCount(types: string[]): Promise<number> {
  const [agg, raw] = await Promise.all([
    prisma.analyticsDaily.aggregate({ _sum: { count: true }, where: { type: { in: types } } }),
    prisma.analyticsEvent.count({ where: { type: { in: types } } }),
  ]);
  return (agg._sum.count ?? 0) + raw;
}

export type AnalyticsStats = {
  views: number;
  phoneClicks: number;
  whatsappClicks: number;
  conversions: number;
  districtViews: { district: string; count: number }[];
  bySource: { source: string; count: number }[];
};

export const getAnalyticsStats = unstable_cache(
  async (): Promise<AnalyticsStats> => {
    const since30 = new Date(Date.now() - 30 * 86_400_000);

    const [views, phoneClicks, whatsappClicks, conversions] = await Promise.all([
      lifetimeCount(["view"]),
      lifetimeCount(["phone_click"]),
      lifetimeCount(["whatsapp_click"]),
      lifetimeCount(CONVERSION_TYPES),
    ]);

    // İlçe görüntülenmeleri: özet + son 90 gün ham birleştirilir.
    const [dailyD, rawD] = await Promise.all([
      prisma.analyticsDaily.groupBy({
        by: ["district"],
        where: { type: "view", NOT: { district: "" } },
        _sum: { count: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["district"],
        where: { type: "view", district: { not: null } },
        _count: { district: true },
      }),
    ]);
    const dMap = new Map<string, number>();
    for (const r of dailyD) if (r.district) dMap.set(r.district, (dMap.get(r.district) ?? 0) + (r._sum.count ?? 0));
    for (const r of rawD) if (r.district) dMap.set(r.district, (dMap.get(r.district) ?? 0) + (r._count.district ?? 0));
    const districtViews = [...dMap.entries()]
      .map(([district, count]) => ({ district, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Dönüşüm kaynakları (son 30 gün — daima 90 günlük ham içinde).
    const sourceRows = await prisma.analyticsEvent.groupBy({
      by: ["utmSource"],
      where: { type: { in: CONVERSION_TYPES }, createdAt: { gte: since30 } },
      _count: { utmSource: true },
      orderBy: { _count: { utmSource: "desc" } },
      take: 6,
    });
    const bySource = sourceRows.map((s) => ({ source: s.utmSource || "Doğrudan / Organik", count: s._count.utmSource }));

    return { views, phoneClicks, whatsappClicks, conversions, districtViews, bySource };
  },
  ["dashboard-analytics"],
  { revalidate: 300 }
);
