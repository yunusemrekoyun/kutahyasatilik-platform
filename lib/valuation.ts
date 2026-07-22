import type { DistrictStat } from "./districtStats";

// "Evimin Değeri" aracının deterministik tahmin motoru.
// İlçe ortalamalarından (avgPriceDaire / avgPriceArsaM2) bir aralık üretir.
// Harici servis gerektirmeden, server/client uyumlu çalışır (Math.random yok).

export interface ValuationInput {
  propertyType: string; // daire | villa | mustakil | isyeri | arsa | tarla
  district: string;
  area: number; // m²
  rooms?: string; // "3+1" gibi (opsiyonel, konut için küçük etki)
}

export interface ValuationResult {
  low: number;
  mid: number;
  high: number;
  perM2: number;
  basis: "housing" | "land";
}

const LAND_TYPES = new Set(["arsa", "tarla"]);

// avgPriceDaire ortalama bir dairenin TOPLAM fiyatı kabul edilir.
// Bu referans büyüklüğe bölerek m² taban fiyatı türetiriz.
const HOUSING_REF_AREA = 110;

// Mülk türüne göre m² çarpanı (villa/müstakil farkı).
const TYPE_MULT: Record<string, number> = {
  daire: 1,
  villa: 1.18,
  mustakil: 0.95,
  isyeri: 1.1,
};

// Oda sayısının küçük etkisi (büyük daireler m² başına biraz daha ucuz olur).
function roomFactor(rooms?: string): number {
  if (!rooms) return 1;
  const main = parseInt(rooms, 10);
  if (Number.isNaN(main)) return 1;
  if (main <= 1) return 1.05;
  if (main >= 4) return 0.96;
  return 1;
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

export function estimateValue(
  input: ValuationInput,
  stat: DistrictStat | null | undefined,
  fallback?: DistrictStat | null
): ValuationResult | null {
  const area = Number(input.area);
  if (!area || area <= 0) return null;

  const isLand = LAND_TYPES.has(input.propertyType);

  if (isLand) {
    const m2 = stat?.avgPriceArsaM2 ?? fallback?.avgPriceArsaM2;
    if (!m2) return null;
    const mid = m2 * area;
    return {
      perM2: m2,
      mid: roundTo(mid, 5_000),
      low: roundTo(mid * 0.85, 5_000),
      high: roundTo(mid * 1.15, 5_000),
      basis: "land",
    };
  }

  // Konut (daire / villa / müstakil / işyeri)
  const avgDaire = stat?.avgPriceDaire ?? fallback?.avgPriceDaire;
  if (!avgDaire) return null;
  const baseM2 = avgDaire / HOUSING_REF_AREA;
  const mult = TYPE_MULT[input.propertyType] ?? 1;
  const perM2 = baseM2 * mult * roomFactor(input.rooms);
  const mid = perM2 * area;
  return {
    perM2: Math.round(perM2),
    mid: roundTo(mid, 10_000),
    low: roundTo(mid * 0.88, 10_000),
    high: roundTo(mid * 1.12, 10_000),
    basis: "housing",
  };
}
