import Link from "next/link";
import PostForm from "@/components/admin/PostForm";

export const dynamic = "force-dynamic";

export default function NewPost() {
  return (
    <div>
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/admin/blog" className="hover:text-brand-700">Blog</Link>
        <span className="mx-2">/</span>
        <span>Yeni Yazı</span>
      </nav>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">Yeni Blog Yazısı</h1>
      <PostForm />
    </div>
  );
}
