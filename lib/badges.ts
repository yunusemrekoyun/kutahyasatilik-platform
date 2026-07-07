// İlan kartlarında gösterilen "dürüst sosyal kanıt" rozetlerini üretir.
// Tamamen mevcut veriden (fiyat, ilçe ortalaması, görüntülenme, ilan yaşı) hesaplanır.
// Uydurma sayı yok: rozet ancak gerçek veri eşiği aşılırsa gösterilir.

export type BadgeTone = "deal" | "hot" | "new";

export interface Badge {
  icon: string;
  text: string;
  tone: BadgeTone;
}

export interface BadgeInput {
  price: number;
  propertyType: string;
  areaGross?: number | null;
  createdAt: Date | string;
  recentViews?: number; // son 7 gün
  avgPriceDaire?: number | null;
  avgPriceArsaM2?: number | null;
}

const DEAL_THRESHOLD = 0.08; // bölge ortalamasının en az %8 altı
const HOT_THRESHOLD = 8; // son 7 günde en az 8 görüntülenme
const NEW_MAX_DAYS = 10;

const LAND_TYPES = new Set(["arsa", "tarla"]);

export function computeBadges(input: BadgeInput): Badge[] {
  const badges: Badge[] = [];
  const isLand = LAND_TYPES.has(input.propertyType);

  // 1) Fırsat rozeti — bölge ortalamasının belirgin altında mı?
  let belowPct = 0;
  if (isLand && input.avgPriceArsaM2 && input.areaGross && input.areaGross > 0) {
    const m2price = input.price / input.areaGross;
    belowPct = (input.avgPriceArsaM2 - m2price) / input.avgPriceArsaM2;
  } else if (input.propertyType === "daire" && input.avgPriceDaire) {
    belowPct = (input.avgPriceDaire - input.price) / input.avgPriceDaire;
  }
  if (belowPct >= DEAL_THRESHOLD) {
    badges.push({
      icon: "gem",
      text: `Bölge ort. %${Math.round(belowPct * 100)} altında`,
      tone: "deal",
    });
  }

  // 2) İlgi rozeti — son 7 günde gerçekten çok görüntülendiyse
  if (input.recentViews && input.recentViews >= HOT_THRESHOLD) {
    badges.push({
      icon: "flame",
      text: `Bu hafta ${input.recentViews} kişi inceledi`,
      tone: "hot",
    });
  }

  // 3) Yeni rozeti
  const created =
    typeof input.createdAt === "string" ? new Date(input.createdAt) : input.createdAt;
  const ageDays = (Date.now() - created.getTime()) / 86_400_000;
  if (ageDays >= 0 && ageDays <= NEW_MAX_DAYS) {
    badges.push({ icon: "sparkles", text: "Yeni", tone: "new" });
  }

  return badges;
}
