import { NextResponse } from "next/server";
import { DISTRICTS } from "@/lib/constants";
import { getDistrictStatsObject } from "@/lib/districtStats";

export const dynamic = "force-dynamic";

// İlçe listesi + (varsa) bölge istatistikleri. Mobil değerleme/keşif için.
export async function GET() {
  let stats: Awaited<ReturnType<typeof getDistrictStatsObject>> = {};
  try {
    stats = await getDistrictStatsObject();
  } catch {
    /* District tablosu yoksa boş istatistik */
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
  }));
  return NextResponse.json({ ok: true, items });
}
