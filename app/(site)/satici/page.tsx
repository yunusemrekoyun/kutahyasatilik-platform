import type { Metadata } from "next";
import Image from "next/image";
import { BadgeCheck, Zap, Users } from "lucide-react";
import SellerForm from "@/components/SellerForm";
import TrackView from "@/components/TrackView";
import { PageIntro } from "@/components/ui/Editorial";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/userAuth";

export const revalidate = 300; // ISR: admin görsel/ayar değişince revalidatePath ile tazelenir

export const metadata: Metadata = {
  title: "Mülkünüzü Satın - İlan Talebi Oluşturun",
  description:
    "Kütahya'da daire, arsa, villa veya tarlanızı mı satmak istiyorsunuz? İlan talebinizi oluşturun, uzman ekibimiz mülkünüzü değerlendirip sizinle iletişime geçsin.",
  alternates: { canonical: "/satici" },
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
  { Icon: BadgeCheck, title: "Doğru Fiyatlandırma", text: "Bölge uzmanlarımız mülkünüzün güncel piyasa değerini profesyonelce belirleyip doğru fiyatla listeler." },
  { Icon: Zap, title: "Hızlı Satış", text: "Doğru fiyatlandırma ve etkili pazarlama stratejileri ile satış süreciniz hızlandırılır." },
  { Icon: Users, title: "Geniş Alıcı Ağı", text: "Portföyümüzdeki binlerce aktif yatırımcı ve nitelikli alıcıya doğrudan ulaşım sunuyoruz." },
];

export default async function SellerPage() {
  const [heroImage, session] = await Promise.all([getHeroImage(), getUserSession()]);

  return (
    <div>
      <TrackView />

      <PageIntro eyebrow="Satış yolculuğu" title="Mülkünüzü yerel uzmanlıkla satışa hazırlayın" intro="Bölgesel ön değerleme, doğru fiyatlandırma ve şeffaf satış süreci için mülk bilgilerinizi paylaşın." visual={heroImage ? <Image src={heroImage} alt="Kütahya gayrimenkul portföyü" fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" /> : undefined} />

      {/* FORM + GÜVEN */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid items-start gap-8 lg:grid-cols-12">
          <div className="border border-stone bg-paper p-6 sm:p-8 lg:col-span-8">
            <div className="border-b border-slate-100 pb-5">
              <h2 className="font-display text-2xl font-bold text-brand-900">İlan Talebi Oluştur</h2>
              <p className="mt-1.5 text-slate-500">
                Gayrimenkulünüz hakkında bilgileri girin, uzmanlarımız en kısa sürede sizinle iletişime geçsin.
              </p>
              <ol className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {[
                  "İlan talebini oluştur (formu doldur)",
                  "Uzman ekibimiz mülkünü değerlendirir ve seni arar",
                  "Sana en uygun danışman atanır",
                  "İlanın yayına alınır",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{i + 1}</span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-6">
              <SellerForm isLoggedIn={!!session} defaultName={session?.name ?? ""} />
            </div>
          </div>

          <div className="space-y-4 lg:col-span-4">
            {TRUST.map((t) => (
              <div key={t.title} className="flex items-start gap-4 rounded-lg bg-paper p-6 ring-1 ring-stone">
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
