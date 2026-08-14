"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORY_LIST, isCategoryKey } from "@/lib/categories";

/** Kategori seçilmemiş hâl — tüm kategoriler listelenir. */
const ALL = "";

/**
 * Kategori değişince taşınacak filtreler. Geri kalan her şey bilerek düşer:
 * bir kategorinin alt türü (daire) ve nitelikleri (yakıt) ötekinde anlamsızdır
 * ve taşınırlarsa hiç sonuç dönmeyen bir sorgu üretirler.
 */
const CARRY_OVER = ["q", "ilce", "min", "max", "sira"];

export default function CategoryTabs() {
  const router = useRouter();
  const sp = useSearchParams();
  const param = sp.get("kategori");
  const active = isCategoryKey(param) ? param : ALL;

  function switchTo(key: string) {
    const next = new URLSearchParams();
    for (const param of CARRY_OVER) {
      const value = sp.get(param);
      if (value) next.set(param, value);
    }
    // "Tümü" parametresizdir; URL'i gereksiz anahtarla kirletmiyoruz.
    if (key !== ALL) next.set("kategori", key);
    const qs = next.toString();
    router.push(`/ilanlar${qs ? `?${qs}` : ""}`);
  }

  const tabs = [{ key: ALL, label: "Tümü" }, ...CATEGORY_LIST.map((c) => ({ key: c.key as string, label: c.label }))];

  return (
    <nav aria-label="Kategoriler" className="mb-8 flex gap-7 overflow-x-auto border-b border-stone">
      {tabs.map((tab) => {
        const on = tab.key === active;
        return (
          <button
            key={tab.key || "all"}
            type="button"
            onClick={() => switchTo(tab.key)}
            aria-current={on ? "page" : undefined}
            className={`-mb-px min-h-11 shrink-0 border-b-2 px-1 pb-3 text-[15px] font-semibold transition ${
              on ? "border-gold-600 text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
