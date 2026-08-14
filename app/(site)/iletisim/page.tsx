import type { Metadata } from "next";
import { Phone, MessageCircle, Mail, MapPin } from "lucide-react";
import LeadForm from "@/components/LeadForm";
import TrackView from "@/components/TrackView";
import { SITE, telLink, whatsappLink } from "@/lib/site";
import { getSiteContact } from "@/lib/contact";

// ISR: iletişim bilgileri Ayarlar'dan (Setting tablosu) geliyor ve bu sayfa
// artık statik üretiliyor. revalidate olmadan admin'in değiştirdiği telefon
// hiç yansımaz — sitenin geri kalanıyla aynı 5 dakikalık tazelenme.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "İletişim",
  description: "Kütahya Satılık - Dijital Emlak Ofisi ile iletişime geçin. Telefon, WhatsApp veya form ile bize ulaşın.",
  alternates: { canonical: "/iletisim" },
};

// Oturum bilgisi sunucuda okunmaz: cookies() rotayı dinamiğe düşürüp CDN
// cache'ini kapatırdı. LeadForm giriş durumunu client'ta çözer.
export default async function ContactPage() {
  const c = await getSiteContact();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <TrackView />
      <h1 className="text-3xl font-bold text-ink">İletişim</h1>
      <p className="mt-2 text-muted">{SITE.brand}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-3.5">
          {c.phoneRaw && (
            <a href={telLink(c.phoneRaw)} className="flex items-center gap-4 rounded-control bg-paper p-5 ring-1 ring-stone transition hover:ring-brand-300">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-brand-50 text-brand-700"><Phone className="h-5 w-5" /></span>
              <div>
                <p className="text-sm text-muted">Telefon</p>
                <p className="font-semibold text-ink">{c.phone}</p>
              </div>
            </a>
          )}
          {c.whatsapp && (
            <a href={whatsappLink(c.whatsapp, "Merhaba, bilgi almak istiyorum.")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-control bg-paper p-5 ring-1 ring-stone transition hover:ring-green-300">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-green-50 text-green-600"><MessageCircle className="h-5 w-5" /></span>
              <div>
                <p className="text-sm text-muted">WhatsApp</p>
                <p className="font-semibold text-ink">Mesaj gönderin</p>
              </div>
            </a>
          )}
          {c.email && (
            <div className="flex items-center gap-4 rounded-control bg-paper p-5 ring-1 ring-stone">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-canvas text-muted"><Mail className="h-5 w-5" /></span>
              <div>
                <p className="text-sm text-muted">E-posta</p>
                <p className="font-semibold text-ink">{c.email}</p>
              </div>
            </div>
          )}
          {c.address && (
            <div className="flex items-center gap-4 rounded-control bg-paper p-5 ring-1 ring-stone">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-canvas text-muted"><MapPin className="h-5 w-5" /></span>
              <div>
                <p className="text-sm text-muted">Adres</p>
                <p className="font-semibold text-ink">{c.address}</p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-control bg-paper p-6 ring-1 ring-stone">
          <h2 className="text-lg font-bold text-ink">Bize Yazın</h2>
          <p className="mt-1 text-sm text-muted">Formu doldurun, en kısa sürede dönüş yapalım.</p>
          <div className="mt-4">
            <LeadForm type="contact" />
          </div>
        </div>
      </div>
    </div>
  );
}
