import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";
import TrackView from "@/components/TrackView";
import { SITE, telLink, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Kütahya Satılık - Dijital Emlak Ofisi ile iletişime geçin. Telefon, WhatsApp veya form ile bize ulaşın.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <TrackView />
      <h1 className="text-3xl font-black text-slate-900">İletişim</h1>
      <p className="mt-2 text-slate-600">{SITE.brand}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <a href={telLink()} className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 hover:ring-brand-300">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-100 text-2xl">📞</span>
            <div>
              <p className="text-sm text-slate-500">Telefon</p>
              <p className="font-bold text-slate-900">{SITE.phone}</p>
            </div>
          </a>
          <a href={whatsappLink("Merhaba, bilgi almak istiyorum.")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 hover:ring-green-300">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-green-100 text-2xl">💬</span>
            <div>
              <p className="text-sm text-slate-500">WhatsApp</p>
              <p className="font-bold text-slate-900">Mesaj gönderin</p>
            </div>
          </a>
          <div className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-2xl">✉️</span>
            <div>
              <p className="text-sm text-slate-500">E-posta</p>
              <p className="font-bold text-slate-900">{SITE.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-2xl">📍</span>
            <div>
              <p className="text-sm text-slate-500">Adres</p>
              <p className="font-bold text-slate-900">{SITE.address}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Bize Yazın</h2>
          <p className="mt-1 text-sm text-slate-500">Formu doldurun, en kısa sürede dönüş yapalım.</p>
          <div className="mt-4">
            <LeadForm type="contact" />
          </div>
        </div>
      </div>
    </div>
  );
}
