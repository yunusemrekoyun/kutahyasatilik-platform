"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { KUTAHYA_CENTER } from "@/lib/constants";

const Inner = dynamic(() => import("./LocationPickerInner"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-slate-100 text-sm text-slate-400">
      Harita yükleniyor...
    </div>
  ),
});

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

export default function LocationPicker({
  initialLat = null,
  initialLng = null,
  latName = "lat",
  lngName = "lng",
}: {
  initialLat?: number | null;
  initialLng?: number | null;
  latName?: string;
  lngName?: string;
}) {
  const hasInitial = initialLat != null && initialLng != null;
  const [lat, setLat] = useState<number | null>(initialLat);
  const [lng, setLng] = useState<number | null>(initialLng);
  const [center, setCenter] = useState<[number, number]>(
    hasInitial ? [initialLat as number, initialLng as number] : [KUTAHYA_CENTER.lat, KUTAHYA_CENTER.lng]
  );
  const [zoom, setZoom] = useState<number>(hasInitial ? 16 : KUTAHYA_CENTER.zoom);
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState("");

  function pick(la: number, ln: number) {
    setLat(la);
    setLng(ln);
    setErr("");
  }

  async function search() {
    const query = q.trim();
    if (!query) return;
    setSearching(true);
    setErr("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { "Accept-Language": "tr" } }
      );
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        const la = parseFloat(data[0].lat);
        const ln = parseFloat(data[0].lon);
        setLat(la);
        setLng(ln);
        setCenter([la, ln]);
        setZoom(16);
      } else {
        setErr("Adres bulunamadı. Daha genel bir arama deneyin.");
      }
    } catch {
      setErr("Arama yapılamadı (internet bağlantısı gerekli).");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={latName} value={lat ?? ""} readOnly />
      <input type="hidden" name={lngName} value={lng ?? ""} readOnly />

      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
          placeholder="Adres ara: örn. Cumhuriyet Mah. Kütahya"
          className={inputCls}
        />
        <button
          type="button"
          onClick={search}
          disabled={searching}
          className="shrink-0 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
        >
          {searching ? "Aranıyor..." : "Ara"}
        </button>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}

      <div className="h-72 overflow-hidden rounded-xl ring-1 ring-slate-200">
        <Inner lat={lat} lng={lng} center={center} zoom={zoom} onPick={pick} />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-slate-500">Haritaya tıklayın veya pini sürükleyin.</span>
        <code className="rounded bg-slate-900 px-2 py-1 text-xs text-emerald-300">
          {lat != null && lng != null ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : "lat: — , lng: —"}
        </code>
        {lat != null && (
          <button
            type="button"
            onClick={() => {
              setLat(null);
              setLng(null);
            }}
            className="text-xs text-slate-500 underline hover:text-slate-700"
          >
            Konumu temizle
          </button>
        )}
      </div>
    </div>
  );
}
