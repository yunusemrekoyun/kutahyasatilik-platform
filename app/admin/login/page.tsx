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

  const fieldCls =
    "h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-brand-950 to-brand-900 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white p-8 shadow-[0_20px_50px_-20px_rgba(10,23,48,0.5)] ring-1 ring-black/5">
          <div className="text-center">
            <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-brand-700 text-xl font-bold text-white">K</span>
            <h1 className="mt-4 text-xl font-bold text-slate-900">Yönetim Paneli</h1>
            <p className="text-sm text-slate-500">Kütahya Satılık</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-slate-700">E-posta</label>
              <input id="admin-email" name="email" type="email" required placeholder="ornek@eposta.com" defaultValue="admin@kutahyasatilik.com" className={fieldCls} />
            </div>
            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-slate-700">Şifre</label>
              <input id="admin-password" name="password" type="password" required placeholder="••••••••" className={fieldCls} />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 ring-1 ring-red-200">{error}</p>}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-lg bg-brand-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
            >
              {status === "loading" ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-[11px] text-brand-200">
          <a href="https://bahalabs.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            bahalabs.com tarafından geliştirildi
          </a>
        </p>
      </div>
    </div>
  );
}
