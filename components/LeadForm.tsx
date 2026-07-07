"use client";

import { useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { useUtm } from "@/lib/useUtm";
import { trackAdsConversion } from "@/lib/track";
import { isValidTrPhone, TR_PHONE_ERROR } from "@/lib/validation";

type LeadType = "appointment" | "expertise" | "price_offer" | "contact";

const CONFIG: Record<LeadType, { title: string; cta: string; showDate?: boolean; messagePlaceholder: string }> = {
  appointment: {
    title: "Randevu Talep Et",
    cta: "Randevu Talebimi Gönder",
    showDate: true,
    messagePlaceholder: "Hangi gün/saat sizin için uygun? Eklemek istedikleriniz...",
  },
  expertise: {
    title: "Ücretsiz Ekspertiz İste",
    cta: "Ekspertiz Talebi Gönder",
    messagePlaceholder: "Mülk hakkında merak ettikleriniz...",
  },
  price_offer: {
    title: "Fiyat Teklifi Al",
    cta: "Teklifimi Gönder",
    messagePlaceholder: "Teklifiniz veya sormak istedikleriniz...",
  },
  contact: {
    title: "Bize Ulaşın",
    cta: "Mesajı Gönder",
    messagePlaceholder: "Mesajınız...",
  },
};

export default function LeadForm({
  type,
  listingId,
  listingTitle,
  district,
  compact = false,
  onDone,
}: {
  type: LeadType;
  listingId?: string;
  listingTitle?: string;
  district?: string;
  compact?: boolean;
  onDone?: () => void;
}) {
  const utm = useUtm();
  const cfg = CONFIG[type];
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      type,
      name: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      message: String(fd.get("message") || ""),
      preferredDate: String(fd.get("preferredDate") || ""),
      listingId,
      district,
      ...utm,
    };
    if (!isValidTrPhone(payload.phone)) {
      setStatus("error");
      setError(TR_PHONE_ERROR);
      return;
    }
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Gönderilemedi");
      trackAdsConversion({ type, listingId, district });
      setStatus("ok");
      onDone?.();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-green-600 ring-1 ring-green-200">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h3 className="mt-3 font-display text-lg font-bold text-green-800">Talebiniz alındı</h3>
        <p className="mt-1 text-sm text-green-700">
          En kısa sürede sizi arayacağız. İlginiz için teşekkürler.
        </p>
      </div>
    );
  }

  const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";
  const inputCls =
    "w-full h-12 rounded-[10px] border border-slate-300 bg-white px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!compact && (
        <div>
          <h3 className="font-display text-lg font-bold text-slate-900">{cfg.title}</h3>
          {listingTitle && (
            <p className="mt-0.5 text-[13px] text-slate-500">İlan: {listingTitle}</p>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lf-name" className={labelCls}>Ad Soyad <span className="text-red-500">*</span></label>
          <input id="lf-name" name="name" required placeholder="Adınız ve soyadınız" className={inputCls} />
        </div>
        <div>
          <label htmlFor="lf-phone" className={labelCls}>Telefon <span className="text-red-500">*</span></label>
          <input id="lf-phone" name="phone" required type="tel" inputMode="tel" placeholder="05__ ___ __ __" className={inputCls} />
        </div>
      </div>
      <div>
        <label htmlFor="lf-email" className={labelCls}>E-posta <span className="font-normal text-slate-400">(opsiyonel)</span></label>
        <input id="lf-email" name="email" type="email" placeholder="ornek@eposta.com" className={inputCls} />
      </div>
      {cfg.showDate && (
        <div>
          <label htmlFor="lf-date" className={labelCls}>Tercih ettiğiniz gün/saat</label>
          <input id="lf-date" name="preferredDate" type="text" placeholder="Örn: Cumartesi 14:00" className={inputCls} />
        </div>
      )}
      <div>
        <label htmlFor="lf-message" className={labelCls}>Mesajınız</label>
        <textarea id="lf-message" name="message" rows={compact ? 2 : 3} placeholder={cfg.messagePlaceholder} className={`${inputCls} h-auto py-3 leading-relaxed`} />
      </div>
      {status === "error" && (
        <p className="rounded-[10px] bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 ring-1 ring-red-200">{error}</p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-[10px] bg-brand-700 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
      >
        {status === "loading" ? "Gönderiliyor..." : cfg.cta}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-center text-[13px] text-slate-500">
        <Lock className="h-3.5 w-3.5" /> Bilgileriniz yalnızca sizinle iletişim için kullanılır.
      </p>
    </form>
  );
}
