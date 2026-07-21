"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, X, Send } from "lucide-react";
import LoginRequiredNotice from "@/components/LoginRequiredNotice";

// İlan detayında "Mesaj Gönder / Teklif Ver" — kullanıcı o ilanın danışmanıyla sohbet başlatır.
export default function StartConversation({
  listingId,
  isLoggedIn,
  hasAgent,
}: {
  listingId: string;
  isLoggedIn: boolean;
  hasAgent: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"text" | "offer">("text");
  const [text, setText] = useState("");
  const [offer, setOffer] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  if (!hasAgent) return null; // danışmansız ilanda mesajlaşma yok

  async function submit() {
    const isOffer = mode === "offer" && offer;
    if (!isOffer && !text.trim()) return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isOffer ? { listingId, offerAmount: Number(offer) } : { listingId, body: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Gönderilemedi");
      setStatus("ok");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Bir hata oluştu");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
      >
        <MessageSquare className="h-4 w-4" /> Mesaj Gönder / Teklif Ver
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-paper p-6 shadow-prestige" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">Danışmana Mesaj</h3>
              <button onClick={() => setOpen(false)} aria-label="Kapat"><X className="h-5 w-5 text-slate-400" /></button>
            </div>

            {!isLoggedIn ? (
              <LoginRequiredNotice text="Mesaj / teklif göndermek için giriş yapın" />
            ) : status === "ok" ? (
              <div className="rounded-lg bg-green-50 p-5 text-center ring-1 ring-green-200">
                <p className="text-sm font-semibold text-green-800">Mesajınız danışmana iletildi.</p>
                <Link href="/hesabim/mesajlar" className="mt-3 inline-block rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
                  Mesajlarıma Git
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-3 flex gap-2">
                  <button onClick={() => setMode("text")} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${mode === "text" ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"}`}>Mesaj</button>
                  <button onClick={() => setMode("offer")} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${mode === "offer" ? "bg-brand-800 text-white" : "bg-brand-50 text-muted"}`}>Teklif Ver</button>
                </div>
                {mode === "text" ? (
                  <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Mesajınız..." className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none transition focus:border-brand-500" />
                ) : (
                  <input value={offer ? Number(offer).toLocaleString("tr-TR") : ""} onChange={(e) => setOffer(e.target.value.replace(/[^\d]/g, "").slice(0, 12))} inputMode="numeric" placeholder="Teklif tutarı (₺)" className="h-12 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-brand-500" />
                )}
                {status === "error" && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
                <button onClick={submit} disabled={status === "loading"} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60">
                  <Send className="h-4 w-4" /> {status === "loading" ? "Gönderiliyor..." : "Gönder"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
