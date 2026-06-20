"use client";

import { useState } from "react";
import { CheckCircle2, Check } from "lucide-react";
import { formatPrice } from "@/lib/format";

type Offer = {
  version: number;
  name: string;
  price: number;
  interval: string;
  features: string[];
  validUntil: string | null;
  accepted: boolean;
};

const intervalLabel = (i: string) => (i === "yearly" ? "/yıl" : i === "one_time" ? " (tek seferlik)" : "/ay");

const inputCls =
  "h-12 w-full rounded-[10px] border border-slate-300 bg-white px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";
const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}

export default function OfferView() {
  const [phase, setPhase] = useState<"request" | "code" | "offer" | "done">("request");
  const [email, setEmail] = useState("");
  const [phone4, setPhone4] = useState("");
  const [code, setCode] = useState("");
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const d = await postJson("/api/emlakci/teklif/otp", { email, phone4 });
      if (!d.ok) throw new Error(d.error || "Kod gönderilemedi");
      setPhase("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const d = await postJson("/api/emlakci/teklif/view", { email, phone4, code });
      if (!d.ok) throw new Error(d.error || "Doğrulanamadı");
      setOffer(d.offer);
      setPhase(d.offer?.accepted ? "done" : "offer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    } finally {
      setLoading(false);
    }
  }

  async function accept() {
    setLoading(true); setError("");
    try {
      const d = await postJson("/api/emlakci/teklif/accept", { email, phone4, code });
      if (!d.ok) throw new Error(d.error || "Kabul edilemedi");
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    } finally {
      setLoading(false);
    }
  }

  if (phase === "done") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-green-600 ring-1 ring-green-200">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold text-green-800">Teklif kabul edildi</h2>
        <p className="mt-2 text-sm text-green-700">
          Ödeme bilgileri için sizinle iletişime geçeceğiz. Ödeme onaylandıktan sonra hesabınız aktifleşir.
        </p>
      </div>
    );
  }

  if (phase === "offer" && offer) {
    return (
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
          <div className="bg-brand-950 px-6 py-5 text-white">
            <p className="text-xs uppercase tracking-wider text-gold-300">Teklif v{offer.version}</p>
            <h2 className="mt-1 font-display text-xl font-bold">{offer.name}</h2>
            <p className="mt-1 text-2xl font-bold">
              {formatPrice(offer.price, "TRY")}<span className="text-base font-normal text-brand-200">{intervalLabel(offer.interval)}</span>
            </p>
          </div>
          {offer.features.length > 0 && (
            <ul className="space-y-2 bg-white px-6 py-5">
              {offer.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 shrink-0 text-green-600" /> {f}
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && <p className="rounded-[10px] bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 ring-1 ring-red-200">{error}</p>}
        <button
          onClick={accept}
          disabled={loading}
          className="w-full rounded-[10px] bg-gold-500 px-4 py-3.5 text-base font-bold text-brand-950 transition hover:bg-gold-400 disabled:opacity-60"
        >
          {loading ? "İşleniyor..." : "Teklifi Kabul Et"}
        </button>
        <p className="text-center text-xs text-slate-400">Kabul ettiğinizde ödeme aşamasına geçilir.</p>
      </div>
    );
  }

  return (
    <form onSubmit={phase === "request" ? requestOtp : verify} className="space-y-4">
      {phase === "request" ? (
        <>
          <div>
            <label htmlFor="o-email" className={labelCls}>E-posta</label>
            <input id="o-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="başvuru e-postanız" className={inputCls} />
          </div>
          <div>
            <label htmlFor="o-phone4" className={labelCls}>Telefonun son 4 hanesi</label>
            <input id="o-phone4" inputMode="numeric" required maxLength={4} value={phone4} onChange={(e) => setPhone4(e.target.value)} placeholder="••••" className={inputCls} />
          </div>
        </>
      ) : (
        <div>
          <label htmlFor="o-code" className={labelCls}>E-postanıza gelen 6 haneli kod</label>
          <input id="o-code" inputMode="numeric" required maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="••••••" className={`${inputCls} tracking-[0.4em]`} />
          <p className="mt-1.5 text-xs text-slate-500">Kod 10 dakika geçerlidir.</p>
        </div>
      )}
      {error && <p className="rounded-[10px] bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 ring-1 ring-red-200">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-[10px] bg-brand-700 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60">
        {loading ? "..." : phase === "request" ? "Doğrulama Kodu Gönder" : "Teklifi Görüntüle"}
      </button>
    </form>
  );
}
