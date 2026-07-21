import type { Metadata } from "next";
import { Phone, MessageCircle, Mail, MapPin } from "lucide-react";
import LeadForm from "@/components/LeadForm";
import TrackView from "@/components/TrackView";
import { SITE, telLink, whatsappLink } from "@/lib/site";
import { getSiteContact } from "@/lib/contact";
import { getUserSession } from "@/lib/userAuth";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Kütahya Satılık - Dijital Emlak Ofisi ile iletişime geçin. Telefon, WhatsApp veya form ile bize ulaşın.",
  alternates: { canonical: "/iletisim" },
};

export default async function ContactPage() {
  const [c, session] = await Promise.all([getSiteContact(), getUserSession()]);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <TrackView />
      <h1 className="font-display text-3xl font-bold text-slate-900">İletişim</h1>
      <p className="mt-2 text-slate-600">{SITE.brand}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-3.5">
          {c.phoneRaw && (
            <a href={telLink(c.phoneRaw)} className="flex items-center gap-4 rounded-lg bg-paper p-5 ring-1 ring-stone transition hover:ring-brand-300">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700"><Phone className="h-5 w-5" /></span>
              <div>
                <p className="text-sm text-slate-500">Telefon</p>
                <p className="font-semibold text-slate-900">{c.phone}</p>
              </div>
            </a>
          )}
          {c.whatsapp && (
            <a href={whatsappLink(c.whatsapp, "Merhaba, bilgi almak istiyorum.")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-lg bg-paper p-5 ring-1 ring-stone transition hover:ring-green-300">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-green-50 text-green-600"><MessageCircle className="h-5 w-5" /></span>
              <div>
                <p className="text-sm text-slate-500">WhatsApp</p>
                <p className="font-semibold text-slate-900">Mesaj gönderin</p>
              </div>
            </a>
          )}
          {c.email && (
            <div className="flex items-center gap-4 rounded-lg bg-paper p-5 ring-1 ring-stone">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><Mail className="h-5 w-5" /></span>
              <div>
                <p className="text-sm text-slate-500">E-posta</p>
                <p className="font-semibold text-slate-900">{c.email}</p>
              </div>
            </div>
          )}
          {c.address && (
            <div className="flex items-center gap-4 rounded-lg bg-paper p-5 ring-1 ring-stone">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><MapPin className="h-5 w-5" /></span>
              <div>
                <p className="text-sm text-slate-500">Adres</p>
                <p className="font-semibold text-slate-900">{c.address}</p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-paper p-6 ring-1 ring-stone">
          <h2 className="font-display text-lg font-bold text-slate-900">Bize Yazın</h2>
          <p className="mt-1 text-sm text-slate-500">Formu doldurun, en kısa sürede dönüş yapalım.</p>
          <div className="mt-4">
            <LeadForm type="contact" isLoggedIn={!!session} defaultName={session?.name ?? ""} />
          </div>
        </div>
      </div>
    </div>
  );
}
