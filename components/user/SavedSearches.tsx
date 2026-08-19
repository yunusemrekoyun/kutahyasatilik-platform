"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, Trash2 } from "lucide-react";
import { getSubTypeLabel, summarizeAttributes } from "@/lib/categories";
import { formatPrice } from "@/lib/format";

type Saved = {
  id: string;
  /** Eskiden yoktu; her arama emlak sanılıyordu. */
  category: string | null;
  attributes: Record<string, unknown> | null;
  propertyType: string | null;
  listingType: string | null;
  district: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  minArea: number | null;
  rooms: string | null;
};

// Para biçimi lib/format.formatPrice'tan. Burada yerel bir `tl` yardımcısı vardı
// ve simgeyi BAŞA koyuyordu ("₺4.750.000"); iki repodaki tek öne-yazan yerdi.
const tl = (n: number) => formatPrice(n, "TRY");

function summary(s: Saved): string {
  const parts: string[] = [];
  if (s.district) parts.push(s.district);
  // Alt tür etiketi kategoriye göre çözülür; emlak sözlüğü tüm kategorileri bilmiyor.
  if (s.propertyType) parts.push(getSubTypeLabel(s.category, s.propertyType));
  if (s.rooms) parts.push(s.rooms);
  if (s.minPrice && s.maxPrice) parts.push(`${tl(s.minPrice)}–${tl(s.maxPrice)}`);
  else if (s.maxPrice) parts.push(`≤ ${tl(s.maxPrice)}`);
  else if (s.minPrice) parts.push(`≥ ${tl(s.minPrice)}`);
  // m² YALNIZ emlakta anlamlı: bir telefon aramasında "128+ m²" saçmaydı.
  if (s.minArea && (!s.category || s.category === "emlak")) parts.push(`${s.minArea}+ m²`);
  parts.push(...summarizeAttributes(s.category, s.attributes));
  return parts.join(" · ") || "Tüm ilanlar";
}

export default function SavedSearches() {
  const [items, setItems] = useState<Saved[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/saved-searches");
      const d = await res.json();
      if (d?.ok) setItems(Array.isArray(d.items) ? d.items : []);
    } catch {
      /* sessiz */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function remove(id: string) {
    setItems((prev) => prev.filter((s) => s.id !== id));
    try {
      await fetch("/api/saved-searches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      /* sessiz */
    }
  }

  if (loaded && items.length === 0) {
    return (
      <div className="rounded-control bg-canvas p-5 ring-1 ring-stone">
        <p className="text-sm font-semibold text-ink">Kayıtlı aramalarınız</p>
        <p className="mt-1 text-xs text-muted">
          Henüz kayıtlı aramanız yok.{" "}
          <Link href="/alici-talebi" className="font-medium text-brand-700 hover:underline">
            Alıcı talebi
          </Link>{" "}
          oluşturun — uygun yeni ilan geldiğinde bildirim alın.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-control bg-paper p-5 ring-1 ring-stone">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Search className="h-4 w-4 text-brand-600" /> Kayıtlı aramalarım
      </p>
      <p className="mt-0.5 text-xs text-muted">Uygun yeni ilan geldiğinde bildirim alırsınız.</p>
      <ul className="mt-3 divide-y divide-stone">
        {(loaded ? items : []).map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-sm text-ink">{summary(s)}</span>
            <button
              type="button"
              onClick={() => remove(s.id)}
              aria-label="Kayıtlı aramayı kaldır"
              className="inline-flex items-center gap-1 rounded-control px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Kaldır
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
