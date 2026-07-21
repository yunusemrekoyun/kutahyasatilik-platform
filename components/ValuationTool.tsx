"use client";

import { useMemo, useState } from "react";
import { BarChart3, Tag, CheckCircle2, Lock } from "lucide-react";
import { useUtm } from "@/lib/useUtm";
import { trackAdsConversion } from "@/lib/track";
import { DISTRICTS, PROPERTY_TYPES } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { estimateValue } from "@/lib/valuation";
import type { DistrictStat } from "@/lib/districtStats";
import LoginRequiredNotice from "@/components/LoginRequiredNotice";

const ROOM_OPTIONS = ["1+0", "1+1", "2+1", "3+1", "4+1", "4+2", "5+1"];
const LAND_TYPES = new Set(["arsa", "tarla"]);
const FALLBACK_DISTRICT = "Merkez";

export default function ValuationTool({
  stats,
  isLoggedIn = true,
  defaultName = "",
}: {
  stats: Record<string, DistrictStat>;
  isLoggedIn?: boolean;
  defaultName?: string;
}) {
  const utm = useUtm();

  const [district, setDistrict] = useState("");
  const [propertyType, setPropertyType] = useState("daire");
  const [area, setArea] = useState("");
  const [rooms, setRooms] = useState("3+1");

  const [showLead, setShowLead] = useState(false);
  const [name, setName] = useState(defaultName);
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
      trackAdsConversion({ type: "expertise", district });
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  }

  const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";
  const inputCls =
    "w-full h-12 rounded-[10px] border border-slate-300 bg-paper px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

  return (
    <div className="overflow-hidden rounded-lg bg-paper shadow-prestige ring-1 ring-stone">
      <div className="grid md:grid-cols-2">
        {/* SOL: Form */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-brand-700" strokeWidth={1.7} />
            <h2 className="font-display text-lg font-bold text-slate-900">Mülk Bilgileri</h2>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="vt-district" className={labelCls}>İlçe</label>
              <select
                id="vt-district"
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="vt-type" className={labelCls}>Mülk Türü</label>
                <select
                  id="vt-type"
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
              </div>
              <div>
                <label htmlFor="vt-area" className={labelCls}>Alan (m²)</label>
                <input
                  id="vt-area"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Örn. 120"
                  className={inputCls}
                />
              </div>
            </div>

            {!isLand && (
              <div>
                <label htmlFor="vt-rooms" className={labelCls}>Oda Sayısı</label>
                <select
                  id="vt-rooms"
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
              </div>
            )}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            * Tahmin; ilçe ortalama m² değerleri ve girilen mülk özelliklerine dayalı
            otomatik bir ön değerlendirmedir; resmi ekspertiz değildir. Kesin değer için ücretsiz ekspertiz talep edin.
          </p>
        </div>

        {/* SAĞ: Sonuç */}
        <div className="bg-brand-950 p-6 text-white sm:p-8">
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
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-paper/10 px-3 py-1.5 text-sm ring-1 ring-white/20">
                Yaklaşık <strong>{formatPrice(result.mid)}</strong>
              </div>
              <p className="mt-3 text-xs text-brand-200">
                Ortalama m² değeri: {formatPrice(result.perM2)}
              </p>

              {!showLead ? (
                <button
                  onClick={() => setShowLead(true)}
                  className="mt-6 w-full rounded-[10px] bg-paper px-4 py-3.5 text-base font-semibold text-brand-800 transition hover:bg-brand-50"
                >
                  Ücretsiz Detaylı Ekspertiz İste
                </button>
              ) : !isLoggedIn ? (
                <div className="mt-6">
                  <LoginRequiredNotice text="Ekspertiz talebi için giriş yapın" />
                </div>
              ) : (
                <form onSubmit={handleLead} className="mt-6 space-y-3">
                  <div>
                    <label htmlFor="vt-name" className="mb-1.5 block text-sm font-semibold text-brand-100">Ad Soyad <span className="text-gold-300">*</span></label>
                    <input
                      id="vt-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Adınız ve soyadınız"
                      className="h-12 w-full rounded-[10px] border border-white/20 bg-paper/10 px-3.5 text-base text-white outline-none transition placeholder:text-brand-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                    />
                  </div>
                  <div>
                    <label htmlFor="vt-phone" className="mb-1.5 block text-sm font-semibold text-brand-100">Telefon <span className="text-gold-300">*</span></label>
                    <input
                      id="vt-phone"
                      required
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05__ ___ __ __"
                      className="h-12 w-full rounded-[10px] border border-white/20 bg-paper/10 px-3.5 text-base text-white outline-none transition placeholder:text-brand-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                    />
                  </div>
                  {status === "error" && (
                    <p className="rounded-[10px] bg-red-500/15 px-3.5 py-2.5 text-sm font-medium text-red-200 ring-1 ring-red-400/30">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full rounded-[10px] bg-paper px-4 py-3.5 text-base font-semibold text-brand-800 transition hover:bg-brand-50 disabled:opacity-60"
                  >
                    {status === "loading" ? "Gönderiliyor..." : "Ekspertiz Talebini Gönder"}
                  </button>
                  <p className="flex items-center justify-center gap-1.5 text-center text-[13px] text-brand-200">
                    <Lock className="h-3.5 w-3.5" /> Bilgileriniz yalnızca iletişim için kullanılır.
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
