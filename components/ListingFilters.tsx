"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { DISTRICTS, PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";

const ROOMS = ["1+0", "1+1", "2+1", "3+1", "4+1", "4+2", "5+1"];

const AMENITIES: { key: string; label: string }[] = [
  { key: "esyali", label: "Eşyalı" },
  { key: "otopark", label: "Otoparklı" },
  { key: "balkon", label: "Balkonlu" },
  { key: "site", label: "Site İçinde" },
  { key: "dogrulanmis", label: "✓ Doğrulanmış" },
];

const CHIP_KEYS = ["q", "tur", "ilce", "oda", "min", "max", "minAlan", "maxAlan", "imar", "esyali", "otopark", "balkon", "site", "dogrulanmis"];

export default function ListingFilters({ total }: { total?: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const birim = sp.get("birim") === "donum" ? "donum" : "m2";
  const unitLabel = birim === "donum" ? "dönüm" : "m²";

  function pushWith(mut: (p: URLSearchParams) => void) {
    const params = new URLSearchParams(sp.toString());
    mut(params);
    params.delete("sayfa");
    router.push(`/ilanlar?${params.toString()}`);
  }
  function update(key: string, value: string) {
    pushWith((p) => (value ? p.set(key, value) : p.delete(key)));
  }
  function toggle(key: string) {
    pushWith((p) => (p.get(key) ? p.delete(key) : p.set(key, "1")));
  }
  function setBirim(value: string) {
    // Birim değişince alan değerlerini sıfırla (karışmasın)
    pushWith((p) => {
      if (value === "donum") p.set("birim", "donum");
      else p.delete("birim");
      p.delete("minAlan");
      p.delete("maxAlan");
    });
  }

  function chipLabel(key: string, val: string): string | null {
    switch (key) {
      case "q": return `“${val}”`;
      case "tur": return PROPERTY_TYPE_LABELS[val] || val;
      case "ilce": return val;
      case "oda": return val;
      case "min": return `Min ${formatNumber(Number(val))} ₺`;
      case "max": return `Max ${formatNumber(Number(val))} ₺`;
      case "minAlan": return `Min ${val} ${unitLabel}`;
      case "maxAlan": return `Max ${val} ${unitLabel}`;
      case "imar": return `İmar: ${val}`;
      case "esyali": return "Eşyalı";
      case "otopark": return "Otoparklı";
      case "balkon": return "Balkonlu";
      case "site": return "Site İçinde";
      case "dogrulanmis": return "Doğrulanmış";
      default: return null;
    }
  }

  const activeCount = CHIP_KEYS.filter((k) => sp.get(k)).length;
  const activeChips = CHIP_KEYS.map((k) => ({ k, v: sp.get(k) })).filter((c) => c.v) as { k: string; v: string }[];

  const fieldCls =
    "rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none";

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
      {/* Üst satır */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <input
          defaultValue={sp.get("q") || ""}
          key={sp.get("q") || "q-empty"}
          onKeyDown={(e) => { if (e.key === "Enter") update("q", (e.target as HTMLInputElement).value); }}
          placeholder="🔍 Kelime, mahalle, adres..."
          className={`${fieldCls} col-span-2`}
        />
        <select value={sp.get("tur") || ""} onChange={(e) => update("tur", e.target.value)} className={fieldCls}>
          <option value="">Tüm Türler</option>
          {PROPERTY_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={sp.get("ilce") || ""} onChange={(e) => update("ilce", e.target.value)} className={fieldCls}>
          <option value="">Tüm İlçeler</option>
          {DISTRICTS.map((d) => <option key={d.slug} value={d.name}>{d.name}</option>)}
        </select>
        <select value={sp.get("sira") || ""} onChange={(e) => update("sira", e.target.value)} className={fieldCls}>
          <option value="">Önerilen</option>
          <option value="price_asc">Fiyat ↑</option>
          <option value="price_desc">Fiyat ↓</option>
          <option value="oldest">En Eski</option>
        </select>
        <button
          onClick={() => setOpen((o) => !o)}
          className={`${fieldCls} flex items-center justify-center gap-1.5 font-medium ${activeCount ? "border-brand-400 text-brand-700" : "text-slate-600"}`}
        >
          <SlidersHorizontal className="h-4 w-4" /> Filtreler
          {activeCount > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-xs text-white">{activeCount}</span>}
        </button>
      </div>

      {/* Gelişmiş panel */}
      {open && (
        <div className="mt-3 space-y-4 border-t border-slate-100 pt-4">
          {/* Oda + Fiyat aralığı */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <label className="text-xs font-medium text-slate-500">
              Oda Sayısı
              <select value={sp.get("oda") || ""} onChange={(e) => update("oda", e.target.value)} className={`${fieldCls} mt-1 w-full`}>
                <option value="">Farketmez</option>
                {ROOMS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-500">
              Min Fiyat (₺)
              <input key={sp.get("min") || "min"} defaultValue={sp.get("min") || ""} onBlur={(e) => update("min", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") update("min", (e.target as HTMLInputElement).value); }} type="number" min={0} inputMode="numeric" placeholder="Alt sınır" className={`${fieldCls} mt-1 w-full`} />
            </label>
            <label className="text-xs font-medium text-slate-500">
              Max Fiyat (₺)
              <input key={sp.get("max") || "max"} defaultValue={sp.get("max") || ""} onBlur={(e) => update("max", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") update("max", (e.target as HTMLInputElement).value); }} type="number" min={0} inputMode="numeric" placeholder="Üst sınır" className={`${fieldCls} mt-1 w-full`} />
            </label>
            <label className="text-xs font-medium text-slate-500">
              İmar Durumu (arsa/tarla)
              <input key={sp.get("imar") || "imar"} defaultValue={sp.get("imar") || ""} onBlur={(e) => update("imar", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") update("imar", (e.target as HTMLInputElement).value); }} placeholder="Konut, Ticari..." className={`${fieldCls} mt-1 w-full`} />
            </label>
          </div>

          {/* Alan aralığı (m² veya dönüm) */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-500">Alan Aralığı</p>
            <div className="grid grid-cols-3 gap-3">
              <select value={birim} onChange={(e) => setBirim(e.target.value)} className={fieldCls}>
                <option value="m2">m²</option>
                <option value="donum">Dönüm</option>
              </select>
              <input
                key={`minAlan-${sp.get("minAlan") || ""}`}
                defaultValue={sp.get("minAlan") || ""}
                onBlur={(e) => update("minAlan", e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") update("minAlan", (e.target as HTMLInputElement).value); }}
                type="number" min={0} inputMode="numeric" placeholder={`Min ${unitLabel}`} className={fieldCls}
              />
              <input
                key={`maxAlan-${sp.get("maxAlan") || ""}`}
                defaultValue={sp.get("maxAlan") || ""}
                onBlur={(e) => update("maxAlan", e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") update("maxAlan", (e.target as HTMLInputElement).value); }}
                type="number" min={0} inputMode="numeric" placeholder={`Max ${unitLabel}`} className={fieldCls}
              />
            </div>
            {birim === "donum" && <p className="mt-1 text-[11px] text-slate-400">1 dönüm = 1.000 m² (arsa/tarla için pratik)</p>}
          </div>

          {/* Olanaklar */}
          <div>
            <p className="mb-2 text-xs font-medium text-slate-500">Olanaklar</p>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => {
                const on = !!sp.get(a.key);
                return (
                  <button
                    key={a.key}
                    onClick={() => toggle(a.key)}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                      on ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={() => router.push("/ilanlar")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Tüm Filtreleri Temizle
          </button>
        </div>
      )}

      {/* Aktif filtre çipleri */}
      {activeChips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          {activeChips.map((c) => {
            const label = chipLabel(c.k, c.v);
            if (!label) return null;
            return (
              <button
                key={c.k}
                onClick={() => update(c.k, "")}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
              >
                {label} <X className="h-3 w-3" />
              </button>
            );
          })}
          <button onClick={() => router.push("/ilanlar")} className="text-xs font-medium text-slate-400 hover:text-red-600">
            Tümünü temizle
          </button>
        </div>
      )}

      {typeof total === "number" && (
        <p className="mt-3 text-sm text-slate-500"><strong className="text-slate-800">{total}</strong> ilan listeleniyor</p>
      )}
    </div>
  );
}
