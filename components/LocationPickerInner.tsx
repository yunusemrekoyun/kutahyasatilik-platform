"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Varsayılan Leaflet marker görseli (asset yolu sorunlu) yerine divIcon kullanıyoruz —
// MapInner ile aynı görünüm.
const markerIcon = L.divIcon({
  className: "ks-pin",
  html: `<div style="background:#1557e1;width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Sadece `center`/`zoom` (adres aramasıyla) değiştiğinde haritayı taşır.
// Tıklama/sürükleme center'ı değiştirmediği için harita o sırada zıplamaz.
function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

export default function LocationPickerInner({
  lat,
  lng,
  center,
  zoom,
  onPick,
}: {
  lat: number | null;
  lng: number | null;
  center: [number, number];
  zoom: number;
  onPick: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      <Recenter center={center} zoom={zoom} />
      {lat != null && lng != null && (
        <Marker
          position={[lat, lng]}
          icon={markerIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = (e.target as L.Marker).getLatLng();
              onPick(p.lat, p.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
