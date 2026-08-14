"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { X, SlidersHorizontal, Search, Check, BellRing } from "lucide-react";
import { DISTRICTS } from "@/lib/constants";
import { getCategory, getFilterableFields, getSubTypeLabel, isCategoryKey } from "@/lib/categories";
import { formatNumber } from "@/lib/format";
import ThousandsInput from "@/components/ThousandsInput";

const ROOMS = ["1+0", "1+1", "2+1", "3+1", "4+1", "4+2", "5+1"];

// "Doğrulanmış" burada DEĞİL: emlak olanağı değil, her kategoride geçerli bir
// güven işareti. Emlak bloğunun içindeyken kartta rozet görünüyor ama filtre
// yalnız emlakta açılıyordu.
const AMENITIES: { key: string; label: string }[] = [
  { key: "esyali", label: "Eşyalı" },
  { key: "otopark", label: "Otoparklı" },
  { key: "balkon", label: "Balkonlu" },
  { key: "site", label: "Site İçinde" },
];

/** Her kategoride geçerli filtre anahtarları. */
const BASE_CHIP_KEYS = ["q", "tur", "ilce", "min", "max", "dogrulanmis"];
/** Yalnız emlakta anlamlı olanlar — vasıta listesinde "Otoparklı" çipi çıkmasın. */
const REAL_ESTATE_CHIP_KEYS = ["oda", "minAlan", "maxAlan", "imar", "esyali", "otopark", "balkon", "site"];

