import { TrendingDown, TrendingUp, History } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/format";

type Entry = { price: number; createdAt: Date | string };

export default function PriceHistoryCard({
  history,
  currency = "TRY",
}: {
  history: Entry[];
  currency?: string;
}) {
  // En az 2 kayıt yoksa (fiyat hiç değişmemişse) gösterme
  if (!history || history.length < 2) return null;

  const first = history[0].price;
  const last = history[history.length - 1].price;
  const diffPct = Math.round(((last - first) / first) * 100);
  const dropped = last < first;

  return (
    <section className="rounded-lg bg-paper p-6 ring-1 ring-stone">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-100 text-brand-700">
          <History className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Fiyat Geçmişi</h2>
          <p className="text-xs text-slate-500">Şeffaf fiyatlandırma — bu ilanın fiyat değişimleri</p>
        </div>
      </div>

      {diffPct !== 0 && (
        <div
          className={`mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
            dropped ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {dropped ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
          Listelendiğinden bu yana %{Math.abs(diffPct)} {dropped ? "düştü" : "arttı"}
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {history
          .slice()
          .reverse()
          .map((h, i, arr) => {
            const prev = arr[i + 1];
            const delta = prev ? h.price - prev.price : 0;
            return (
              <li key={i} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0">
                <span className="text-slate-500">{formatDate(h.createdAt)}</span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{formatPrice(h.price, currency)}</span>
                  {delta !== 0 && (
                    <span className={`text-xs font-medium ${delta < 0 ? "text-green-600" : "text-amber-600"}`}>
                      {delta < 0 ? "▼" : "▲"} {formatPrice(Math.abs(delta), currency)}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
      </ul>
    </section>
  );
}
