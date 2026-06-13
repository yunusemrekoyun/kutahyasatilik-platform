import type { Metadata } from "next";
import Link from "next/link";
import TrackView from "@/components/TrackView";
import ValuationTool from "@/components/ValuationTool";
import { getDistrictStatsObject } from "@/lib/districtStats";
import { SITE, telLink, whatsappLink } from "@/lib/site";

export const revalidate = 300; // ISR: her 5 dakikada yenilenir (CDN cache + admin revalidatePath)

export const metadata: Metadata = {
  title: "Kütahya Ev & Arsa Değerleme - Evimin Değeri Ne Kadar?",
  description:
    "Kütahya'da daire, villa, arsa veya tarlanızın tahmini değerini saniyeler içinde öğrenin. İlçe ortalamalarına dayalı ücretsiz online değerleme aracı.",
};

export default async function ValuationPage() {
  const stats = await getDistrictStatsObject();

  return (
    <div className="bg-slate-50">
      <TrackView />

      {/* HERO */}
      <section className="bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium ring-1 ring-gold-400/40">
            <span className="text-gold-400">📊</span> Ücretsiz Online Değerleme
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-5xl">
            Evinizin Değeri <span className="text-gold-400">Ne Kadar?</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-brand-100">
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
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: "⚡",
              title: "Anında Sonuç",
              text: "Form doldurmadan, beklemeden tahmini değer aralığını hemen görün.",
            },
            {
              icon: "📍",
              title: "Bölgeye Özel",
              text: "13 ilçenin güncel ortalama m² değerleri ve mülk türüne göre hesaplanır.",
            },
            {
              icon: "🤝",
              title: "Ücretsiz Ekspertiz",
              text: "Daha kesin değer için uzmanımız yerinde, ücretsiz ekspertiz yapar.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 font-bold text-brand-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-brand-50 p-6 text-center ring-1 ring-brand-100 sm:p-8">
          <h2 className="font-display text-2xl font-bold text-brand-900">
            Mülkünüzü satmaya hazır mısınız?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
            {SITE.brand} olarak doğru fiyatlandırma, profesyonel pazarlama ve güvenli
            satış sürecini sizin için yönetiyoruz.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/satici"
              className="rounded-xl bg-gold-500 px-5 py-3 text-center font-bold text-brand-950 transition hover:bg-gold-400"
            >
              Detaylı Değerleme Formu →
            </Link>
            <a
              href={whatsappLink("Merhaba, mülkümün değerlemesi hakkında bilgi almak istiyorum.")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-green-600 px-5 py-3 text-center font-bold text-white transition hover:bg-green-700"
            >
              💬 WhatsApp&apos;tan Yaz
            </a>
            <a
              href={telLink()}
              className="rounded-xl bg-brand-700 px-5 py-3 text-center font-bold text-white transition hover:bg-brand-800"
            >
              📞 {SITE.phone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
