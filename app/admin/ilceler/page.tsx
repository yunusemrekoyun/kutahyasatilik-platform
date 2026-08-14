import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { setAnalysisScores } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminDistricts() {
  const [districts, scoresSetting] = await Promise.all([
    prisma.district.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.setting.findUnique({ where: { key: "analysis_scores" } }),
  ]);
  const scoresVisible = scoresSetting?.value !== "0";

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">İlçe Verisi</h1>
        <p className="text-sm text-muted">Kütahya&apos;nın {districts.length} ilçesi · bölge analizi verilerini düzenleyin (ilçeler sabittir)</p>
      </div>

      {/* Global toggle */}
      <form action={setAnalysisScores} className="mt-6 flex flex-wrap items-center justify-between gap-4 bg-paper p-4 border border-stone">
        <label className="flex items-center gap-3 text-sm font-medium text-ink">
          <input type="checkbox" name="show" defaultChecked={scoresVisible} className="h-4 w-4 rounded border-stone" />
          Bölge analizi puanlarını sitede göster
        </label>
        <button type="submit" className="rounded-control bg-brand-800 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900">
          Kaydet
        </button>
      </form>

      <div className="mt-6 overflow-hidden bg-paper border border-stone">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone bg-canvas text-left text-xs text-muted">
              <th className="p-3">Ad</th>
              <th className="p-3">Puan</th>
              <th className="p-3">%3y</th>
              <th className="p-3">%5y</th>
              <th className="p-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {districts.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted/70">İlçe verisi bulunamadı. (Seed ile 13 ilçe yüklenmiş olmalı.)</td></tr>
            )}
            {districts.map((d) => (
              <tr key={d.id} className="border-b border-stone/50 hover:bg-canvas">
                <td className="p-3 font-medium text-ink">{d.name}</td>
                <td className="p-3 text-muted">{d.investmentScore ?? "—"}</td>
                <td className="p-3 text-muted">{d.valueGrowth3yPct != null ? `%${d.valueGrowth3yPct}` : "—"}</td>
                <td className="p-3 text-muted">{d.valueGrowth5yPct != null ? `%${d.valueGrowth5yPct}` : "—"}</td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/ilceler/${d.id}`} className="rounded-control bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">Düzenle</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
