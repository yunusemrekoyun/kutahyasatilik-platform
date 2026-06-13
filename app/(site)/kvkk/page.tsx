import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { sanitizeCmsHtml } from "@/lib/sanitize";
import TrackView from "@/components/TrackView";

export const revalidate = 300; // ISR: her 5 dakikada yenilenir (CDN cache + admin revalidatePath)

async function getPage() {
  try {
    return await prisma.page.findFirst({ where: { slug: "kvkk", status: "published" } });
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage();
  return {
    title: page?.metaTitle || "KVKK & Gizlilik Politikası",
    description:
      page?.metaDescription || "Kişisel verilerin korunması ve gizlilik politikamız hakkında bilgilendirme.",
    robots: { index: false, follow: true },
  };
}

const FALLBACK = `<p>Kişisel verilerinizin korunmasına önem veriyoruz. Detaylı bilgi için bizimle iletişime geçebilirsiniz.</p>`;

export default async function KvkkPage() {
  const page = await getPage();
  const title = page?.title || "KVKK & Gizlilik Politikası";
  const content = page?.content || FALLBACK;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <TrackView />
      <h1 className="font-display text-3xl font-bold text-brand-900">{title}</h1>
      <div className="gold-divider mt-3 mb-8" />
      <div className="cms-content" dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(content) }} />
    </div>
  );
}
