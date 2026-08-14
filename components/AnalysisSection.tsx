import { LineChart, TrendingUp, GraduationCap, Stethoscope } from "lucide-react";
import type { Analysis } from "@/lib/analysis";

export default function AnalysisSection({
  analysis,
  showScores,
}: {
  analysis: Analysis;
  showScores: boolean;
}) {
  const score = analysis.investmentScore;
  const scoresVisible = showScores && score != null;
  const scoreColor =
    score != null && score >= 85
      ? "text-green-600"
      : score != null && score >= 70
      ? "text-brand-600"
      : "text-amber-600";

  return (
    <section className="rounded-control bg-paper p-6 ring-1 ring-stone">
      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-control bg-brand-50 text-brand-700">
          <LineChart className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-ink">Veri Destekli Bölge Analizi</h2>
          <p className="text-xs text-muted">Konum, talep ve gelişim verilerine dayalı otomatik değerlendirme</p>
        </div>
      </div>

      {scoresVisible && (
        <>
          {/* Skor kartları */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-control bg-canvas p-4 text-center">
              <div className={`text-3xl font-black ${scoreColor}`}>{score}</div>
              <div className="text-[11px] font-medium text-muted">Yatırım Puanı /100</div>
              <div className="mt-1 text-xs font-semibold text-ink">{analysis.scoreLabel}</div>
            </div>
            <div className="rounded-control bg-canvas p-4 text-center">
              <div className="text-3xl font-black text-green-600">{analysis.growth3y != null ? `%${analysis.growth3y}` : "—"}</div>
              <div className="text-[11px] font-medium text-muted">Son 3 Yıl Değer Artışı</div>
            </div>
            <div className="rounded-control bg-canvas p-4 text-center">
              <div className="text-3xl font-black text-brand-600">{analysis.growth5y != null ? `%${analysis.growth5y}` : "—"}</div>
              <div className="text-[11px] font-medium text-muted">5 Yıllık Potansiyel</div>
            </div>
            <div className="rounded-control bg-canvas p-4 text-center flex flex-col items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div className="mt-1 text-sm font-bold text-ink">Yatırımlık</div>
              <div className="text-[11px] font-medium text-muted">Değerlenme Beklentisi {analysis.scoreLabel || "—"}</div>
            </div>
          </div>

          {/* Skor bar */}
          <div className="mt-4">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-green-500"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </>
      )}

      <div className="mt-5 space-y-4 text-sm leading-relaxed text-ink">
        <div>
          <h3 className="font-semibold text-ink">Bölge Analizi</h3>
          <p className="mt-1">{analysis.regionText}</p>
        </div>
        {scoresVisible && (
          <div className="rounded-control border-l-4 border-brand-500 bg-brand-50 p-4">
            <h3 className="flex items-center gap-1.5 font-semibold text-brand-900"><TrendingUp className="h-4 w-4" /> Gelişim Potansiyeli</h3>
            <p className="mt-1 text-brand-900">{analysis.potentialText}</p>
          </div>
        )}
      </div>

      {(analysis.schools.length > 0 || analysis.hospitals.length > 0) && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {analysis.schools.length > 0 && (
            <div className="rounded-control bg-canvas p-4">
              <h3 className="flex items-center gap-1.5 font-semibold text-ink"><GraduationCap className="h-4 w-4 text-brand-600" /> İlçedeki Eğitim Kurumları</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {analysis.schools.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {analysis.hospitals.length > 0 && (
            <div className="rounded-control bg-canvas p-4">
              <h3 className="flex items-center gap-1.5 font-semibold text-ink"><Stethoscope className="h-4 w-4 text-brand-600" /> İlçedeki Sağlık Kuruluşları</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {analysis.hospitals.map((h, i) => (
                  <li key={i}>• {h}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="mt-4 text-[11px] text-muted/70">
        * Bu otomatik bölge özeti ilçe düzeyindeki kayıtlı verilere dayanır; resmi ekspertiz
        veya yatırım tavsiyesi değildir. Karar öncesinde güncel verileri ayrıca doğrulayınız.
      </p>
    </section>
  );
}
