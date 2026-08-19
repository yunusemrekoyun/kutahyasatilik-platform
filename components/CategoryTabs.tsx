"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORY_LIST, isCategoryKey } from "@/lib/categories";
import { sortOptionsFor } from "@/lib/listingFilters";

/**
 * Kategori seçilmemiş hâl. Artık bir SEKME DEĞİL: "Tümü" girişi kaldırıldı,
 * kullanıcı kategori seçmeden liste görmüyor (kategorisiz /ilanlar kategori
 * seçim ekranı gösteriyor). Sabit yalnız "seçili değil" durumunu temsil ediyor.
 */
const NONE = "";

/**
 * Kategori değişince taşınacak filtreler. Geri kalan her şey bilerek düşer:
 * bir kategorinin alt türü (daire) ve nitelikleri (yakıt) ötekinde anlamsızdır
 * ve taşınırlarsa hiç sonuç dönmeyen bir sorgu üretirler.
 */
const CARRY_OVER = ["q", "ilce", "min", "max"];

export default function CategoryTabs() {
  const router = useRouter();
  const sp = useSearchParams();
  const param = sp.get("kategori");
  const active = isCategoryKey(param) ? param : NONE;

  function switchTo(key: string) {
    const next = new URLSearchParams();
    for (const param of CARRY_OVER) {
      const value = sp.get(param);
      if (value) next.set(param, value);
    }
    next.set("kategori", key);
    // Sıralama KOŞULLU taşınır. Fiyat/tarih her kategoride geçerli ama
    // "Kilometre (Azdan)" bir dairede yok: koşulsuz taşındığında buildOrderBy
    // bilinmeyen değeri sessizce varsayılana düşürüyor, açılır menü ise hâlâ
    // "Önerilen" gösteriyordu — kullanıcı sıralamayı seçili sanıp rastgele bir
    // sıra görüyordu. Hedef kategoride tanımlıysa taşı, değilse düşür.
    const sort = sp.get("sira");
    if (sort && sortOptionsFor(key).some((option) => option.value === sort)) {
      next.set("sira", sort);
    }
    const qs = next.toString();
    router.push(`/ilanlar${qs ? `?${qs}` : ""}`);
  }

  const tabs = CATEGORY_LIST.map((c) => ({ key: c.key as string, label: c.label }));

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
