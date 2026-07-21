"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, Trash2 } from "lucide-react";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";

type Saved = {
  id: string;
  propertyType: string | null;
  listingType: string | null;
  district: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  minArea: number | null;
  rooms: string | null;
};

const tl = (n: number) => `₺${n.toLocaleString("tr-TR")}`;

function summary(s: Saved): string {
  const parts: string[] = [];
  if (s.district) parts.push(s.district);
  if (s.propertyType) parts.push(PROPERTY_TYPE_LABELS[s.propertyType] || s.propertyType);
  if (s.rooms) parts.push(s.rooms);
  if (s.minPrice && s.maxPrice) parts.push(`${tl(s.minPrice)}–${tl(s.maxPrice)}`);
  else if (s.maxPrice) parts.push(`≤ ${tl(s.maxPrice)}`);
  else if (s.minPrice) parts.push(`≥ ${tl(s.minPrice)}`);
  if (s.minArea) parts.push(`${s.minArea}+ m²`);
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
      <div className="rounded-lg bg-slate-50 p-5 ring-1 ring-stone">
        <p className="text-sm font-semibold text-slate-700">Kayıtlı aramalarınız</p>
        <p className="mt-1 text-xs text-slate-500">
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
    <div className="rounded-lg bg-paper p-5 ring-1 ring-stone">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Search className="h-4 w-4 text-brand-600" /> Kayıtlı aramalarım
      </p>
      <p className="mt-0.5 text-xs text-slate-500">Uygun yeni ilan geldiğinde bildirim alırsınız.</p>
      <ul className="mt-3 divide-y divide-slate-100">
        {(loaded ? items : []).map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-sm text-slate-700">{summary(s)}</span>
            <button
              type="button"
              onClick={() => remove(s.id)}
              aria-label="Kayıtlı aramayı kaldır"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Kaldır
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
