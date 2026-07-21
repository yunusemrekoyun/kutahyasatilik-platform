import type { Metadata } from "next";
import Link from "next/link";
import { Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sanitizeCmsHtml } from "@/lib/sanitize";
import { SITE, telLink } from "@/lib/site";
import { getSiteContact } from "@/lib/contact";
import NotFoundCTA from "@/components/NotFoundCTA";
import TrackView from "@/components/TrackView";
import { PageIntro } from "@/components/ui/Editorial";

export const revalidate = 300; // ISR: her 5 dakikada yenilenir (CDN cache + admin revalidatePath)

async function getPage() {
  try {
    return await prisma.page.findFirst({ where: { slug: "hakkimizda", status: "published" } });
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage();
  return {
    title: page?.metaTitle || "Hakkımızda - Kurumsal",
    description:
      page?.metaDescription ||
      "Kütahya'nın dijital emlak ofisi. Güvenilir, şeffaf ve teknoloji odaklı emlak danışmanlığı.",
    alternates: { canonical: `${SITE.url}/hakkimizda` },
  };
}

const FALLBACK = `<p>Kütahya'nın dijital emlak ofisi olarak alım, satım ve yatırım danışmanlığında yanınızdayız.</p>`;

export default async function AboutPage() {
  const page = await getPage();
  const title = page?.title || "Kütahya'nın Dijital Emlak Ofisi";
  const content = page?.content || FALLBACK;
  const c = await getSiteContact();

  return (
    <div>
      <TrackView />
      <PageIntro eyebrow="Kurumsal" title={title} intro="Kütahya'nın ilçelerini, mahallelerini ve gayrimenkul dinamiklerini yakından bilen yerel bir ekibiz." actions={<><Link href="/ilanlar" className="rounded-lg bg-brand-700 px-6 py-3 font-semibold text-white hover:bg-brand-800">Portföyü incele</Link>{c.phoneRaw && <a href={telLink(c.phoneRaw)} className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-paper px-6 py-3 font-semibold text-brand-800"><Phone className="h-4 w-4" /> {c.phone}</a>}</>} />

      {/* İçerik (admin'den düzenlenebilir) */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <div className="cms-content" dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(content) }} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <NotFoundCTA title="Gayrimenkul yolculuğunuza birlikte başlayalım" />
      </section>
    </div>
  );
}
