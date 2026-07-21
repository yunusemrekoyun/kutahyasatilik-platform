"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { KUTAHYA_CENTER } from "@/lib/constants";
import { formatNumber } from "@/lib/format";

export type HeatPoint = {
  name: string;
  lat: number;
  lng: number;
  avgPriceArsaM2: number | null;
  avgPriceDaire: number | null;
  count: number;
};

function colorFor(value: number, min: number, max: number): string {
  if (max <= min) return "hsl(40, 80%, 50%)";
  const t = (value - min) / (max - min); // 0 ucuz → 1 pahalı
  const hue = 130 - t * 130; // 130 yeşil → 0 kırmızı
  return `hsl(${hue}, 75%, 48%)`;
}

export default function PriceHeatmapInner({
  points,
  height = "100%",
}: {
  points: HeatPoint[];
  height?: string;
}) {
  const valued = points.filter((p) => p.avgPriceArsaM2 != null);
  const vals = valued.map((p) => p.avgPriceArsaM2 as number);
  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 1;

  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-lg ring-1 ring-stone">
      <MapContainer
        center={[KUTAHYA_CENTER.lat, KUTAHYA_CENTER.lng]}
        zoom={KUTAHYA_CENTER.zoom}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => {
          const m2 = p.avgPriceArsaM2;
          const color = m2 != null ? colorFor(m2, min, max) : "#94a3b8";
          return (
            <CircleMarker
              key={p.name}
              center={[p.lat, p.lng]}
              radius={16}
              pathOptions={{ color: "#fff", weight: 2, fillColor: color, fillOpacity: 0.85 }}
              eventHandlers={{ mouseover: (e) => e.target.openPopup() }}
            >
              <Popup closeButton={false} autoPan>
                <div style={{ minWidth: 150 }}>
                  <strong style={{ color: "#1e3a6b" }}>{p.name}</strong>
                  <div style={{ fontSize: 12, marginTop: 2 }}>
                    {m2 != null ? <>Arsa m²: <b>{formatNumber(m2)} ₺</b></> : "Veri yok"}
                  </div>
                  {p.avgPriceDaire != null && (
                    <div style={{ fontSize: 12 }}>Ort. daire: <b>{formatNumber(p.avgPriceDaire)} ₺</b></div>
                  )}
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{p.count} aktif ilan</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
