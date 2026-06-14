import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

// İlçe bazlı ortalama/istatistik verisi — hem ilan rozetlerini (badges)
// hem de değerleme aracını (valuation) besler.
// İlçe verisi nadiren değişir → request'ler arası cache'lenir (revalidate 10 dk).
// React cache() ise aynı request içinde Map'i bir kez kurar.

export type DistrictStat = {
  avgPriceDaire: number | null;
  avgPriceArsaM2: number | null;
  investmentScore: number | null;
  valueGrowth3yPct: number | null;
};

type DistrictRow = { name: string } & DistrictStat;

const fetchDistrictRows = unstable_cache(
  async (): Promise<DistrictRow[]> =>
    prisma.district.findMany({
      select: {
        name: true,
        avgPriceDaire: true,
        avgPriceArsaM2: true,
        investmentScore: true,
        valueGrowth3yPct: true,
      },
    }),
  ["district-stats"],
  { revalidate: 600 }
);

export const getDistrictStats = cache(async (): Promise<Map<string, DistrictStat>> => {
  const rows = await fetchDistrictRows();
  return new Map(
    rows.map((r) => [
      r.name,
      {
        avgPriceDaire: r.avgPriceDaire,
        avgPriceArsaM2: r.avgPriceArsaM2,
        investmentScore: r.investmentScore,
        valueGrowth3yPct: r.valueGrowth3yPct,
      },
    ])
  );
});

// Client bileşenlerine geçirmek için serileştirilebilir hali.
export async function getDistrictStatsObject(): Promise<Record<string, DistrictStat>> {
  const map = await getDistrictStats();
  return Object.fromEntries(map);
}
