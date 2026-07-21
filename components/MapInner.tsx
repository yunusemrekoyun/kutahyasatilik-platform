"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Star, MapPin, ArrowRight } from "lucide-react";
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

const PLACEHOLDER = "/placeholder-listing.webp";

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

  // Aynı/çok yakın koordinata düşen ilanların pinleri üst üste binip tıklanamaz
  // hale gelmesin diye, aynı noktadakileri küçük bir daire şeklinde yan yana dağıt.
  const spread = useMemo(() => {
    const groups = new Map<string, MapPoint[]>();
    for (const p of points) {
      const key = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`; // ~1 m çözünürlük
      const g = groups.get(key);
      if (g) g.push(p);
      else groups.set(key, [p]);
    }
    const out: (MapPoint & { dLat: number; dLng: number })[] = [];
    for (const g of groups.values()) {
      if (g.length === 1) {
        out.push({ ...g[0], dLat: g[0].lat, dLng: g[0].lng });
        continue;
      }
      const R = 0.00014; // ~15 m yarıçap
      const latAdj = Math.cos((g[0].lat * Math.PI) / 180) || 1; // boylamı enleme göre düzelt
      g.forEach((p, i) => {
        const a = (2 * Math.PI * i) / g.length;
        out.push({ ...p, dLat: p.lat + R * Math.cos(a), dLng: p.lng + (R * Math.sin(a)) / latAdj });
      });
    }
    return out;
  }, [points]);

  return (
    <div style={{ height }} className="h-full w-full overflow-hidden">
      <MapContainer center={c} zoom={z} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={c} zoom={z} />
        {spread.map((p) => {
          const specs = [
            p.propertyType ? PROPERTY_TYPE_LABELS[p.propertyType] || p.propertyType : null,
            p.rooms,
            p.areaGross ? `${p.areaGross} m²` : null,
          ].filter(Boolean).join(" · ");
          const loc = p.neighborhood ? `${p.neighborhood}, ${p.district}` : p.district;
          return (
            <Marker
              key={p.id}
              position={[p.dLat, p.dLng]}
              icon={pin(Boolean(p.featured))}
              eventHandlers={{ mouseover: (e) => e.target.openPopup() }}
            >
              <Popup className="ks-pop" maxWidth={240} minWidth={230} closeButton={false} autoPan>
                <a href={`/ilan/${p.slug}`} className="ks-pop-card">
                  <div className="ks-pop-img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbUrl(p.coverImage) || PLACEHOLDER} alt={p.title} />
                    {p.featured && <span className="ks-pop-badge inline-flex items-center gap-1"><Star className="h-3 w-3 fill-current" /> Öne Çıkan</span>}
                  </div>
                  <div className="ks-pop-body">
                    <p className="ks-pop-price">{formatPrice(p.price, p.currency)}</p>
                    <p className="ks-pop-title">{p.title}</p>
                    {specs && <p className="ks-pop-specs">{specs}</p>}
                    <p className="ks-pop-loc inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" /> {loc}</p>
                    <span className="ks-pop-cta inline-flex items-center gap-1">İlanı Gör <ArrowRight className="h-3.5 w-3.5 align-middle" /></span>
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
