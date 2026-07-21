"use client";

import { useState } from "react";
import Link from "next/link";
import { isValidTrPhone, TR_PHONE_ERROR } from "@/lib/validation";

const inputCls =
  "h-12 w-full rounded-[10px] border border-slate-300 bg-paper px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";
const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";

export default function UserRegisterForm() {
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const fd = new FormData(e.currentTarget);
    if (!isValidTrPhone(String(fd.get("phone") || ""))) {
      setStatus("idle");
      setError(TR_PHONE_ERROR);
      return;
    }
    try {
      const res = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          password: fd.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Kayıt başarısız");
      // Kayıt sonrası otomatik giriş yapıldı. Tam sayfa yükleme: store remount + favori birleştirme.
      window.location.assign("/hesabim");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="r-name" className={labelCls}>Ad Soyad</label>
        <input id="r-name" name="name" required autoComplete="name" placeholder="Adınız ve soyadınız" className={inputCls} />
      </div>
      <div>
        <label htmlFor="r-email" className={labelCls}>E-posta</label>
        <input id="r-email" name="email" type="email" required autoComplete="email" placeholder="ornek@eposta.com" className={inputCls} />
      </div>
      <div>
        <label htmlFor="r-phone" className={labelCls}>Telefon</label>
        <input id="r-phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel" placeholder="05__ ___ __ __" className={inputCls} />
      </div>
      <div>
        <label htmlFor="r-password" className={labelCls}>Şifre</label>
        <input id="r-password" name="password" type="password" required minLength={6} autoComplete="new-password" placeholder="En az 6 karakter" className={inputCls} />
      </div>
      {error && <p className="rounded-[10px] bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 ring-1 ring-red-200">{error}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-[10px] bg-brand-700 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
      >
        {status === "loading" ? "Hesap oluşturuluyor..." : "Kayıt Ol"}
      </button>
      <p className="text-center text-sm text-slate-500">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="font-semibold text-brand-700 hover:underline">Giriş yap</Link>
      </p>
    </form>
  );
}
