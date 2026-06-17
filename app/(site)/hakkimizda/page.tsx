import type { Metadata } from "next";
import Link from "next/link";
import { Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sanitizeCmsHtml } from "@/lib/sanitize";
import { SITE, telLink } from "@/lib/site";
import NotFoundCTA from "@/components/NotFoundCTA";
import TrackView from "@/components/TrackView";

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
  };
}

const FALLBACK = `<p>Kütahya'nın dijital emlak ofisi olarak alım, satım ve yatırım danışmanlığında yanınızdayız.</p>`;

export default async function AboutPage() {
  const page = await getPage();
  const title = page?.title || "Kütahya'nın Dijital Emlak Ofisi";
  const content = page?.content || FALLBACK;

  return (
    <div>
      <TrackView />
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold-400">Kurumsal</p>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{title}</h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/ilanlar" className="rounded-[10px] bg-white px-6 py-3 font-semibold text-brand-800 transition hover:bg-brand-50">Portföyü İncele</Link>
            <a href={telLink()} className="inline-flex items-center gap-2 rounded-[10px] bg-white/10 px-6 py-3 font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/20"><Phone className="h-4 w-4" /> {SITE.phone}</a>
          </div>
        </div>
      </section>

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
