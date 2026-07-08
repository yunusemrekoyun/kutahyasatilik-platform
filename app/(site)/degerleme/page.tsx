import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Zap, MapPin, Handshake, MessageCircle, Phone, ArrowRight } from "lucide-react";
import TrackView from "@/components/TrackView";
import ValuationTool from "@/components/ValuationTool";
import { getDistrictStatsObject } from "@/lib/districtStats";
import { SITE, telLink, whatsappLink } from "@/lib/site";
import { getSiteContact } from "@/lib/contact";

export const revalidate = 300; // ISR: her 5 dakikada yenilenir (CDN cache + admin revalidatePath)

export const metadata: Metadata = {
  title: "Kütahya Ev & Arsa Değerleme - Evimin Değeri Ne Kadar?",
  description:
    "Kütahya'da daire, villa, arsa veya tarlanızın tahmini değerini saniyeler içinde öğrenin. İlçe ortalamalarına dayalı ücretsiz online değerleme aracı.",
};

export default async function ValuationPage() {
  const stats = await getDistrictStatsObject();
  const c = await getSiteContact();

  return (
    <div className="bg-slate-50">
      <TrackView />

      {/* HERO */}
      <section className="bg-brand-950 text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium ring-1 ring-gold-400/40">
            <BarChart3 className="h-4 w-4 text-gold-400" /> Ücretsiz Online Değerleme
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-5xl">
            Evinizin Değeri <span className="text-gold-400">Ne Kadar?</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-brand-100">
            İlçe, mülk türü ve büyüklüğü girin; Kütahya bölge ortalamalarına dayalı
            tahmini değer aralığını <strong>saniyeler içinde</strong> öğrenin. Kayıt
            gerektirmez, tamamen ücretsizdir.
          </p>
        </div>
      </section>

      {/* ARAÇ */}
      <section className="mx-auto -mt-8 max-w-5xl px-4 pb-4">
        <ValuationTool stats={stats} />
      </section>

      {/* GÜVEN / SÜREÇ */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { Icon: Zap, title: "Anında Sonuç", text: "Form doldurmadan, beklemeden tahmini değer aralığını hemen görün." },
            { Icon: MapPin, title: "Bölgeye Özel", text: "13 ilçenin güncel ortalama m² değerleri ve mülk türüne göre hesaplanır." },
            { Icon: Handshake, title: "Ücretsiz Ekspertiz", text: "Daha kesin değer için uzmanımız yerinde, ücretsiz ekspertiz yapar." },
          ].map((f, i) => (
            <div key={f.title} className={`flex gap-3.5 py-6 sm:py-2 ${i === 0 ? "sm:pr-6" : "sm:px-6"}`}>
              <f.Icon className="mt-0.5 h-6 w-6 shrink-0 text-brand-700" strokeWidth={1.6} />
              <div>
                <h3 className="font-semibold text-brand-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-brand-50 p-6 text-center ring-1 ring-brand-100 sm:p-8">
          <h2 className="font-display text-2xl font-bold text-brand-900">
            Mülkünüzü satmaya hazır mısınız?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            {SITE.brand} olarak doğru fiyatlandırma, profesyonel pazarlama ve güvenli
            satış sürecini sizin için yönetiyoruz.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/satici"
              className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-brand-700 px-5 py-3 font-semibold text-white transition hover:bg-brand-800"
            >
              İlan Talebi Oluştur <ArrowRight className="h-4 w-4" />
            </Link>
            {c.whatsapp && (
              <a
                href={whatsappLink(c.whatsapp, "Merhaba, mülkümün değerlemesi hakkında bilgi almak istiyorum.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
            {c.phoneRaw && (
              <a
                href={telLink(c.phoneRaw)}
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-brand-200 bg-white px-5 py-3 font-semibold text-brand-800 transition hover:bg-brand-50"
              >
                <Phone className="h-4 w-4" /> {c.phone}
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