export default function ListingFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  // Kategori seçilmemişse ("Tümü") kategoriye özel hiçbir filtre gösterilmez:
  // tüm kategoriler listelenirken "Emlak Tipi" ya da "Yakıt" başlığı yanıltıcı olur.
  const categoryParam = sp.get("kategori");
  const category = isCategoryKey(categoryParam) ? getCategory(categoryParam) : null;
  const isRealEstate = category?.key === "emlak";
  const attributeFields = category ? getFilterableFields(category.key) : [];
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !sheetRef.current) return;
      const focusable = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open]);

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
      case "tur": return getSubTypeLabel(category?.key, val);
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
      default: {
        // Kategoriye özel nitelik filtreleri (yakit, vites, yil_min ...).
        // Sabit listeye yazılamazlar: kayıt büyüdükçe değişiyorlar.
        for (const field of attributeFields) {
          if (key === field.key) {
            const option = field.options?.find((o) => o.value === val);
            return `${field.label}: ${option?.label ?? val}`;
          }
          if (key === `${field.key}_min`) return `${field.label} min ${val}${field.unit ? ` ${field.unit}` : ""}`;
          if (key === `${field.key}_max`) return `${field.label} max ${val}${field.unit ? ` ${field.unit}` : ""}`;
        }
        return null;
      }
    }
  }

  // Çip anahtarları kayıttan genişliyor: kategori filtreleri eskiden hiç
  // görünmüyordu ve yalnız kendi kontrolünden temizlenebiliyordu.
  const chipKeys = [
    ...BASE_CHIP_KEYS,
    ...(isRealEstate ? REAL_ESTATE_CHIP_KEYS : []),
    ...attributeFields.flatMap((f) =>
      f.type === "select" ? [f.key] : [`${f.key}_min`, `${f.key}_max`]
    ),
  ];
  const activeCount = chipKeys.filter((k) => sp.get(k)).length;
  const activeChips = chipKeys.map((k) => ({ k, v: sp.get(k) })).filter((c) => c.v) as { k: string; v: string }[];

  const fieldCls =
    "h-11 w-full rounded-control border border-stone bg-paper px-3.5 text-[15px] text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";
  const sectionCls = "border-t border-stone pt-5";
  const headCls = "mb-3 text-sm font-semibold text-ink";

  const content = (
    <>
      {/* Başlık */}
      <div className="mb-4 flex items-center justify-between border-b border-stone pb-4">
        <h2 id="listing-filter-title" className="text-base font-bold text-ink">Filtreler</h2>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => {
                // Korunanlar filtre DEĞİL, bağlam: kategori düşerse /ilanlar
                // liste yerine kategori seçim ekranına döner, yani "Temizle"
                // kullanıcıyı listeden atardı. Görünüm/sıra da tercih.
                const keep = new URLSearchParams();
                for (const key of ["kategori", "ofis", "danisman", "gorunum", "sira"]) {
                  const value = sp.get(key);
                  if (value) keep.set(key, value);
                }
                const query = keep.toString();
                router.push(`/ilanlar${query ? `?${query}` : ""}`);
              }}
              className="min-h-11 px-1 text-sm font-medium text-muted transition hover:text-brand-700"
            >
              Temizle
            </button>
          )}
          <button ref={closeButtonRef} type="button" onClick={() => setOpen(false)} aria-label="Filtreleri kapat" className="grid h-11 w-11 place-items-center text-muted/70 hover:text-ink lg:hidden">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Arama */}
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/70" />
          <input
            id="listing-filter-search"
            type="search"
            key={sp.get("q") || "q-empty"}
            defaultValue={sp.get("q") || ""}
            onBlur={(e) => update("q", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") update("q", (e.target as HTMLInputElement).value); }}
            placeholder="İlan no, kelime, mahalle..."
            aria-label="İlanlarda ara"
            className={`${fieldCls} pl-9`}
          />
        </div>

        {/* Kategori içi alt tür (tek seçim) — yalnız bir kategori seçiliyken */}
        {category && (
        <div className={sectionCls}>
          <h3 id="property-type-filter-title" className={headCls}>{isRealEstate ? "Emlak Tipi" : "Tür"}</h3>
          <div role="group" aria-labelledby="property-type-filter-title" className="space-y-1">
            {category.subTypes.map((p) => {
              const on = sp.get("tur") === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => update("tur", on ? "" : p.value)}
                  aria-pressed={on}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-control px-2.5 py-2 text-left text-[15px] transition ${on ? "bg-brand-50 font-semibold text-brand-700" : "text-ink hover:bg-canvas"}`}
                >
                  <span aria-hidden="true" className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${on ? "border-brand-600 bg-brand-600 text-white" : "border-stone"}`}>
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
        )}

        {/* İlçe */}
        <div className={sectionCls}>
          <label htmlFor="listing-filter-district" className={headCls}>İlçe</label>
          <select id="listing-filter-district" value={sp.get("ilce") || ""} onChange={(e) => update("ilce", e.target.value)} className={fieldCls}>
            <option value="">Tüm İlçeler</option>
            {DISTRICTS.map((d) => <option key={d.slug} value={d.name}>{d.name}</option>)}
          </select>
        </div>

        {/* Fiyat Aralığı */}
        <div className={sectionCls}>
          <h3 id="price-filter-title" className={headCls}>Fiyat Aralığı (₺)</h3>
          <div className="flex items-center gap-2">
            <ThousandsInput key={sp.get("min") || "min"} defaultValue={sp.get("min") || ""} onCommit={(raw) => update("min", raw)} placeholder="Min" ariaLabel="Minimum fiyat" className={fieldCls} />
            <span aria-hidden="true" className="text-muted/70">–</span>
            <ThousandsInput key={sp.get("max") || "max"} defaultValue={sp.get("max") || ""} onCommit={(raw) => update("max", raw)} placeholder="Max" ariaLabel="Maksimum fiyat" className={fieldCls} />
          </div>
        </div>

        {/* Oda, alan, imar ve olanaklar YALNIZ emlakta anlamlı */}
        {isRealEstate && (
        <>
        {/* Oda Sayısı */}
        <div className={sectionCls}>
          <h3 id="room-filter-title" className={headCls}>Oda Sayısı</h3>
          <div role="group" aria-labelledby="room-filter-title" className="grid grid-cols-3 gap-2">
            {ROOMS.map((r) => {
              const on = sp.get("oda") === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => update("oda", on ? "" : r)}
                  aria-pressed={on}
                  className={`min-h-11 rounded-control border py-2 text-sm font-medium transition ${on ? "border-brand-600 bg-brand-50 text-brand-700" : "border-stone text-muted hover:border-brand-300"}`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Alan Aralığı */}
        <div className={sectionCls}>
          <h3 id="area-filter-title" className={headCls}>Alan Aralığı</h3>
          <div className="grid grid-cols-3 gap-2">
            <select aria-label="Alan birimi" value={birim} onChange={(e) => setBirim(e.target.value)} className={fieldCls}>
              <option value="m2">m²</option>
              <option value="donum">Dönüm</option>
            </select>
            <input aria-label={`Minimum alan (${unitLabel})`} key={`minAlan-${sp.get("minAlan") || ""}`} defaultValue={sp.get("minAlan") || ""} onBlur={(e) => update("minAlan", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") update("minAlan", (e.target as HTMLInputElement).value); }} type="number" min={0} inputMode="numeric" placeholder="Min" className={fieldCls} />
            <input aria-label={`Maksimum alan (${unitLabel})`} key={`maxAlan-${sp.get("maxAlan") || ""}`} defaultValue={sp.get("maxAlan") || ""} onBlur={(e) => update("maxAlan", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") update("maxAlan", (e.target as HTMLInputElement).value); }} type="number" min={0} inputMode="numeric" placeholder="Max" className={fieldCls} />
          </div>
          {birim === "donum" && <p className="mt-1.5 text-[11px] text-muted/70">1 dönüm = 1.000 m²</p>}
        </div>

        {/* İmar (arsa/tarla) */}
        <div className={sectionCls}>
          <label htmlFor="listing-filter-zoning" className={headCls}>İmar Durumu <span className="font-normal text-muted/70">(arsa/tarla)</span></label>
          <input id="listing-filter-zoning" key={sp.get("imar") || "imar"} defaultValue={sp.get("imar") || ""} onBlur={(e) => update("imar", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") update("imar", (e.target as HTMLInputElement).value); }} placeholder="Konut, Ticari..." className={fieldCls} />
        </div>

        {/* Olanaklar */}
        <div className={sectionCls}>
          <h3 id="amenities-filter-title" className={headCls}>Olanaklar</h3>
          <div role="group" aria-labelledby="amenities-filter-title" className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => {
              const on = !!sp.get(a.key);
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => toggle(a.key)}
                  aria-pressed={on}
                  className={`min-h-11 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${on ? "bg-brand-700 text-white" : "bg-canvas text-muted hover:bg-stone"}`}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        </>
        )}

        {/* Doğrulanmış — kategoriden bağımsız */}
        <div className={sectionCls}>
          <h3 id="verified-filter-title" className={headCls}>Güven</h3>
          <div role="group" aria-labelledby="verified-filter-title" className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => toggle("dogrulanmis")}
              aria-pressed={!!sp.get("dogrulanmis")}
              className={`min-h-11 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${sp.get("dogrulanmis") ? "bg-brand-700 text-white" : "bg-canvas text-muted hover:bg-stone"}`}
            >
              Doğrulanmış ilanlar
            </button>
          </div>
        </div>

        {/* Kategoriye özel filtreler — kayıttan üretilir (lib/categories.ts) */}
        {attributeFields.map((field) =>
          field.type === "select" ? (
            <div key={field.key} className={sectionCls}>
              <label htmlFor={`attr-${field.key}`} className={headCls}>{field.label}</label>
              <select
                id={`attr-${field.key}`}
                value={sp.get(field.key) || ""}
                onChange={(e) => update(field.key, e.target.value)}
                className={fieldCls}
              >
                <option value="">Farketmez</option>
                {field.options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          ) : (
            <div key={field.key} className={sectionCls}>
              <h3 id={`attr-${field.key}-title`} className={headCls}>
                {field.label}{field.unit ? ` (${field.unit})` : ""}
              </h3>
              <div role="group" aria-labelledby={`attr-${field.key}-title`} className="flex items-center gap-2">
                <input
                  key={`${field.key}_min-${sp.get(`${field.key}_min`) || ""}`}
                  defaultValue={sp.get(`${field.key}_min`) || ""}
                  onBlur={(e) => update(`${field.key}_min`, e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") update(`${field.key}_min`, (e.target as HTMLInputElement).value); }}
                  type="number"
                  min={field.min}
                  max={field.max}
                  inputMode="numeric"
                  placeholder="Min"
                  aria-label={`Minimum ${field.label}`}
                  className={fieldCls}
                />
                <span aria-hidden="true" className="text-muted/70">–</span>
                <input
                  key={`${field.key}_max-${sp.get(`${field.key}_max`) || ""}`}
                  defaultValue={sp.get(`${field.key}_max`) || ""}
                  onBlur={(e) => update(`${field.key}_max`, e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") update(`${field.key}_max`, (e.target as HTMLInputElement).value); }}
                  type="number"
                  min={field.min}
                  max={field.max}
                  inputMode="numeric"
                  placeholder="Max"
                  aria-label={`Maksimum ${field.label}`}
                  className={fieldCls}
                />
              </div>
            </div>
          )
        )}

        {/* Aktif çipler */}
        {activeChips.length > 0 && (
          <div className={sectionCls}>
            <h3 className={headCls}>Aktif Filtreler</h3>
            <div className="flex flex-wrap gap-2">
              {activeChips.map((c) => {
                const label = chipLabel(c.k, c.v);
                if (!label) return null;
                return (
                  <button key={c.k} type="button" onClick={() => update(c.k, "")} aria-label={`${label} filtresini kaldır`} className="inline-flex min-h-11 items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100">
                    {label} <X aria-hidden="true" className="h-3 w-3" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bu aramayı kaydet → alıcı talebi (kriterler taşınır, uygun ilan gelince haber).
          YALNIZ emlakta: eşleştirme (lib/matching.ts) emlak kriterleri üzerinden
          çalışıyor, vasıta alıcısına asla bildirim gelmez — karşılıksız vaat. */}
      {isRealEstate && (
        <button
          type="button"
          onClick={saveSearch}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-control border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
        >
          <BellRing aria-hidden="true" className="h-4 w-4" /> Bu aramayı kaydet, uygun ilan gelince haber ver
        </button>
      )}

      {/* Mobil: sonuçları gör (sheet'i kapatır; filtreler zaten anında uygulanır) */}
      <div className="mt-6 lg:hidden">
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 w-full rounded-control bg-brand-700 px-4 py-3 text-base font-semibold text-white transition hover:bg-brand-800">
          Sonuçları Gör
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobil tetikleyici */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-controls="listing-filters"
        aria-expanded={open}
        aria-label={activeCount > 0 ? `Filtreleri aç, ${activeCount} aktif filtre` : "Filtreleri aç"}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-control border border-stone bg-paper px-4 py-3 text-[15px] font-medium text-ink lg:hidden"
      >
        <SlidersHorizontal aria-hidden="true" className="h-5 w-5" /> Filtrele
        {activeCount > 0 && <span aria-hidden="true" className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">{activeCount}</span>}
      </button>

      {/* Mobil arka plan */}
      {open && <div aria-hidden="true" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />}

      {/* Sidebar (masaüstü) / Sheet (mobil) */}
      <aside
        id="listing-filters"
        ref={sheetRef}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-labelledby="listing-filter-title"
        className={`${open ? "fixed inset-y-0 right-0 z-50 w-[92%] max-w-sm overflow-y-auto shadow-prestige" : "hidden"} bg-paper p-5 lg:sticky lg:top-24 lg:z-auto lg:block lg:max-h-[calc(100vh-7rem)] lg:w-auto lg:overflow-y-auto lg:border-r lg:border-stone lg:bg-transparent lg:py-0 lg:pl-0 lg:pr-6`}
      >
        {content}
      </aside>
    </>
  );
}
