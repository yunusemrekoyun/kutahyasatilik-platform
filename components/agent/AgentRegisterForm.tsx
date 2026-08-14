"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { isValidTrPhone, TR_PHONE_ERROR } from "@/lib/validation";

export default function AgentRegisterForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setStatus("loading");
    const fd = new FormData(e.currentTarget);
    if (!isValidTrPhone(String(fd.get("phone") || ""))) {
      setStatus("idle");
      setError(TR_PHONE_ERROR);
      return;
    }
    try {
      const res = await fetch("/api/emlakci/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          title: fd.get("title"),
          agency: fd.get("agency"),
          experience: fd.get("experience"),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Başvuru gönderilemedi");
      setStatus("ok");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  }

  if (status === "ok") {
    return (
      <div role="status" className="rounded-control border border-stone bg-paper p-8 text-center">
        <div className="flex justify-center">
          <CheckCircle2 aria-hidden="true" className="h-12 w-12 text-green-600" />
        </div>
        <h3 className="mt-3 text-2xl font-bold text-ink">Başvurunuz alındı!</h3>
        <p className="mt-2 text-muted">
          Danışman başvurunuz yönetim ekibimize iletildi. Değerlendirme sonrası size bir
          <b> teklif</b> sunulacak; kabul ve ödeme sonrası hesabınız açılır ve
          <b> giriş bilgileriniz tarafımızca iletilir</b>. Süreç boyunca sizinle iletişimde olacağız.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-1 rounded-control bg-brand-700 px-5 py-3 font-bold text-white hover:bg-brand-800"
        >
          Ana sayfaya dön
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-control border border-stone px-3.5 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none";

  return (
    <form onSubmit={handleSubmit} aria-busy={status === "loading"} aria-describedby={error ? "agent-register-error" : undefined} className="space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label htmlFor="agent-register-name" className="sr-only">Ad Soyad</label>
          <input id="agent-register-name" name="name" required autoComplete="name" placeholder="Ad Soyad *" className={inputCls} />
        </div>
        <div>
          <label htmlFor="agent-register-phone" className="sr-only">Telefon</label>
          <input id="agent-register-phone" name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="Telefon *" className={inputCls} />
        </div>
      </div>
      <label htmlFor="agent-register-email" className="sr-only">E-posta</label>
      <input id="agent-register-email" name="email" required type="email" autoComplete="email" placeholder="E-posta *" className={inputCls} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label htmlFor="agent-register-title" className="sr-only">Unvan</label>
          <input id="agent-register-title" name="title" autoComplete="organization-title" placeholder="Unvan (örn. Gayrimenkul Danışmanı)" className={inputCls} />
        </div>
        <div>
          <label htmlFor="agent-register-agency" className="sr-only">Ofis veya marka</label>
          <input id="agent-register-agency" name="agency" autoComplete="organization" placeholder="Ofis / Marka (opsiyonel)" className={inputCls} />
        </div>
      </div>
      <label htmlFor="agent-register-experience" className="sr-only">Deneyim ve ofis bilgisi</label>
      <textarea
        id="agent-register-experience"
        name="experience"
        rows={3}
        placeholder="Deneyim / ofis bilgisi (kaç yıl, hangi bölge, portföy büyüklüğü...)"
        className={inputCls}
      />

      {error && <p id="agent-register-error" role="alert" className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="flex w-full items-center justify-center gap-1 rounded-control bg-brand-800 px-4 py-3.5 text-base font-bold text-white transition hover:bg-brand-900 disabled:opacity-60"
      >
        {status === "loading" ? (
          "Gönderiliyor..."
        ) : (
          <>
            Danışman Başvurusu Gönder
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </>
        )}
      </button>
      <p className="text-center text-xs text-muted">
        Başvurunuz incelenir; uygun bulunursa size paket teklifi gönderilir ve hesabınız
        teklifi kabul ettikten sonra açılır. Zaten hesabınız var mı?{" "}
        <Link href="/giris" className="inline-flex min-h-11 items-center font-semibold text-brand-700 hover:underline">
          Giriş yapın
        </Link>
      </p>
    </form>
  );
}
