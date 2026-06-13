"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { DISTRICTS, PROPERTY_TYPES } from "@/lib/constants";

export default function HomeSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [tur, setTur] = useState("");
  const [ilce, setIlce] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (tur) p.set("tur", tur);
    if (ilce) p.set("ilce", ilce);
    if (min) p.set("min", min);
    if (max) p.set("max", max);
    const qs = p.toString();
    router.push(`/ilanlar${qs ? `?${qs}` : ""}`);
  }

  const fieldCls =
    "rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none";

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-4 shadow-prestige ring-1 ring-slate-200">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-12">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Kelime, mahalle..."
          className={`${fieldCls} col-span-2 md:col-span-3`}
        />
        <select value={tur} onChange={(e) => setTur(e.target.value)} className={`${fieldCls} md:col-span-2`}>
          <option value="">Tüm Türler</option>
          {PROPERTY_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={ilce} onChange={(e) => setIlce(e.target.value)} className={`${fieldCls} md:col-span-2`}>
          <option value="">Tüm İlçeler</option>
          {DISTRICTS.map((d) => <option key={d.slug} value={d.name}>{d.name}</option>)}
        </select>
        <input
          value={min}
          onChange={(e) => setMin(e.target.value)}
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Min ₺"
          className={`${fieldCls} md:col-span-2`}
        />
        <input
          value={max}
          onChange={(e) => setMax(e.target.value)}
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Max ₺"
          className={`${fieldCls} md:col-span-2`}
        />
        <button
          type="submit"
          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-800 md:col-span-1"
        >
          <Search className="h-4 w-4" /> Ara
        </button>
      </div>
    </form>
  );
}
