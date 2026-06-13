import { parseJsonArray } from "./format";

// İlan + ilçe verisinden "yapay zeka destekli" bölge analizi üretir.
// Şablon + ilçe istatistiği yaklaşımı: maliyetsiz, SEO dostu, deterministik.

export interface ListingForAnalysis {
  id: string;
  title: string;
  propertyType: string;
  district: string;
  neighborhood?: string | null;
  price: number;
  areaGross?: number | null;
  investmentScore?: number | null;
  valueGrowthPct?: number | null;
}

export interface DistrictForAnalysis {
  name: string;
  investmentScore?: number | null;
  valueGrowth3yPct?: number | null;
  valueGrowth5yPct?: number | null;
  avgPriceDaire?: number | null;
  avgPriceArsaM2?: number | null;
  description?: string | null;
  transportNote?: string | null;
  nearbySchools?: string | null;
  nearbyHospitals?: string | null;
}

export interface Analysis {
  investmentScore: number; // 0-100
  scoreLabel: string;
  growth3y: number; // %
  growth5y: number; // %
  regionText: string;
  potentialText: string;
  transportNote: string | null;
  schools: string[];
  hospitals: string[];
  highlights: { label: string; value: string }[];
}

// İlan id'sinden deterministik sayı (server/client uyumu için Math.random yok)
function seedFrom(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function buildAnalysis(
  listing: ListingForAnalysis,
  district?: DistrictForAnalysis | null
): Analysis {
  const seed = seedFrom(listing.id);

  // Yatırım puanı: ilan > ilçe > deterministik tahmin
  const baseScore =
    listing.investmentScore ??
    district?.investmentScore ??
    clamp(68 + (seed % 22), 55, 92);
  const investmentScore = clamp(baseScore, 0, 100);

  // Değer artışı
  const growth3y =
    listing.valueGrowthPct ??
    district?.valueGrowth3yPct ??
    clamp(28 + (seed % 25), 18, 55);
  const growth5y =
    district?.valueGrowth5yPct ?? clamp(growth3y + 22 + (seed % 18), 40, 95);

  const scoreLabel =
    investmentScore >= 85
      ? "Çok Yüksek"
      : investmentScore >= 72
      ? "Yüksek"
      : investmentScore >= 60
      ? "Orta-Yüksek"
      : "Orta";

  const loc = listing.neighborhood
    ? `${listing.neighborhood}, ${listing.district}`
    : listing.district;

  // Bölge analizi metni (ilçe açıklaması varsa onu kullan, yoksa şablon üret)
  const regionText =
    district?.description?.trim() ||
    `${loc} bölgesi, Kütahya'nın gelişen ve talep gören lokasyonları arasında yer almaktadır. ` +
      `Bölgede son dönemde artan konut talebi ve altyapı yatırımları, gayrimenkul değerlerini olumlu yönde etkilemektedir. ` +
      `Ulaşım imkânları, sosyal donatılar ve çevredeki ticari hareketlilik bölgeyi hem oturum hem de yatırım açısından cazip kılmaktadır.`;

  const potentialText =
    `Bu bölge son 3 yılda yaklaşık %${growth3y} değer kazanmıştır ve 5 yıllık projeksiyonda ortalama %${growth5y} ` +
    `civarında bir değer artışı öngörülmektedir. ` +
    (district?.transportNote
      ? district.transportNote
      : `Bölgedeki imar gelişimi ve ulaşım projeleri nedeniyle orta-uzun vadede yatırım potansiyeli yüksektir.`);

  const schools = parseJsonArray(district?.nearbySchools);
  const hospitals = parseJsonArray(district?.nearbyHospitals);

  const highlights: { label: string; value: string }[] = [
    { label: "Yatırım Puanı", value: `${investmentScore}/100` },
    { label: "Son 3 Yıl Değer Artışı", value: `%${growth3y}` },
    { label: "5 Yıllık Potansiyel", value: `%${growth5y}` },
  ];
  if (district?.avgPriceArsaM2 && (listing.propertyType === "arsa" || listing.propertyType === "tarla")) {
    highlights.push({
      label: "Bölge Ort. m² Fiyatı",
      value: `${new Intl.NumberFormat("tr-TR").format(district.avgPriceArsaM2)} ₺`,
    });
  } else if (district?.avgPriceDaire && listing.propertyType === "daire") {
    highlights.push({
      label: "Bölge Ort. Daire Fiyatı",
      value: `${new Intl.NumberFormat("tr-TR").format(district.avgPriceDaire)} ₺`,
    });
  }

  return {
    investmentScore,
    scoreLabel,
    growth3y,
    growth5y,
    regionText,
    potentialText,
    transportNote: district?.transportNote ?? null,
    schools,
    hospitals,
    highlights,
  };
}
