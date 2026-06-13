import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PostForm from "@/components/admin/PostForm";

export const dynamic = "force-dynamic";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div>
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/admin/blog" className="hover:text-brand-700">Blog</Link>
        <span className="mx-2">/</span>
        <span>Düzenle</span>
      </nav>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">Yazıyı Düzenle</h1>
      <PostForm
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          author: post.author,
          tags: post.tags,
          status: post.status,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
        }}
      />
    </div>
  );
}
