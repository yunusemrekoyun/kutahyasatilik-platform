import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/format";
import TrackView from "@/components/TrackView";
import PriceHeatmap from "@/components/PriceHeatmap";
import DistrictCompare, { type DistrictStat } from "@/components/DistrictCompare";
import { PageIntro } from "@/components/ui/Editorial";

export const revalidate = 300; // ISR: her 5 dakikada yenilenir (CDN cache + admin revalidatePath)

export const metadata: Metadata = {
  title: "Kütahya Bölge Fiyat Analizi & Isı Haritası",
  description:
    "Kütahya ilçelerinin m² fiyatları, değer artışı ve yatırım puanları. İlçe karşılaştırma aracı ve fiyat ısı haritasıyla doğru bölgeyi seçin.",
  alternates: { canonical: "/bolge-analizi" },
};

export default async function RegionAnalysis() {
  const [districts, counts, scoresSetting] = await Promise.all([
    prisma.district.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.listing.groupBy({
      by: ["district"],
      where: { status: "active", moderationStatus: "approved" },
      _count: { _all: true },
    }),
    prisma.setting.findUnique({ where: { key: "analysis_scores" } }),
  ]);

  // Admin "Bölge analizi puanlarını göster" toggle'ı — kapalıysa puan/artış/m² gizli.
  const showScores = scoresSetting?.value !== "0";
  const countMap = new Map(counts.map((c) => [c.district, c._count._all]));

  const stats: DistrictStat[] = districts.map((d) => ({
    name: d.name,
    avgPriceDaire: d.avgPriceDaire,
    avgPriceArsaM2: d.avgPriceArsaM2,
    valueGrowth3yPct: d.valueGrowth3yPct,
    valueGrowth5yPct: d.valueGrowth5yPct,
    investmentScore: d.investmentScore,
    count: countMap.get(d.name) ?? 0,
  }));

  const heatPoints = districts
    .filter((d) => d.lat != null && d.lng != null)
    .map((d) => ({
      name: d.name,
      lat: d.lat as number,
      lng: d.lng as number,
      avgPriceArsaM2: d.avgPriceArsaM2,
      avgPriceDaire: d.avgPriceDaire,
      count: countMap.get(d.name) ?? 0,
    }));

  // Yatırım puanına göre sıralı liste
  const ranked = [...stats].sort((a, b) => (b.investmentScore ?? 0) - (a.investmentScore ?? 0));

  return (
    <div>
      <TrackView />

      <PageIntro eyebrow="Yerel piyasa verileri" title="Kütahya bölge fiyat analizi" intro="İlçelerin m² fiyatlarını, değer artışlarını ve yatırım puanlarını karşılaştırarak doğru bölgeyi verilerle değerlendirin." />

      {/* Analiz görselleri — admin puan toggle'ı açıksa */}
      {showScores && (<>
      {/* Isı haritası */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-lg bg-paper p-5 ring-1 ring-stone sm:p-7">
          <h2 className="font-display text-2xl font-bold text-brand-900">Fiyat Isı Haritası</h2>
          <p className="mt-1 text-sm text-slate-600">
            Arsa m² fiyatına göre renklendirilmiştir — <span className="font-semibold text-green-600">yeşil: uygun</span>, <span className="font-semibold text-red-600">kırmızı: yüksek</span>. Marker üzerine gelin.
          </p>
          <div className="mt-5">
            <PriceHeatmap points={heatPoints} />
          </div>
        </div>
      </section>

      {/* Karşılaştırma */}
      <section className="mx-auto max-w-3xl px-4 pb-10">
        <h2 className="font-display text-2xl font-bold text-brand-900">İlçe Karşılaştır</h2>
        <p className="mt-1 mb-4 text-sm text-slate-600">İki ilçeyi yan yana karşılaştırın; her satırda avantajlı olan yeşil gösterilir.</p>
        <DistrictCompare districts={stats} />
      </section>
      </>)}

      {/* Sıralı liste */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="font-display text-2xl font-bold text-brand-900">Yatırım Puanına Göre İlçeler</h2>
        <div className="mt-5 overflow-hidden rounded-lg bg-paper ring-1 ring-stone">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                  <th className="p-3">İlçe</th>
                  {showScores && (<>
                  <th className="p-3 text-right">Yatırım Puanı</th>
                  <th className="p-3 text-right">3 Yıl Artış</th>
                  <th className="p-3 text-right">Arsa m²</th>
                  <th className="p-3 text-right">Ort. Daire</th>
                  </>)}
                  <th className="p-3 text-center">İlan</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((d) => (
                  <tr key={d.name} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">{d.name}</td>
                    {showScores && (<>
                    <td className="p-3 text-right">
                      {d.investmentScore != null ? (
                        <span className="rounded-md bg-brand-50 px-2 py-0.5 font-bold text-brand-700">{d.investmentScore}/100</span>
                      ) : "—"}
                    </td>
                    <td className="p-3 text-right text-green-600 font-medium">{d.valueGrowth3yPct != null ? `%${d.valueGrowth3yPct}` : "—"}</td>
                    <td className="p-3 text-right text-slate-700">{d.avgPriceArsaM2 != null ? `${formatNumber(d.avgPriceArsaM2)} ₺` : "—"}</td>
                    <td className="p-3 text-right text-slate-700">{d.avgPriceDaire != null ? `${formatNumber(d.avgPriceDaire)} ₺` : "—"}</td>
                    </>)}
                    <td className="p-3 text-center text-slate-600">{d.count}</td>
                    <td className="p-3 text-right">
                      <Link href={`/ilanlar?ilce=${encodeURIComponent(d.name)}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">İlanlar <ArrowRight className="h-4 w-4" /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
