import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import TrackView from "@/components/TrackView";
import { PenLine, ArrowRight } from "lucide-react";
import { PageIntro } from "@/components/ui/Editorial";

export const revalidate = 300; // ISR: her 5 dakikada yenilenir (CDN cache + admin revalidatePath)

export const metadata: Metadata = {
  title: "Gayrimenkul Rehberi - Doğru Mülk Nasıl Alınır?",
  description:
    "Doğru gayrimenkul nasıl alınır, nelere dikkat edilmeli? Kütahya'da daire, arsa ve villa alırken bilmeniz gereken her şey — uzman rehberlerimiz.",
  alternates: { canonical: "/blog" },
};

export default async function BlogList() {
  const posts = await prisma.post.findMany({
    where: { status: "published" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <TrackView />
      <PageIntro eyebrow="Yerel bilgi" title="Doğru Gayrimenkul Rehberi" intro="Kütahya'da alım, satım ve yatırım kararları için sahadan bilgiler, bölge analizleri ve pratik rehberler." />

      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-20">{posts.length === 0 ? (
        <p className="mt-12 rounded-lg bg-paper p-10 text-center text-slate-500 ring-1 ring-stone">
          Henüz yazı yayınlanmadı. Çok yakında burada olacağız.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group overflow-hidden rounded-lg bg-paper ring-1 ring-stone transition hover:shadow-prestige hover:ring-brand-200"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                {p.coverImage ? (
                  <Image src={p.coverImage} alt={p.title} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="grid h-full place-items-center text-slate-300"><PenLine className="h-10 w-10" /></div>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs font-medium text-gold-600">{formatDate(p.publishedAt ?? p.createdAt)}</p>
                <h2 className="mt-1.5 line-clamp-2 font-display text-lg font-bold text-slate-900 group-hover:text-brand-700">{p.title}</h2>
                {p.excerpt && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{p.excerpt}</p>}
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">Devamını oku <ArrowRight className="h-4 w-4" /></span>
              </div>
            </Link>
          ))}
        </div>
      )}</div>
    </div>
  );
}
