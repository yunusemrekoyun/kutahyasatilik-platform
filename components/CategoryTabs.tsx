"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORY_LIST, getCategory } from "@/lib/categories";

/**
 * Kategori değişince taşınacak filtreler. Geri kalan her şey bilerek düşer:
 * bir kategorinin alt türü (daire) ve nitelikleri (yakıt) ötekinde anlamsızdır
 * ve taşınırlarsa hiç sonuç dönmeyen bir sorgu üretirler.
 */
const CARRY_OVER = ["q", "ilce", "min", "max", "sira"];

export default function CategoryTabs() {
  const router = useRouter();
  const sp = useSearchParams();
  const active = getCategory(sp.get("kategori")).key;

  function switchTo(key: string) {
    const next = new URLSearchParams();
    for (const param of CARRY_OVER) {
      const value = sp.get(param);
      if (value) next.set(param, value);
    }
    // Emlak varsayılan; URL'i gereksiz parametreyle kirletmiyoruz.
    if (key !== "emlak") next.set("kategori", key);
    const qs = next.toString();
    router.push(`/ilanlar${qs ? `?${qs}` : ""}`);
  }

  return (
    <nav aria-label="Kategoriler" className="mb-8 flex gap-7 overflow-x-auto border-b border-stone">
      {CATEGORY_LIST.map((category) => {
        const on = category.key === active;
        return (
          <button
            key={category.key}
            type="button"
            onClick={() => switchTo(category.key)}
            aria-current={on ? "page" : undefined}
            className={`-mb-px min-h-11 shrink-0 border-b-2 px-1 pb-3 text-[15px] font-semibold transition ${
              on ? "border-gold-600 text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {category.label}
          </button>
        );
      })}
    </nav>
  );
}
