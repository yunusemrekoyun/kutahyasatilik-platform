"use client";

import { useMemo, useState } from "react";
import { BarChart3, Tag, CheckCircle2 } from "lucide-react";
import { useUtm } from "@/lib/useUtm";
import { trackConversion } from "@/lib/track";
import { DISTRICTS, PROPERTY_TYPES } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { estimateValue } from "@/lib/valuation";
import type { DistrictStat } from "@/lib/districtStats";

const ROOM_OPTIONS = ["1+0", "1+1", "2+1", "3+1", "4+1", "4+2", "5+1"];
const LAND_TYPES = new Set(["arsa", "tarla"]);
const FALLBACK_DISTRICT = "Merkez";

export default function ValuationTool({
  stats,
}: {
  stats: Record<string, DistrictStat>;
}) {
  const utm = useUtm();

  const [district, setDistrict] = useState("");
  const [propertyType, setPropertyType] = useState("daire");
  const [area, setArea] = useState("");
  const [rooms, setRooms] = useState("3+1");

  const [showLead, setShowLead] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  const isLand = LAND_TYPES.has(propertyType);

  const result = useMemo(() => {
    const areaNum = parseInt(area, 10);
    if (!district || !areaNum || areaNum <= 0) return null;
    return estimateValue(
      { propertyType, district, area: areaNum, rooms: isLand ? undefined : rooms },
      stats[district],
      stats[FALLBACK_DISTRICT]
    );
  }, [district, propertyType, area, rooms, isLand, stats]);

  async function handleLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!result) return;
    setError("");
    setStatus("loading");
    const typeLabel =
      PROPERTY_TYPES.find((p) => p.value === propertyType)?.label || propertyType;
    const summary =
      `Online değerleme talebi — ${district} / ${typeLabel} / ${area} m²` +
      (isLand ? "" : ` / ${rooms}`) +
      `. Tahmini aralık: ${formatPrice(result.low)} – ${formatPrice(result.high)}.`;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "expertise",
          name,
          phone,
          district,
          propertyType: typeLabel,
          estimatedPrice: formatPrice(result.mid),
          message: summary,
          ...utm,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Gönderilemedi");
      trackConversion({ type: "expertise", district });
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none";

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
      <div className="grid md:grid-cols-2">
        {/* SOL: Form */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <BarChart3 className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">Mülk Bilgileri</h2>
          </div>

          <div className="mt-5 space-y-3.5">
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className={inputCls}
            >
              <option value="" disabled>
                İlçe seçin
              </option>
              {DISTRICTS.map((d) => (
                <option key={d.slug} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3.5">
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className={inputCls}
              >
                {PROPERTY_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Alan (m²)"
                className={inputCls}
              />
            </div>

            {!isLand && (
              <select
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                className={inputCls}
              >
                {ROOM_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
            * Tahmin; ilçe ortalama m² değerleri ve mülk özelliklerine dayalı otomatik
            bir ön değerlendirmedir. Kesin değer için ücretsiz ekspertiz talep edin.
          </p>
        </div>

        {/* SAĞ: Sonuç */}
        <div className="bg-gradient-to-br from-brand-800 to-brand-950 p-6 text-white sm:p-8">
          {!result ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center text-brand-200">
              <Tag className="h-10 w-10 text-brand-200" />
              <p className="mt-3 text-sm">
                İlçe ve alanı girin, tahmini değer aralığını anında görün.
              </p>
            </div>
          ) : status === "ok" ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-12 w-12 text-green-400" />
              <h3 className="mt-3 text-xl font-bold">Talebiniz alındı!</h3>
              <p className="mt-2 text-sm text-brand-100">
                Uzmanımız en kısa sürede sizi arayıp ücretsiz, yerinde ekspertiz için
                randevu oluşturacak.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-gold-300">
                Tahmini Değer Aralığı
              </p>
              <p className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                {formatPrice(result.low)}
              </p>
              <p className="text-sm text-brand-200">—</p>
              <p className="font-display text-2xl font-bold sm:text-3xl">
                {formatPrice(result.high)}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm ring-1 ring-white/20">
                Yaklaşık <strong>{formatPrice(result.mid)}</strong>
              </div>
              <p className="mt-3 text-xs text-brand-200">
                Ortalama m² değeri: {formatPrice(result.perM2)}
              </p>

              {!showLead ? (
                <button
                  onClick={() => setShowLead(true)}
                  className="mt-6 w-full rounded-xl bg-gold-500 px-4 py-3.5 text-base font-bold text-brand-950 transition hover:bg-gold-400"
                >
                  Ücretsiz Detaylı Ekspertiz İste →
                </button>
              ) : (
                <form onSubmit={handleLead} className="mt-6 space-y-3">
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ad Soyad *"
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3.5 py-3 text-sm text-white placeholder:text-brand-200 outline-none focus:border-gold-400"
                  />
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Telefon *"
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3.5 py-3 text-sm text-white placeholder:text-brand-200 outline-none focus:border-gold-400"
                  />
                  {status === "error" && (
                    <p className="text-sm text-red-300">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full rounded-xl bg-gold-500 px-4 py-3.5 text-base font-bold text-brand-950 transition hover:bg-gold-400 disabled:opacity-60"
                  >
                    {status === "loading" ? "Gönderiliyor..." : "Ekspertiz Talebini Gönder"}
                  </button>
                  <p className="text-center text-[11px] text-brand-200">
                    Bilgileriniz yalnızca sizinle iletişim için kullanılır.
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
