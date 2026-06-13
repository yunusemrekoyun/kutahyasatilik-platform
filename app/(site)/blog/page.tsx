import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import TrackView from "@/components/TrackView";

export const revalidate = 300; // ISR: her 5 dakikada yenilenir (CDN cache + admin revalidatePath)

export const metadata: Metadata = {
  title: "Gayrimenkul Rehberi - Doğru Mülk Nasıl Alınır?",
  description:
    "Doğru gayrimenkul nasıl alınır, nelere dikkat edilmeli? Kütahya'da daire, arsa ve villa alırken bilmeniz gereken her şey — uzman rehberlerimiz.",
};

export default async function BlogList() {
  const posts = await prisma.post.findMany({
    where: { status: "published" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <TrackView />
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 ring-1 ring-brand-100">
          💙 Müşterilerimizi Önemsiyoruz
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-brand-900 sm:text-4xl">
          Doğru Gayrimenkul Rehberi
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Doğru gayrimenkul nasıl alınır, nelere dikkat edilmeli? Yıllara dayanan
          deneyimimizi sizinle paylaşıyoruz; bilinçli ve güvenli kararlar verin.
        </p>
        <div className="gold-divider mx-auto mt-4" />
      </div>

      {posts.length === 0 ? (
        <p className="mt-12 rounded-2xl bg-white p-10 text-center text-slate-500 ring-1 ring-slate-200">
          Henüz yazı yayınlanmadı. Çok yakında burada olacağız.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition hover:shadow-prestige hover:ring-brand-200"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                {p.coverImage ? (
                  <Image src={p.coverImage} alt={p.title} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="grid h-full place-items-center text-4xl text-slate-300">✍️</div>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs font-medium text-gold-600">{formatDate(p.publishedAt ?? p.createdAt)}</p>
                <h2 className="mt-1.5 line-clamp-2 font-display text-lg font-bold text-slate-900 group-hover:text-brand-700">{p.title}</h2>
                {p.excerpt && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{p.excerpt}</p>}
                <span className="mt-3 inline-block text-sm font-semibold text-brand-700">Devamını oku →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
