"use client";

import { useState } from "react";
import { useUtm } from "@/lib/useUtm";
import { trackConversion } from "@/lib/track";

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
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Gönderilemedi");
      trackConversion({ type, listingId, district });
      setStatus("ok");
      onDone?.();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center">
        <div className="text-3xl">✅</div>
        <h3 className="mt-2 text-lg font-bold text-green-800">Talebiniz alındı!</h3>
        <p className="mt-1 text-sm text-green-700">
          En kısa sürede sizi arayacağız. İlginiz için teşekkürler.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!compact && (
        <div>
          <h3 className="text-lg font-bold text-slate-900">{cfg.title}</h3>
          {listingTitle && (
            <p className="text-xs text-slate-500 mt-0.5">İlan: {listingTitle}</p>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          name="name"
          required
          placeholder="Ad Soyad *"
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
        />
        <input
          name="phone"
          required
          type="tel"
          placeholder="Telefon *"
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
        />
      </div>
      <input
        name="email"
        type="email"
        placeholder="E-posta (opsiyonel)"
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
      />
      {cfg.showDate && (
        <input
          name="preferredDate"
          type="text"
          placeholder="Tercih ettiğiniz gün/saat (örn: Cumartesi 14:00)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
        />
      )}
      <textarea
        name="message"
        rows={compact ? 2 : 3}
        placeholder={cfg.messagePlaceholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
      />
      {status === "error" && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-brand-700 px-4 py-3 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-60 transition"
      >
        {status === "loading" ? "Gönderiliyor..." : cfg.cta}
      </button>
      <p className="text-[11px] text-slate-400 text-center">
        Bilgileriniz yalnızca sizinle iletişim için kullanılır.
      </p>
    </form>
  );
}
