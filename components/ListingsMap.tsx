"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { DISTRICTS, KUTAHYA_CENTER } from "@/lib/constants";
import type { MapPoint } from "./MapInner";

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center rounded-lg bg-slate-100 text-slate-400">
      Harita yükleniyor...
    </div>
  ),
});

export default function ListingsMap({
  points,
  height = "520px",
  showFilter = true,
}: {
  points: MapPoint[];
  height?: string;
  showFilter?: boolean;
}) {
  const [active, setActive] = useState<string>("");

  const filtered = useMemo(
    () => (active ? points.filter((p) => p.district === active) : points),
    [points, active]
  );

  const center: [number, number] = useMemo(() => {
    const d = DISTRICTS.find((x) => x.name === active);
    return d ? [d.lat, d.lng] : [KUTAHYA_CENTER.lat, KUTAHYA_CENTER.lng];
  }, [active]);

  const zoom = active ? 12 : KUTAHYA_CENTER.zoom;

  // Sadece ilan bulunan ilçeleri filtre olarak göster
  const districtsWithCount = useMemo(() => {
    const counts = new Map<string, number>();
    points.forEach((p) => counts.set(p.district, (counts.get(p.district) || 0) + 1));
    return DISTRICTS.filter((d) => counts.has(d.name)).map((d) => ({
      ...d,
      count: counts.get(d.name) || 0,
    }));
  }, [points]);

  return (
    <div className="relative flex min-h-0 flex-col bg-paper" style={{ height }}>
      {showFilter && (
        <div className="flex shrink-0 items-center gap-3 overflow-x-auto border-b border-stone px-4 py-3 sm:px-5">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-muted">İlçe</span>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setActive("")}
              aria-pressed={!active}
              className={`min-h-10 shrink-0 rounded-lg px-4 text-sm font-semibold transition ${
                !active ? "bg-brand-800 text-white" : "border border-stone bg-paper text-ink hover:border-brand-300 hover:text-brand-800"
              }`}
            >
              Tümü <span className="ml-1 tabular-nums opacity-70">{points.length}</span>
            </button>
            {districtsWithCount.map((d) => (
              <button
                type="button"
                key={d.slug}
                onClick={() => setActive(d.name)}
                aria-pressed={active === d.name}
                className={`min-h-10 shrink-0 rounded-lg px-4 text-sm font-semibold transition ${
                  active === d.name ? "bg-brand-800 text-white" : "border border-stone bg-paper text-ink hover:border-brand-300 hover:text-brand-800"
                }`}
              >
                {d.name} <span className="ml-1 tabular-nums opacity-70">{d.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="min-h-0 flex-1">
        <MapInner points={filtered} center={center} zoom={zoom} />
      </div>
      {filtered.length === 0 && (
        <p className="absolute inset-x-4 bottom-4 rounded-lg bg-paper/95 px-4 py-3 text-center text-sm text-muted shadow-lg">
          Bu bölgede haritada gösterilecek ilan bulunamadı.
        </p>
      )}
    </div>
  );
}
