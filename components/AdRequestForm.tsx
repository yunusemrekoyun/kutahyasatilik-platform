"use client";

import { useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { isValidTrPhone, TR_PHONE_ERROR } from "@/lib/validation";

const inputCls =
  "w-full h-12 rounded-[10px] border border-slate-300 bg-paper px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";
const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";

export default function AdRequestForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const fd = new FormData(e.currentTarget);
    if (!isValidTrPhone(String(fd.get("phone") || ""))) {
      setStatus("error");
      setError(TR_PHONE_ERROR);
      return;
    }
    try {
      const res = await fetch("/api/ad-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          company: fd.get("company"),
          phone: fd.get("phone"),
          email: fd.get("email"),
          message: fd.get("message"),
          website: fd.get("website"),
        }),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || "Gönderilemedi");
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-paper text-green-600 ring-1 ring-green-200">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h3 className="mt-3 font-display text-lg font-bold text-green-800">Talebiniz alındı</h3>
        <p className="mt-1 text-sm text-green-700">Reklam ekibimiz en kısa sürede sizinle iletişime geçecek.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ad-name" className={labelCls}>Ad Soyad <span className="text-red-500">*</span></label>
          <input id="ad-name" name="name" required placeholder="Adınız ve soyadınız" className={inputCls} />
        </div>
        <div>
          <label htmlFor="ad-company" className={labelCls}>Firma</label>
          <input id="ad-company" name="company" placeholder="Firma adı" className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ad-phone" className={labelCls}>Telefon <span className="text-red-500">*</span></label>
          <input id="ad-phone" name="phone" required type="tel" inputMode="tel" placeholder="05__ ___ __ __" className={inputCls} />
        </div>
        <div>
          <label htmlFor="ad-email" className={labelCls}>E-posta</label>
          <input id="ad-email" name="email" type="email" placeholder="ornek@eposta.com" className={inputCls} />
        </div>
      </div>
      <div>
        <label htmlFor="ad-message" className={labelCls}>Reklam talebiniz</label>
        <textarea id="ad-message" name="message" rows={3} placeholder="Ne tür reklam? Süre? Konum (ana sayfa, ilan arası vb.)?" className={`${inputCls} h-auto py-3 leading-relaxed`} />
      </div>
      {/* Honeypot — insanlar görmez/boş bırakır */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {status === "error" && (
        <p className="rounded-[10px] bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 ring-1 ring-red-200">{error}</p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-[10px] bg-brand-700 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
      >
        {status === "loading" ? "Gönderiliyor..." : "Talebi Gönder"}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-center text-[13px] text-slate-500">
        <Lock className="h-3.5 w-3.5" /> Bilgileriniz yalnızca sizinle iletişim için kullanılır.
      </p>
    </form>
  );
}
