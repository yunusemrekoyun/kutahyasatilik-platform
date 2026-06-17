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

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (tur) p.set("tur", tur);
    if (ilce) p.set("ilce", ilce);
    const qs = p.toString();
    router.push(`/ilanlar${qs ? `?${qs}` : ""}`);
  }

  const labelCls = "mb-2 block text-left text-sm font-semibold text-slate-600";
  const fieldCls =
    "h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-base text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end md:gap-5">
      <div>
        <label htmlFor="hs-q" className={labelCls}>Anahtar Kelime</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="hs-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="İlan no veya kelime"
            className={`${fieldCls} pl-10`}
          />
        </div>
      </div>
      <div>
        <label htmlFor="hs-tur" className={labelCls}>Tür Seçiniz</label>
        <select id="hs-tur" value={tur} onChange={(e) => setTur(e.target.value)} className={fieldCls}>
          <option value="">Tüm Türler</option>
          {PROPERTY_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="hs-ilce" className={labelCls}>İlçe Seçiniz</label>
        <select id="hs-ilce" value={ilce} onChange={(e) => setIlce(e.target.value)} className={fieldCls}>
          <option value="">Tüm İlçeler</option>
          {DISTRICTS.map((d) => <option key={d.slug} value={d.name}>{d.name}</option>)}
        </select>
      </div>
      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 text-base font-semibold text-white transition-colors hover:bg-brand-800"
      >
        <Search className="h-5 w-5" /> Arama Yap
      </button>
    </form>
  );
}
