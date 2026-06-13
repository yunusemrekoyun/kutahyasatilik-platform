"use client";

import { useState } from "react";
import { useUtm } from "@/lib/useUtm";
import { DISTRICTS, PROPERTY_TYPES } from "@/lib/constants";
import ListingCard, { type ListingCardData } from "./ListingCard";

export default function BuyerAlertForm() {
  const utm = useUtm();
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [matches, setMatches] = useState<ListingCardData[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setStatus("loading");
    const fd = new FormData(e.currentTarget);
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

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none";

  if (status === "ok") {
    return (
      <div className="space-y-8">
        <div className="rounded-2xl bg-green-50 p-6 text-center ring-1 ring-green-200">
          <div className="text-4xl">✅</div>
          <h3 className="mt-3 text-xl font-bold text-slate-900">Talebiniz kaydedildi!</h3>
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
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <input name="name" required placeholder="Ad Soyad *" className={inputCls} />
        <input name="phone" required type="tel" placeholder="Telefon *" className={inputCls} />
      </div>
      <input name="email" type="email" placeholder="E-posta (opsiyonel)" className={inputCls} />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <select name="propertyType" defaultValue="" className={inputCls}>
          <option value="">Mülk türü (farketmez)</option>
          {PROPERTY_TYPES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select name="district" defaultValue="" className={inputCls}>
          <option value="">İlçe (farketmez)</option>
          {DISTRICTS.map((d) => (
            <option key={d.slug} value={d.name}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <input name="minPrice" type="number" min={0} inputMode="numeric" placeholder="Min. fiyat (₺)" className={inputCls} />
        <input name="maxPrice" type="number" min={0} inputMode="numeric" placeholder="Maks. fiyat (₺)" className={inputCls} />
        <input name="minArea" type="number" min={0} inputMode="numeric" placeholder="Min. m²" className={inputCls} />
      </div>

      <input name="rooms" placeholder="Oda sayısı (örn. 3+1 — opsiyonel)" className={inputCls} />
      <textarea name="note" rows={2} placeholder="Eklemek istedikleriniz (mahalle, özellik vb.)" className={inputCls} />

      {status === "error" && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-xl bg-gold-500 px-4 py-3.5 text-base font-bold text-brand-950 transition hover:bg-gold-400 disabled:opacity-60"
      >
        {status === "loading" ? "Aranıyor..." : "Talebimi Bırak & Uygun İlanları Gör →"}
      </button>
      <p className="text-center text-xs text-slate-500">
        Kriterlerinize uyan ilan geldiğinde size haber veririz. Spam yok, sadece size uygun fırsatlar.
      </p>
    </form>
  );
}
