"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Giriş başarısız");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Hata");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <div className="text-center">
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-brand-700 text-white font-black text-xl">K</span>
          <h1 className="mt-4 text-xl font-extrabold text-slate-900">Yönetim Paneli</h1>
          <p className="text-sm text-slate-500">Kütahya Satılık</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            name="email"
            type="email"
            required
            placeholder="E-posta"
            defaultValue="admin@kutahyasatilik.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Şifre"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {status === "loading" ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
        <p className="mt-6 text-center text-[11px] text-slate-400">
          <a href="https://bahalabs.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand-700">
            bahalabs.com tarafından geliştirildi
          </a>
        </p>
      </div>
    </div>
  );
}
