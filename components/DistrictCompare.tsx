"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/format";

export type DistrictStat = {
  name: string;
  avgPriceDaire: number | null;
  avgPriceArsaM2: number | null;
  valueGrowth3yPct: number | null;
  valueGrowth5yPct: number | null;
  investmentScore: number | null;
  count: number;
};

const tl = (v: number | null) => (v != null ? `${formatNumber(v)} ₺` : "—");
const pct = (v: number | null) => (v != null ? `%${v}` : "—");
const numv = (v: number | null) => (v != null ? String(v) : "—");

const ROWS: { label: string; key: keyof DistrictStat; fmt: (v: number | null) => string; higherBetter: boolean }[] = [
  { label: "Ort. Daire Fiyatı", key: "avgPriceDaire", fmt: tl, higherBetter: false },
  { label: "Arsa m² Fiyatı", key: "avgPriceArsaM2", fmt: tl, higherBetter: false },
  { label: "3 Yıl Değer Artışı", key: "valueGrowth3yPct", fmt: pct, higherBetter: true },
  { label: "5 Yıl Değer Artışı", key: "valueGrowth5yPct", fmt: pct, higherBetter: true },
  { label: "Yatırım Puanı", key: "investmentScore", fmt: numv, higherBetter: true },
  { label: "Aktif İlan", key: "count", fmt: numv, higherBetter: true },
];

export default function DistrictCompare({ districts }: { districts: DistrictStat[] }) {
  const [a, setA] = useState(districts[0]?.name ?? "");
  const [b, setB] = useState(districts[1]?.name ?? "");

  const da = districts.find((d) => d.name === a);
  const db = districts.find((d) => d.name === b);

  const selectCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none";

  function winner(key: keyof DistrictStat, higherBetter: boolean): "a" | "b" | null {
    const va = da?.[key] as number | null | undefined;
    const vb = db?.[key] as number | null | undefined;
    if (va == null || vb == null || va === vb) return null;
    const aWins = higherBetter ? va > vb : va < vb;
    return aWins ? "a" : "b";
  }

  return (
    <div className="overflow-hidden rounded-lg bg-paper ring-1 ring-stone">
      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4">
        <select value={a} onChange={(e) => setA(e.target.value)} className={selectCls}>
          {districts.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
        </select>
        <select value={b} onChange={(e) => setB(e.target.value)} className={selectCls}>
          {districts.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
        </select>
      </div>

      <table className="w-full text-sm">
        <tbody>
          {ROWS.map((r) => {
            const w = winner(r.key, r.higherBetter);
            return (
              <tr key={r.label} className="border-t border-slate-100">
                <td className={`p-3 text-center font-semibold ${w === "a" ? "bg-green-50 text-green-700" : "text-slate-800"}`}>
                  {r.fmt((da?.[r.key] as number | null) ?? null)}
                </td>
                <td className="w-px whitespace-nowrap bg-slate-50 px-3 py-3 text-center text-xs font-medium text-slate-400">
                  {r.label}
                </td>
                <td className={`p-3 text-center font-semibold ${w === "b" ? "bg-green-50 text-green-700" : "text-slate-800"}`}>
                  {r.fmt((db?.[r.key] as number | null) ?? null)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
