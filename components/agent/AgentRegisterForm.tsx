"use client";

import { useState } from "react";
import Link from "next/link";
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
      <div className="rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200">
        <div className="text-5xl">✅</div>
        <h3 className="mt-3 text-2xl font-bold text-slate-900">Başvurunuz alındı!</h3>
        <p className="mt-2 text-slate-600">
          Danışman başvurunuz yönetim ekibimize iletildi. Onaylandığında giriş yapıp
          ilan eklemeye başlayabilirsiniz. Bilgilendirme için sizi arayacağız.
        </p>
        <Link
          href="/emlakci/giris"
          className="mt-5 inline-block rounded-xl bg-brand-700 px-5 py-3 font-bold text-white hover:bg-brand-800"
        >
          Giriş sayfasına git →
        </Link>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <input name="name" required placeholder="Ad Soyad *" className={inputCls} />
        <input name="phone" required type="tel" placeholder="Telefon *" className={inputCls} />
      </div>
      <input name="email" required type="email" placeholder="E-posta *" className={inputCls} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <input name="title" placeholder="Unvan (örn. Gayrimenkul Danışmanı)" className={inputCls} />
        <input name="agency" placeholder="Ofis / Marka (opsiyonel)" className={inputCls} />
      </div>
      <textarea
        name="experience"
        rows={3}
        placeholder="Deneyim / ofis bilgisi (kaç yıl, hangi bölge, portföy büyüklüğü...)"
        className={inputCls}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-xl bg-gold-500 px-4 py-3.5 text-base font-bold text-brand-950 hover:bg-gold-400 disabled:opacity-60 transition shadow-md"
      >
        {status === "loading" ? "Gönderiliyor..." : "Danışman Başvurusu Gönder →"}
      </button>
      <p className="text-center text-xs text-slate-500">
        Başvurunuz admin onayından sonra aktifleşir. Zaten hesabınız var mı?{" "}
        <Link href="/emlakci/giris" className="font-semibold text-brand-700 hover:underline">
          Giriş yapın
        </Link>
      </p>
    </form>
  );
}
