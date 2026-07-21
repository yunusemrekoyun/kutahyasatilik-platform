"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls =
  "h-12 w-full rounded-[10px] border border-slate-300 bg-paper px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";
const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";

export default function ProfileForm({
  defaultName,
  defaultPhone,
}: {
  defaultName: string;
  defaultPhone: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    setStatus("loading");
    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: String(fd.get("name") || ""), phone: String(fd.get("phone") || "") }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Bir hata oluştu");
      setMsg({ type: "success", text: data.message || "Profiliniz güncellendi." });
      router.refresh();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Bir hata oluştu" });
    } finally {
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="pf-name" className={labelCls}>Ad Soyad</label>
        <input id="pf-name" name="name" defaultValue={defaultName} required minLength={2} maxLength={80} className={inputCls} />
      </div>
      <div>
        <label htmlFor="pf-phone" className={labelCls}>Telefon</label>
        <input id="pf-phone" name="phone" type="tel" defaultValue={defaultPhone} maxLength={20} placeholder="05xx xxx xx xx" className={inputCls} />
      </div>
      {msg && (
        <p className={`rounded-[10px] px-3.5 py-2.5 text-sm font-medium ring-1 ${msg.type === "success" ? "bg-green-50 text-green-800 ring-green-200" : "bg-red-50 text-red-700 ring-red-200"}`}>
          {msg.text}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-[10px] bg-brand-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
      >
        {status === "loading" ? "Kaydediliyor..." : "Bilgileri Güncelle"}
      </button>
    </form>
  );
}
