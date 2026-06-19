import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import AdRequestForm from "@/components/AdRequestForm";

export const metadata: Metadata = {
  title: "Reklam Vermek İstiyorum",
  description: "KütahyaSatılık'ta reklam vermek için talep bırakın; ekibimiz sizinle iletişime geçsin.",
};

export default function AdRequestPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="text-center">
        <span className="mx-auto inline-grid h-12 w-12 place-items-center rounded-xl bg-brand-700 text-white">
          <Megaphone className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-brand-900">Reklam Vermek İstiyorum</h1>
        <p className="mx-auto mt-2 max-w-lg text-slate-600">
          Bölgenin en aktif emlak platformunda markanızı tanıtın. Talebinizi bırakın, reklam
          seçeneklerini ve fiyatları sizinle paylaşalım.
        </p>
      </div>
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <AdRequestForm />
      </div>
    </div>
  );
}
