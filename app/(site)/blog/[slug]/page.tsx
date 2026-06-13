import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { sanitizeCmsHtml } from "@/lib/sanitize";
import { mediaUrl } from "@/lib/media";
import { formatDate } from "@/lib/format";
import { SITE } from "@/lib/site";
import TrackView from "@/components/TrackView";
import NotFoundCTA from "@/components/NotFoundCTA";

export const revalidate = 300; // ISR: her 5 dakikada yenilenir (CDN cache + admin revalidatePath)

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { status: "published" },
    select: { slug: true },
    take: 1000,
  });
  return posts.map((p) => ({ slug: p.slug }));
}

async function getPost(slug: string) {
  return prisma.post.findFirst({ where: { slug, status: "published" } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Yazı bulunamadı" };
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || post.title;
  return {
    title,
    description,
    alternates: { canonical: `${SITE.url}/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const tags = (post.tags || "").split(",").map((t) => t.trim()).filter(Boolean);

  const related = await prisma.post.findMany({
    where: { status: "published", id: { not: post.id } },
    orderBy: [{ publishedAt: "desc" }],
    take: 3,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.coverImage || undefined,
    datePublished: (post.publishedAt ?? post.createdAt).toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Organization", name: post.author || SITE.name },
    publisher: { "@type": "Organization", name: SITE.name },
    url: `${SITE.url}/blog/${post.slug}`,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <TrackView />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-700">Ana Sayfa</Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:text-brand-700">Blog</Link>
      </nav>

      <p className="text-sm font-medium text-gold-600">{formatDate(post.publishedAt ?? post.createdAt)}</p>
      <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{post.title}</h1>
      {post.author && <p className="mt-2 text-sm text-slate-500">✍️ {post.author}</p>}

      {post.coverImage && (
        <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
          <Image src={mediaUrl(post.coverImage)} alt={post.title} fill sizes="(max-width:768px) 100vw, 768px" className="object-cover" priority />
        </div>
      )}

      <div
        className="cms-content mt-8"
        dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(post.content) }}
      />

      {tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
          {tags.map((t) => (
            <span key={t} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">#{t}</span>
          ))}
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-bold text-brand-900">Diğer Yazılar</h2>
          <div className="gold-divider mt-2 mb-5" />
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} href={`/blog/${r.slug}`} className="group rounded-xl bg-white p-4 ring-1 ring-slate-200 hover:ring-brand-200">
                <p className="text-[11px] font-medium text-gold-600">{formatDate(r.publishedAt ?? r.createdAt)}</p>
                <p className="mt-1 line-clamp-3 text-sm font-semibold text-slate-800 group-hover:text-brand-700">{r.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-14">
        <NotFoundCTA />
      </div>
    </article>
  );
}
