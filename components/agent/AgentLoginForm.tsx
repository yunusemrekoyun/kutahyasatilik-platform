"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function AgentLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/emlakci/panel";
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/emlakci/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Giriş başarısız");
      router.push(next.startsWith("/emlakci/panel") ? next : "/emlakci/panel");
      router.refresh();
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Hata");
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <input name="email" required type="email" placeholder="E-posta" className={inputCls} />
      <input name="password" required type="password" placeholder="Şifre" className={inputCls} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-xl bg-brand-700 px-4 py-3 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-60"
      >
        {status === "loading" ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
      <p className="text-center text-xs text-slate-500">
        Henüz danışman değil misiniz?{" "}
        <Link href="/emlakci/kayit" className="font-semibold text-brand-700 hover:underline">
          Başvuru yapın
        </Link>
      </p>
    </form>
  );
}
