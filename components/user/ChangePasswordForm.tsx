"use client";

import { useState, useRef } from "react";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENT,
} from "@/lib/passwordPolicy";

const inputCls =
  "h-12 w-full rounded-[10px] border border-stone bg-paper px-3.5 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";
const labelCls = "mb-1.5 block text-sm font-semibold text-ink";

export default function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const cur = String(fd.get("current") || "");
    const nw = String(fd.get("new") || "");
    const nw2 = String(fd.get("new2") || "");
    if (nw !== nw2) {
      setMsg({ type: "error", text: "Yeni şifreler eşleşmiyor." });
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: cur, newPassword: nw }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Bir hata oluştu");
      setMsg({ type: "success", text: data.message || "Şifreniz güncellendi." });
      formRef.current?.reset();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Bir hata oluştu" });
    } finally {
      setStatus("idle");
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="cp-cur" className={labelCls}>Mevcut şifre</label>
        <input id="cp-cur" name="current" type="password" required autoComplete="current-password" placeholder="••••••••" className={inputCls} />
      </div>
      <div>
        <label htmlFor="cp-new" className={labelCls}>Yeni şifre</label>
        <input id="cp-new" name="new" type="password" required minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} autoComplete="new-password" placeholder={PASSWORD_REQUIREMENT} className={inputCls} />
      </div>
      <div>
        <label htmlFor="cp-new2" className={labelCls}>Yeni şifre (tekrar)</label>
        <input id="cp-new2" name="new2" type="password" required minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} autoComplete="new-password" placeholder="••••••••••" className={inputCls} />
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
        {status === "loading" ? "Güncelleniyor..." : "Şifreyi Değiştir"}
      </button>
    </form>
  );
}
