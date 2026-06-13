"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { KUTAHYA_CENTER, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { thumbUrl } from "@/lib/media";

export type MapPoint = {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  district: string;
  neighborhood?: string | null;
  propertyType?: string;
  rooms?: string | null;
  areaGross?: number | null;
  featured?: boolean;
  coverImage?: string | null;
  lat: number;
  lng: number;
};

const PLACEHOLDER = "https://picsum.photos/seed/kshome/400/260";

function pin(featured: boolean) {
  const color = featured ? "#e6a817" : "#1557e1";
  return L.divIcon({
    className: "ks-pin",
    html: `<div style="background:${color};width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -24],
  });
}

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

export default function MapInner({
  points,
  center,
  zoom,
  height = "100%",
}: {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}) {
  const c: [number, number] = center ?? [KUTAHYA_CENTER.lat, KUTAHYA_CENTER.lng];
  const z = zoom ?? KUTAHYA_CENTER.zoom;

  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-2xl ring-1 ring-slate-200">
      <MapContainer center={c} zoom={z} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={c} zoom={z} />
        {points.map((p) => {
          const specs = [
            p.propertyType ? PROPERTY_TYPE_LABELS[p.propertyType] || p.propertyType : null,
            p.rooms,
            p.areaGross ? `${p.areaGross} m²` : null,
          ].filter(Boolean).join(" · ");
          const loc = p.neighborhood ? `${p.neighborhood}, ${p.district}` : p.district;
          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={pin(Boolean(p.featured))}
              eventHandlers={{ mouseover: (e) => e.target.openPopup() }}
            >
              <Popup className="ks-pop" maxWidth={240} minWidth={230} closeButton={false} autoPan>
                <a href={`/ilan/${p.slug}`} className="ks-pop-card">
                  <div className="ks-pop-img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbUrl(p.coverImage) || PLACEHOLDER} alt={p.title} />
                    {p.featured && <span className="ks-pop-badge">★ Öne Çıkan</span>}
                  </div>
                  <div className="ks-pop-body">
                    <p className="ks-pop-price">{formatPrice(p.price, p.currency)}</p>
                    <p className="ks-pop-title">{p.title}</p>
                    {specs && <p className="ks-pop-specs">{specs}</p>}
                    <p className="ks-pop-loc">📍 {loc}</p>
                    <span className="ks-pop-cta">İlanı Gör →</span>
                  </div>
                </a>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
