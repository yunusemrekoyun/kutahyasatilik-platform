import type { Metadata } from "next";
import SellerForm from "@/components/SellerForm";
import TrackView from "@/components/TrackView";
import { SITE, telLink, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mülkünüzü Satın - Ücretsiz Değerleme",
  description:
    "Kütahya'da daire, arsa, villa veya tarlanızı mı satmak istiyorsunuz? Ücretsiz değerleme için formu doldurun, uzman ekibimiz sizi arasın.",
};

export default function SellerPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <TrackView />
      <div className="grid gap-10 lg:grid-cols-2 items-start">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            Mülkünüzü Satmak mı İstiyorsunuz?
          </h1>
          <p className="mt-4 text-slate-600">
            Kütahya&apos;nın dijital emlak ofisi olarak mülkünüzü doğru fiyata, hızlı ve
            güvenli şekilde satıyoruz. Formu doldurun; ücretsiz değerleme ve pazarlama
            sürecini sizin için başlatalım.
          </p>
          <ul className="mt-6 space-y-3 text-slate-700">
            <li className="flex gap-3"><span>✅</span> Ücretsiz ve gerçekçi değerleme</li>
            <li className="flex gap-3"><span>✅</span> Profesyonel fotoğraf ve ilan yönetimi</li>
            <li className="flex gap-3"><span>✅</span> Google&apos;da reklamlı geniş erişim</li>
            <li className="flex gap-3"><span>✅</span> Alıcı bulma ve pazarlık desteği</li>
            <li className="flex gap-3"><span>✅</span> Güvenli tapu ve satış sürecidir</li>
          </ul>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a href={telLink()} className="rounded-xl bg-brand-700 px-5 py-3 text-center font-bold text-white hover:bg-brand-800">
              📞 {SITE.phone}
            </a>
            <a href={whatsappLink("Merhaba, mülkümü satmak istiyorum.")} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-green-600 px-5 py-3 text-center font-bold text-white hover:bg-green-700">
              💬 WhatsApp
            </a>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 sm:p-7 shadow-xl ring-1 ring-slate-200">
          <h2 className="text-xl font-extrabold text-slate-900">Ücretsiz Değerleme Formu</h2>
          <p className="mt-1 text-sm text-slate-500">Bilgilerinizi bırakın, sizi arayalım.</p>
          <div className="mt-5">
            <SellerForm />
          </div>
        </div>
      </div>
    </div>
  );
}
