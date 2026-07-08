"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const inputCls =
  "h-12 w-full rounded-[10px] border border-slate-300 bg-white px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const pw = String(fd.get("password") || "");
    const pw2 = String(fd.get("password2") || "");
    if (pw !== pw2) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/user/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: pw }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Bir hata oluştu");
      setStatus("done");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  }

  if (!token) {
    return (
      <div className="rounded-[10px] bg-red-50 p-4 text-center text-sm text-red-700 ring-1 ring-red-200">
        Geçersiz bağlantı.{" "}
        <Link href="/sifremi-unuttum" className="font-semibold underline">Yeniden iste</Link>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="rounded-[10px] bg-green-50 p-4 text-center text-sm leading-relaxed text-green-800 ring-1 ring-green-200">
        Şifren güncellendi. Artık yeni şifrenle giriş yapabilirsin.
        <p className="mt-3">
          <Link href="/giris" className="font-semibold text-brand-700 hover:underline">Giriş yap</Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="rp-pw" className="mb-1.5 block text-sm font-semibold text-slate-700">Yeni şifre</label>
        <input id="rp-pw" name="password" type="password" required minLength={6} autoComplete="new-password" placeholder="En az 6 karakter" className={inputCls} />
      </div>
      <div>
        <label htmlFor="rp-pw2" className="mb-1.5 block text-sm font-semibold text-slate-700">Yeni şifre (tekrar)</label>
        <input id="rp-pw2" name="password2" type="password" required minLength={6} autoComplete="new-password" placeholder="••••••••" className={inputCls} />
      </div>
      {error && <p className="rounded-[10px] bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 ring-1 ring-red-200">{error}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-[10px] bg-brand-700 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
      >
        {status === "loading" ? "Kaydediliyor..." : "Şifreyi güncelle"}
      </button>
    </form>
  );
}
