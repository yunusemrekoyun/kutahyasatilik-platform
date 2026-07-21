"use client";

import dynamic from "next/dynamic";
import type { HeatPoint } from "./PriceHeatmapInner";

const Inner = dynamic(() => import("./PriceHeatmapInner"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center rounded-lg bg-slate-100 text-slate-400">
      Harita yükleniyor...
    </div>
  ),
});

export default function PriceHeatmap({
  points,
  height = "460px",
}: {
  points: HeatPoint[];
  height?: string;
}) {
  return (
    <div style={{ height }}>
      <Inner points={points} />
    </div>
  );
}
