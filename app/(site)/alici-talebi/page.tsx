import type { Metadata } from "next";
import { Suspense } from "react";
import BuyerAlertForm from "@/components/BuyerAlertForm";
import TrackView from "@/components/TrackView";
import { PageIntro } from "@/components/ui/Editorial";

export const revalidate = 300; // ISR: her 5 dakikada yenilenir (CDN cache + admin revalidatePath)

export const metadata: Metadata = {
  title: "Aradığınızı Bulamadınız mı? Talebinizi Bırakın",
  description:
    "Kütahya'da aradığınız mülkü tarif edin; kriterlerinize uygun ilan geldiğinde size haber verelim. Ücretsiz alıcı talebi / kayıtlı arama.",
  alternates: { canonical: "/alici-talebi" },
};

export default function BuyerAlertPage() {
  return (
    <div>
      <TrackView />
      {/* Kapsam etiketi metinde açık: eşleştirme (lib/matching.ts) emlak
          kriterleri üzerinden çalışıyor, vasıta/teknoloji talebi kabul edilmiyor. */}
      <PageIntro eyebrow="Alıcı talebi · Emlak" title="Aradığınız mülkü birlikte bulalım" intro="Emlak kriterlerinizi paylaşın; mevcut portföyü eşleştirelim ve uygun yeni bir ilan geldiğinde size haber verelim." />

      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="border border-stone bg-paper p-6 sm:p-8">
          <Suspense fallback={<div className="h-96" />}>
            <BuyerAlertForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
