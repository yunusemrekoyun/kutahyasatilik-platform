"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { DISTRICTS, KUTAHYA_CENTER } from "@/lib/constants";
import type { MapPoint } from "./MapInner";

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center rounded-2xl bg-slate-100 text-slate-400">
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
    <div>
      {showFilter && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActive("")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              !active ? "bg-brand-700 text-white" : "bg-white text-slate-700 ring-1 ring-slate-300 hover:ring-brand-300"
            }`}
          >
            Tümü ({points.length})
          </button>
          {districtsWithCount.map((d) => (
            <button
              key={d.slug}
              onClick={() => setActive(d.name)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active === d.name ? "bg-brand-700 text-white" : "bg-white text-slate-700 ring-1 ring-slate-300 hover:ring-brand-300"
              }`}
            >
              {d.name} ({d.count})
            </button>
          ))}
        </div>
      )}
      <div style={{ height }}>
        <MapInner points={filtered} center={center} zoom={zoom} />
      </div>
      {filtered.length === 0 && (
        <p className="mt-3 text-center text-sm text-slate-500">
          Bu bölgede haritada gösterilecek ilan bulunamadı.
        </p>
      )}
    </div>
  );
}
