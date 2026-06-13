import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sanitizeCmsHtml } from "@/lib/sanitize";
import { SITE } from "@/lib/site";
import TrackView from "@/components/TrackView";

export const revalidate = 300; // ISR: her 5 dakikada yenilenir (CDN cache + admin revalidatePath)

export async function generateStaticParams() {
  const pages = await prisma.page.findMany({
    where: { status: "published" },
    select: { slug: true },
  });
  return pages.map((p) => ({ slug: p.slug }));
}

async function getPage(slug: string) {
  return prisma.page.findFirst({ where: { slug, status: "published" } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: "Sayfa bulunamadı" };
  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
    alternates: { canonical: `${SITE.url}/sayfa/${page.slug}` },
  };
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <TrackView />
      <h1 className="font-display text-3xl font-bold text-brand-900 sm:text-4xl">{page.title}</h1>
      <div className="gold-divider mt-3 mb-7" />
      <div className="cms-content" dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(page.content) }} />
    </div>
  );
}
