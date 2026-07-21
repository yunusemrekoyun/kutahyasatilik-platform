import { parseJsonArray } from "./format";

// İlan + ilçe verisinden veri destekli bölge özeti üretir.
// Şablon + ilçe istatistiği yaklaşımı deterministiktir.

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
  investmentScore: number | null; // 0-100
  scoreLabel: string;
  growth3y: number | null; // %
  growth5y: number | null; // %
  regionText: string;
  potentialText: string;
  schools: string[];
  hospitals: string[];
}

export function buildAnalysis(
  listing: ListingForAnalysis,
  district?: DistrictForAnalysis | null
): Analysis {
  // Yatırım puanı: yalnız gerçek veri (ilan > ilçe), yoksa null
  const investmentScore = listing.investmentScore ?? district?.investmentScore ?? null;

  // Değer artışı: yalnız gerçek veri, yoksa null
  const growth3y = listing.valueGrowthPct ?? district?.valueGrowth3yPct ?? null;
  const growth5y = district?.valueGrowth5yPct ?? null;

  const scoreLabel =
    investmentScore == null
      ? ""
      : investmentScore >= 85
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

  // Gelişim potansiyeli: sayısal veri varsa sayılarla, yoksa sayısız bir metin üret.
  const potentialText =
    growth3y != null && growth5y != null
      ? `Bu bölge son 3 yılda yaklaşık %${growth3y} değer kazanmıştır ve 5 yıllık projeksiyonda ortalama %${growth5y} ` +
        `civarında bir değer artışı öngörülmektedir. ` +
        (district?.transportNote
          ? district.transportNote
          : `Bölgedeki imar gelişimi ve ulaşım projeleri nedeniyle orta-uzun vadede yatırım potansiyeli yüksektir.`)
      : district?.transportNote
      ? district.transportNote
      : `Bölgedeki konum, ulaşım imkânları ve çevredeki gelişim bu lokasyonu orta-uzun vadede yatırım açısından cazip kılmaktadır.`;

  const schools = parseJsonArray(district?.nearbySchools);
  const hospitals = parseJsonArray(district?.nearbyHospitals);

  return {
    investmentScore,
    scoreLabel,
    growth3y,
    growth5y,
    regionText,
    potentialText,
    schools,
    hospitals,
  };
}
