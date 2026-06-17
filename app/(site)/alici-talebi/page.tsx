import type { Metadata } from "next";
import { BellRing } from "lucide-react";
import BuyerAlertForm from "@/components/BuyerAlertForm";
import TrackView from "@/components/TrackView";

export const revalidate = 300; // ISR: her 5 dakikada yenilenir (CDN cache + admin revalidatePath)

export const metadata: Metadata = {
  title: "Aradığınızı Bulamadınız mı? Talebinizi Bırakın",
  description:
    "Kütahya'da aradığınız mülkü tarif edin; kriterlerinize uygun ilan geldiğinde size haber verelim. Ücretsiz alıcı talebi / kayıtlı arama.",
};

export default function BuyerAlertPage() {
  return (
    <div className="bg-slate-50">
      <TrackView />
      <section className="bg-brand-950 text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium ring-1 ring-gold-400/40">
            <BellRing className="h-4 w-4 text-gold-400" /> Akıllı Eşleştirme
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-4xl">
            Aradığınız Mülkü <span className="text-gold-400">Biz Bulalım</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-brand-100">
            Ne aradığınızı tarif edin. Şu an uygun ilanları anında görün; uygun yeni bir
            ilan geldiğinde de ilk siz haberdar olun.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200 sm:p-8">
          <BuyerAlertForm />
        </div>
      </section>
    </div>
  );
}
