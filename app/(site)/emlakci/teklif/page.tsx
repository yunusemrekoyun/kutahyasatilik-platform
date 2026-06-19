import type { Metadata } from "next";
import { FileText } from "lucide-react";
import OfferView from "@/components/agent/OfferView";

export const metadata: Metadata = {
  title: "Danışman Teklifi",
  description: "Danışman teklifinizi e-posta doğrulamasıyla görüntüleyin.",
  robots: { index: false, follow: false },
};

export default function OfferPage() {
  return (
    <div className="mx-auto grid max-w-md px-4 py-16">
      <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <div className="text-center">
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-brand-700 text-white">
            <FileText className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Danışman Teklifiniz</h1>
          <p className="text-sm text-slate-500">E-posta ve telefonunuzun son 4 hanesiyle doğrulayın.</p>
        </div>
        <div className="mt-6">
          <OfferView />
        </div>
      </div>
    </div>
  );
}
