"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Lock } from "lucide-react";
import { useUtm } from "@/lib/useUtm";
import { isValidTrPhone, TR_PHONE_ERROR } from "@/lib/validation";
import { DISTRICTS, PROPERTY_TYPES } from "@/lib/constants";
import ListingCard, { type ListingCardData } from "./ListingCard";
import ThousandsInput from "@/components/ThousandsInput";

export default function BuyerAlertForm() {
  const utm = useUtm();
  const sp = useSearchParams(); // /ilanlar filtresinden taşınan kriterler (propertyType, district, ...)
  const prefilled = ["propertyType", "district", "minPrice", "maxPrice", "minArea", "rooms"].some((k) => sp.get(k));
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [matches, setMatches] = useState<ListingCardData[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setStatus("loading");
    const fd = new FormData(e.currentTarget);
    if (!isValidTrPhone(String(fd.get("phone") || ""))) {
      setStatus("error");
      setError(TR_PHONE_ERROR);
      return;
    }
    try {
      const payload = {
        name: fd.get("name"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        propertyType: fd.get("propertyType"),
        district: fd.get("district"),
        minPrice: fd.get("minPrice") || undefined,
        maxPrice: fd.get("maxPrice") || undefined,
        minArea: fd.get("minArea") || undefined,
        rooms: fd.get("rooms"),
        note: fd.get("note"),
        ...utm,
      };
      const res = await fetch("/api/buyer-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Gönderilemedi");
      setMatches(data.matches || []);
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  }

  const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";
  const inputCls =
    "w-full h-12 rounded-[10px] border border-slate-300 bg-paper px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

  if (status === "ok") {
    return (
      <div className="space-y-8">
        <div className="rounded-lg bg-green-50 p-6 text-center ring-1 ring-green-200">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-paper text-green-600 ring-1 ring-green-200">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h3 className="mt-4 font-display text-xl font-bold text-slate-900">Talebiniz kaydedildi</h3>
          <p className="mt-2 text-sm text-slate-600">
            Kriterlerinize uygun yeni bir ilan geldiğinde uzmanımız sizi arayacak.
            {matches.length > 0
              ? ` Şu an kriterlerinize uyan ${matches.length} ilan var, aşağıda:`
              : " Şu an birebir uygun ilan yok ama yeni gelenleri sizinle paylaşacağız."}
          </p>
        </div>

        {matches.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <ListingCard key={m.slug} listing={m} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {prefilled && (
        <p className="rounded-[10px] bg-brand-50 px-3.5 py-2.5 text-sm text-brand-800 ring-1 ring-brand-100">
          Arama kriterleriniz forma taşındı. Ad ve telefonunuzu ekleyip kaydedin; uygun ilan geldiğinde haber verelim.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ba-name" className={labelCls}>Ad Soyad <span className="text-red-500">*</span></label>
          <input id="ba-name" name="name" required placeholder="Adınız ve soyadınız" className={inputCls} />
        </div>
        <div>
          <label htmlFor="ba-phone" className={labelCls}>Telefon <span className="text-red-500">*</span></label>
          <input id="ba-phone" name="phone" required type="tel" inputMode="tel" placeholder="05__ ___ __ __" className={inputCls} />
        </div>
      </div>
      <div>
        <label htmlFor="ba-email" className={labelCls}>E-posta <span className="font-normal text-slate-400">(opsiyonel)</span></label>
        <input id="ba-email" name="email" type="email" placeholder="ornek@eposta.com" className={inputCls} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ba-type" className={labelCls}>Mülk Türü</label>
          <select id="ba-type" name="propertyType" defaultValue={sp.get("propertyType") || ""} className={inputCls}>
            <option value="">Farketmez</option>
            {PROPERTY_TYPES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ba-district" className={labelCls}>İlçe</label>
          <select id="ba-district" name="district" defaultValue={sp.get("district") || ""} className={inputCls}>
            <option value="">Farketmez</option>
            {DISTRICTS.map((d) => (
              <option key={d.slug} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="ba-min" className={labelCls}>Min. Fiyat</label>
          <ThousandsInput id="ba-min" name="minPrice" placeholder="₺" defaultValue={sp.get("minPrice") || ""} className={inputCls} />
        </div>
        <div>
          <label htmlFor="ba-max" className={labelCls}>Maks. Fiyat</label>
          <ThousandsInput id="ba-max" name="maxPrice" placeholder="₺" defaultValue={sp.get("maxPrice") || ""} className={inputCls} />
        </div>
        <div>
          <label htmlFor="ba-area" className={labelCls}>Min. m²</label>
          <input id="ba-area" name="minArea" type="number" min={0} inputMode="numeric" placeholder="m²" defaultValue={sp.get("minArea") || ""} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ba-rooms" className={labelCls}>Oda Sayısı</label>
          <input id="ba-rooms" name="rooms" placeholder="Örn. 3+1 (opsiyonel)" defaultValue={sp.get("rooms") || ""} className={inputCls} />
        </div>
        <div>
          <label htmlFor="ba-note" className={labelCls}>Eklemek istedikleriniz</label>
          <input id="ba-note" name="note" placeholder="Mahalle, özellik vb." className={inputCls} />
        </div>
      </div>

      {status === "error" && (
        <p className="rounded-[10px] bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 ring-1 ring-red-200">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-[10px] bg-brand-700 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
      >
        {status === "loading" ? "Aranıyor..." : "Talebimi Bırak ve Uygun İlanları Gör"}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-center text-[13px] text-slate-500">
        <Lock className="h-3.5 w-3.5" /> Kriterlerinize uyan ilan geldiğinde haber veririz. Spam göndermiyoruz.
      </p>
    </form>
  );
}
