import type { Metadata } from "next";
import { BadgeCheck, Zap, Users } from "lucide-react";
import SellerForm from "@/components/SellerForm";
import TrackView from "@/components/TrackView";
import { prisma } from "@/lib/prisma";

export const revalidate = 300; // ISR: admin görsel/ayar değişince revalidatePath ile tazelenir

export const metadata: Metadata = {
  title: "Mülkünüzü Satın - Ücretsiz Değerleme",
  description:
    "Kütahya'da daire, arsa, villa veya tarlanızı mı satmak istiyorsunuz? Ücretsiz değerleme için formu doldurun, uzman ekibimiz sizi arasın.",
};

async function getHeroImage(): Promise<string | null> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: "seller_hero_image" } });
    return row?.value?.trim() || null;
  } catch {
    return null;
  }
}

const TRUST = [
  { Icon: BadgeCheck, title: "Ücretsiz Ekspertiz", text: "Bölge uzmanlarımız tarafından mülkünüzün güncel piyasa değeri profesyonelce belirlenir." },
  { Icon: Zap, title: "Hızlı Satış", text: "Doğru fiyatlandırma ve etkili pazarlama stratejileri ile satış süreciniz hızlandırılır." },
  { Icon: Users, title: "Geniş Alıcı Ağı", text: "Portföyümüzdeki binlerce aktif yatırımcı ve nitelikli alıcıya doğrudan ulaşım sunuyoruz." },
];

export default async function SellerPage() {
  const heroImage = await getHeroImage();

  return (
    <div>
      <TrackView />

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-brand-950 text-white">
        {heroImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-950/75 via-brand-950/50 to-brand-950/80" />
          </>
        )}
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
          <h1 className="max-w-2xl font-display text-3xl font-bold leading-tight drop-shadow-sm sm:text-5xl">
            Mülkünüzü Uzman Ellerle Satın
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-brand-100">
            Kütahya&apos;nın en seçkin alıcı ağına ulaşın. Gayrimenkulünüzün gerçek değerini bulun ve güvenle satışa sunun.
          </p>
        </div>
      </section>

      {/* FORM + GÜVEN */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid items-start gap-8 lg:grid-cols-12">
          <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200 sm:p-8 lg:col-span-8">
            <div className="border-b border-slate-100 pb-5">
              <h2 className="font-display text-2xl font-bold text-brand-900">Satış Başvurusu</h2>
              <p className="mt-1.5 text-slate-500">
                Gayrimenkulünüz hakkında bilgileri girin, uzmanlarımız en kısa sürede sizinle iletişime geçsin.
              </p>
            </div>
            <div className="mt-6">
              <SellerForm />
            </div>
          </div>

          <div className="space-y-4 lg:col-span-4">
            {TRUST.map((t) => (
              <div key={t.title} className="flex items-start gap-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                  <t.Icon className="h-6 w-6" strokeWidth={1.7} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-brand-900">{t.title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
