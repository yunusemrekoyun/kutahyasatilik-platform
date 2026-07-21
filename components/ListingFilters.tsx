"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { X, SlidersHorizontal, Search, Check, BellRing } from "lucide-react";
import { DISTRICTS, PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import ThousandsInput from "@/components/ThousandsInput";

const ROOMS = ["1+0", "1+1", "2+1", "3+1", "4+1", "4+2", "5+1"];

const AMENITIES: { key: string; label: string }[] = [
  { key: "esyali", label: "Eşyalı" },
  { key: "otopark", label: "Otoparklı" },
  { key: "balkon", label: "Balkonlu" },
  { key: "site", label: "Site İçinde" },
  { key: "dogrulanmis", label: "Doğrulanmış" },
];

const CHIP_KEYS = ["q", "tur", "ilce", "oda", "min", "max", "minAlan", "maxAlan", "imar", "esyali", "otopark", "balkon", "site", "dogrulanmis"];

export default function ListingFilters() {
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
    pushWith((p) => {
      if (value === "donum") p.set("birim", "donum");
      else p.delete("birim");
      p.delete("minAlan");
      p.delete("maxAlan");
    });
  }
  // Aktif filtreleri alıcı-talebi (kayıtlı arama) formuna taşı — kullanıcı kriterleri
  // yeniden girmesin; giriş yapmışsa talep otomatik hesabına bağlanır.
  function saveSearch() {
    const map: [string, string][] = [
      ["tur", "propertyType"], ["ilce", "district"],
      ["min", "minPrice"], ["max", "maxPrice"],
      ["minAlan", "minArea"], ["oda", "rooms"],
    ];
    const p = new URLSearchParams();
    for (const [from, to] of map) {
      const v = sp.get(from);
      if (v) p.set(to, v);
    }
    const qs = p.toString();
    router.push(`/alici-talebi${qs ? `?${qs}` : ""}`);
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
    "h-11 w-full rounded-lg border border-stone bg-paper px-3.5 text-[15px] text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";
  const sectionCls = "border-t border-stone pt-5";
  const headCls = "mb-3 text-sm font-semibold text-slate-900";

  const content = (
    <>
      {/* Başlık */}
      <div className="mb-4 flex items-center justify-between border-b border-stone pb-4">
        <h2 className="font-display text-lg font-bold text-brand-900">Filtreler</h2>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button onClick={() => router.push("/ilanlar")} className="text-sm font-medium text-slate-500 transition hover:text-brand-700">
              Temizle
            </button>
          )}
          <button onClick={() => setOpen(false)} aria-label="Kapat" className="text-slate-400 hover:text-slate-700 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Arama */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            key={sp.get("q") || "q-empty"}
            defaultValue={sp.get("q") || ""}
            onBlur={(e) => update("q", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") update("q", (e.target as HTMLInputElement).value); }}
            placeholder="İlan no, kelime, mahalle..."
            aria-label="Arama"
            className={`${fieldCls} pl-9`}
          />
        </div>

        {/* Emlak Tipi (tek seçim) */}
        <div className={sectionCls}>
          <h3 className={headCls}>Emlak Tipi</h3>
          <div className="space-y-1">
            {PROPERTY_TYPES.map((p) => {
              const on = sp.get("tur") === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => update("tur", on ? "" : p.value)}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[15px] transition ${on ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${on ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"}`}>
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* İlçe */}
        <div className={sectionCls}>
          <h3 className={headCls}>İlçe</h3>
          <select value={sp.get("ilce") || ""} onChange={(e) => update("ilce", e.target.value)} className={fieldCls}>
            <option value="">Tüm İlçeler</option>
            {DISTRICTS.map((d) => <option key={d.slug} value={d.name}>{d.name}</option>)}
          </select>
        </div>

        {/* Fiyat Aralığı */}
        <div className={sectionCls}>
          <h3 className={headCls}>Fiyat Aralığı (₺)</h3>
          <div className="flex items-center gap-2">
            <ThousandsInput key={sp.get("min") || "min"} defaultValue={sp.get("min") || ""} onCommit={(raw) => update("min", raw)} placeholder="Min" className={fieldCls} />
            <span className="text-slate-400">–</span>
            <ThousandsInput key={sp.get("max") || "max"} defaultValue={sp.get("max") || ""} onCommit={(raw) => update("max", raw)} placeholder="Max" className={fieldCls} />
          </div>
        </div>

        {/* Oda Sayısı */}
        <div className={sectionCls}>
          <h3 className={headCls}>Oda Sayısı</h3>
          <div className="grid grid-cols-3 gap-2">
            {ROOMS.map((r) => {
              const on = sp.get("oda") === r;
              return (
                <button
                  key={r}
                  onClick={() => update("oda", on ? "" : r)}
                  className={`rounded-lg border py-2 text-sm font-medium transition ${on ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600 hover:border-brand-300"}`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Alan Aralığı */}
        <div className={sectionCls}>
          <h3 className={headCls}>Alan Aralığı</h3>
          <div className="grid grid-cols-3 gap-2">
            <select value={birim} onChange={(e) => setBirim(e.target.value)} className={fieldCls}>
              <option value="m2">m²</option>
              <option value="donum">Dönüm</option>
            </select>
            <input key={`minAlan-${sp.get("minAlan") || ""}`} defaultValue={sp.get("minAlan") || ""} onBlur={(e) => update("minAlan", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") update("minAlan", (e.target as HTMLInputElement).value); }} type="number" min={0} inputMode="numeric" placeholder={`Min`} className={fieldCls} />
            <input key={`maxAlan-${sp.get("maxAlan") || ""}`} defaultValue={sp.get("maxAlan") || ""} onBlur={(e) => update("maxAlan", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") update("maxAlan", (e.target as HTMLInputElement).value); }} type="number" min={0} inputMode="numeric" placeholder={`Max`} className={fieldCls} />
          </div>
          {birim === "donum" && <p className="mt-1.5 text-[11px] text-slate-400">1 dönüm = 1.000 m²</p>}
        </div>

        {/* İmar (arsa/tarla) */}
        <div className={sectionCls}>
          <h3 className={headCls}>İmar Durumu <span className="font-normal text-slate-400">(arsa/tarla)</span></h3>
          <input key={sp.get("imar") || "imar"} defaultValue={sp.get("imar") || ""} onBlur={(e) => update("imar", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") update("imar", (e.target as HTMLInputElement).value); }} placeholder="Konut, Ticari..." className={fieldCls} />
        </div>

        {/* Olanaklar */}
        <div className={sectionCls}>
          <h3 className={headCls}>Olanaklar</h3>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => {
              const on = !!sp.get(a.key);
              return (
                <button
                  key={a.key}
                  onClick={() => toggle(a.key)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${on ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Aktif çipler */}
        {activeChips.length > 0 && (
          <div className={sectionCls}>
            <h3 className={headCls}>Aktif Filtreler</h3>
            <div className="flex flex-wrap gap-2">
              {activeChips.map((c) => {
                const label = chipLabel(c.k, c.v);
                if (!label) return null;
                return (
                  <button key={c.k} onClick={() => update(c.k, "")} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100">
                    {label} <X className="h-3 w-3" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bu aramayı kaydet → alıcı talebi (kriterler taşınır, uygun ilan gelince haber) */}
      <button
        onClick={saveSearch}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
      >
        <BellRing className="h-4 w-4" /> Bu aramayı kaydet, uygun ilan gelince haber ver
      </button>

      {/* Mobil: sonuçları gör (sheet'i kapatır; filtreler zaten anında uygulanır) */}
      <div className="mt-6 lg:hidden">
        <button onClick={() => setOpen(false)} className="w-full rounded-lg bg-brand-700 px-4 py-3 text-base font-semibold text-white transition hover:bg-brand-800">
          Sonuçları Gör
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobil tetikleyici */}
      <button
        onClick={() => setOpen(true)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-paper px-4 py-3 text-[15px] font-medium text-slate-700 lg:hidden"
      >
        <SlidersHorizontal className="h-5 w-5" /> Filtrele
        {activeCount > 0 && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">{activeCount}</span>}
      </button>

      {/* Mobil arka plan */}
      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />}

      {/* Sidebar (masaüstü) / Sheet (mobil) */}
      <aside
        className={`${open ? "fixed inset-y-0 right-0 z-50 w-[92%] max-w-sm overflow-y-auto shadow-prestige" : "hidden"} bg-paper p-5 lg:sticky lg:top-24 lg:z-auto lg:block lg:max-h-[calc(100vh-7rem)] lg:w-auto lg:overflow-y-auto lg:border-r lg:border-stone lg:bg-transparent lg:py-0 lg:pl-0 lg:pr-6`}
      >
        {content}
      </aside>
    </>
  );
}
