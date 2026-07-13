"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Send, Tag, Check, X, ArrowLeft, MessageSquare } from "lucide-react";
import { formatPrice } from "@/lib/format";

type ConvItem = {
  id: string;
  listingSlug: string | null;
  listingTitle: string;
  listingImage: string | null;
  otherName: string;
  otherLogo: string | null;
  lastType: string;
  lastBody: string;
  lastAt: string;
  unread: boolean;
};
type Msg = {
  id: string;
  senderRole: "user" | "agent";
  type: "text" | "offer";
  body: string | null;
  offerAmount: number | null;
  offerCurrency: string | null;
  offerStatus: string | null;
  createdAt: string;
};
type ConvDetail = {
  id: string;
  listing: { slug: string; title: string; price: number; currency: string; image: string | null } | null;
  otherName: string;
  otherLogo: string | null;
};

const OFFER_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Bekliyor", cls: "text-amber-700 bg-amber-50 ring-amber-200" },
  accepted: { label: "Kabul edildi", cls: "text-green-700 bg-green-50 ring-green-200" },
  rejected: { label: "Reddedildi", cls: "text-red-700 bg-red-50 ring-red-200" },
  countered: { label: "Karşı teklif verildi", cls: "text-slate-600 bg-slate-100 ring-slate-200" },
};

export default function MessagesClient({ basePath }: { basePath: string }) {
  const sp = useSearchParams();
  const [items, setItems] = useState<ConvItem[]>([]);
  const [myRole, setMyRole] = useState<"user" | "agent">("user");
  const [activeId, setActiveId] = useState<string | null>(() => sp.get("c"));
  const [detail, setDetail] = useState<ConvDetail | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [offerMode, setOfferMode] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    const res = await fetch("/api/messages");
    const data = await res.json();
    if (data.ok) {
      setItems(data.items);
      setMyRole(data.myRole);
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    const res = await fetch(`/api/messages?conversationId=${id}`);
    const data = await res.json();
    if (data.ok) {
      setMyRole(data.myRole);
      setDetail(data.conversation);
      setMessages(data.messages);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (!activeId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversation(activeId);
    const t = setInterval(() => loadConversation(activeId), 6000); // hafif yoklama
    return () => clearInterval(t);
  }, [activeId, loadConversation]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    if (!activeId) return;
    const isOffer = offerMode && offerAmount;
    if (!isOffer && !text.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isOffer
            ? { conversationId: activeId, offerAmount: Number(offerAmount) }
            : { conversationId: activeId, body: text.trim() }
        ),
      });
      setText("");
      setOfferAmount("");
      setOfferMode(false);
      await loadConversation(activeId);
      loadList();
    } finally {
      setBusy(false);
    }
  }

  async function respond(messageId: string, action: "accept" | "reject" | "counter") {
    let counterAmount: number | undefined;
    if (action === "counter") {
      const v = window.prompt("Karşı teklif tutarı (₺):");
      if (!v) return;
      counterAmount = Number(v.replace(/[^\d]/g, ""));
      if (!counterAmount) return;
    }
    setBusy(true);
    try {
      await fetch("/api/messages/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, action, counterAmount }),
      });
      await loadConversation(activeId!);
      loadList();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      {/* Sohbet listesi */}
      <div className={`${activeId ? "hidden lg:block" : "block"} rounded-2xl bg-white ring-1 ring-slate-200`}>
        <div className="border-b border-slate-100 p-4">
          <h2 className="font-bold text-slate-900">Mesajlar</h2>
        </div>
        {items.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">Henüz sohbetiniz yok.</p>
        ) : (
          <ul className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
            {items.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className={`flex w-full items-center gap-3 p-3 text-left transition hover:bg-slate-50 ${activeId === c.id ? "bg-brand-50" : ""}`}
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {c.listingImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.listingImage} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{c.otherName}</p>
                    <p className="truncate text-xs text-slate-500">{c.listingTitle}</p>
                    <p className="truncate text-xs text-slate-400">{c.lastBody}</p>
                  </div>
                  {c.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Sohbet penceresi */}
      <div className={`${activeId ? "block" : "hidden lg:block"} flex min-h-[60vh] flex-col rounded-2xl bg-white ring-1 ring-slate-200`}>
        {!activeId || !detail ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
            <MessageSquare className="h-10 w-10" />
            <p className="mt-2 text-sm">Bir sohbet seçin.</p>
          </div>
        ) : (
          <>
            {/* Başlık */}
            <div className="flex items-center gap-3 border-b border-slate-100 p-3">
              <button onClick={() => setActiveId(null)} className="lg:hidden" aria-label="Geri"><ArrowLeft className="h-5 w-5 text-slate-500" /></button>
              <div>
                <p className="text-sm font-bold text-slate-900">{detail.otherName}</p>
                {detail.listing && (
                  <Link href={`/ilan/${detail.listing.slug}`} className="text-xs text-brand-700 hover:underline">
                    {detail.listing.title} · {formatPrice(detail.listing.price, detail.listing.currency)}
                  </Link>
                )}
              </div>
            </div>

            {/* Mesajlar */}
            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
              {messages.map((m) => {
                const mine = m.senderRole === myRole;
                if (m.type === "offer") {
                  const st = OFFER_STATUS[m.offerStatus || "pending"];
                  const canRespond = !mine && m.offerStatus === "pending";
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[80%] rounded-2xl border border-gold-200 bg-gold-50 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-gold-800"><Tag className="h-3.5 w-3.5" /> Teklif</p>
                        <p className="mt-0.5 font-display text-lg font-bold text-gold-900">{formatPrice(m.offerAmount || 0, m.offerCurrency || "TRY")}</p>
                        <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${st.cls}`}>{st.label}</span>
                        {canRespond && (
                          <div className="mt-2 flex gap-1.5">
                            <button onClick={() => respond(m.id, "accept")} disabled={busy} className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-xs font-semibold text-white"><Check className="h-3 w-3" /> Kabul</button>
                            <button onClick={() => respond(m.id, "reject")} disabled={busy} className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white"><X className="h-3 w-3" /> Reddet</button>
                            <button onClick={() => respond(m.id, "counter")} disabled={busy} className="rounded-md bg-slate-700 px-2 py-1 text-xs font-semibold text-white">Karşı</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-800"}`}>
                      {m.body}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compose */}
            <div className="border-t border-slate-100 p-3">
              {offerMode ? (
                <div className="flex items-center gap-2">
                  <input value={offerAmount ? Number(offerAmount).toLocaleString("tr-TR") : ""} onChange={(e) => setOfferAmount(e.target.value.replace(/[^\d]/g, "").slice(0, 12))} inputMode="numeric" placeholder="Teklif tutarı (₺)" className="h-11 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-500" />
                  <button onClick={send} disabled={busy || !offerAmount} className="rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-gold-950 disabled:opacity-50">Teklif Ver</button>
                  <button onClick={() => setOfferMode(false)} className="text-slate-400"><X className="h-5 w-5" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setOfferMode(true)} title="Teklif ver" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gold-50 text-gold-700 ring-1 ring-gold-200"><Tag className="h-5 w-5" /></button>
                  <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Mesaj yazın..." className="h-11 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-500" />
                  <button onClick={send} disabled={busy || !text.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-700 text-white disabled:opacity-50"><Send className="h-5 w-5" /></button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {/* basePath referansı (ileride derin link için) */}
      <span className="hidden" data-base={basePath} />
    </div>
  );
}
