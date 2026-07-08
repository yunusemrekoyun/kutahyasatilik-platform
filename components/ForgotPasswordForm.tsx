"use client";

import { useState } from "react";
import Link from "next/link";

const inputCls =
  "h-12 w-full rounded-[10px] border border-slate-300 bg-white px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

export default function ForgotPasswordForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/user/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fd.get("email") }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Bir hata oluştu");
      setMsg(data.message || "Şifre sıfırlama bağlantısı gönderildi.");
      setStatus("sent");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-[10px] bg-green-50 p-4 text-center text-sm leading-relaxed text-green-800 ring-1 ring-green-200">
        {msg}
        <p className="mt-3">
          <Link href="/giris" className="font-semibold text-brand-700 hover:underline">Girişe dön</Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="fp-email" className="mb-1.5 block text-sm font-semibold text-slate-700">E-posta</label>
        <input id="fp-email" name="email" type="email" required autoComplete="email" placeholder="ornek@eposta.com" className={inputCls} />
      </div>
      {error && <p className="rounded-[10px] bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 ring-1 ring-red-200">{error}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-[10px] bg-brand-700 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
      >
        {status === "loading" ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
      </button>
      <p className="pt-1 text-center text-sm text-slate-500">
        <Link href="/giris" className="font-semibold text-brand-700 hover:underline">Girişe dön</Link>
      </p>
    </form>
  );
}
