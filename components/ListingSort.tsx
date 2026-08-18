"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { sortOptionsFor } from "@/lib/listingFilters";

export default function ListingSort() {
  const router = useRouter();
  const sp = useSearchParams();
  // Sıralama seçenekleri kategoriye bağlı: "en düşük kilometre" bir dairede,
  // "en büyük alan" bir telefonda anlamsız.
  const options = sortOptionsFor(sp.get("kategori") ?? undefined);

  function change(value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set("sira", value);
    else params.delete("sira");
    params.delete("sayfa");
    router.push(`/ilanlar?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2.5">
      <span className="hidden text-sm font-medium text-muted sm:inline">Sırala:</span>
      <div className="relative">
        <select
          value={sp.get("sira") || ""}
          onChange={(e) => change(e.target.value)}
          aria-label="Sıralama"
          className="h-11 appearance-none rounded-control border border-stone bg-paper py-2 pl-4 pr-10 text-[15px] font-medium text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        >
          {options.map((option) => (
            <option key={option.value || "default"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/70" />
      </div>
    </div>
  );
}
