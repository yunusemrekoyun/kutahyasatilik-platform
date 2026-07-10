import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DISTRICTS } from "@/lib/constants";
import { getDistrictStatsObject } from "@/lib/districtStats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mobil bölge analizi — web /(site)/bolge-analizi paritesi. İlçe m² fiyatı, değer artışı,
// yatırım puanı + aktif ilan sayısı. Admin "analysis_scores" toggle'ı KAPALIYSA puanlar gizlenir.
export async function GET() {
  let stats: Awaited<ReturnType<typeof getDistrictStatsObject>> = {};
  try {
    stats = await getDistrictStatsObject();
  } catch {
    /* District tablosu yoksa boş */
  }

  let showScores = true;
  let countMap = new Map<string, number>();
  try {
    const [scoresSetting, counts] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "analysis_scores" } }),
      prisma.listing.groupBy({
        by: ["district"],
        where: { status: "active", moderationStatus: "approved" },
        _count: { _all: true },
      }),
    ]);
    showScores = scoresSetting?.value !== "0";
    countMap = new Map(counts.map((c) => [c.district, c._count._all]));
  } catch {
    /* db yoksa varsayılan */
  }

  const items = DISTRICTS.map((d) => ({
    name: d.name,
    slug: d.slug,
    lat: d.lat,
    lng: d.lng,
    avgPriceDaire: stats[d.name]?.avgPriceDaire ?? null,
    avgPriceArsaM2: stats[d.name]?.avgPriceArsaM2 ?? null,
    investmentScore: stats[d.name]?.investmentScore ?? null,
    valueGrowth3yPct: stats[d.name]?.valueGrowth3yPct ?? null,
    count: countMap.get(d.name) ?? 0,
  }));
  // Yatırım puanına göre sıralı (web ile aynı).
  items.sort((a, b) => (b.investmentScore ?? 0) - (a.investmentScore ?? 0));

  return NextResponse.json({ ok: true, showScores, items });
}
