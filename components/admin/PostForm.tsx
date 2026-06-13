"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { savePost } from "@/app/admin/actions";

// TipTap (ProseMirror) ağır; admin form bundle'ına girmemesi için lazy-load.
const RichEditor = dynamic(() => import("./RichEditor"), {
  ssr: false,
  loading: () => <div className="h-[340px] animate-pulse rounded-xl bg-slate-100" />,
});

type PostData = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content?: string;
  coverImage?: string | null;
  author?: string | null;
  tags?: string | null;
  status?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

export default function PostForm({ post }: { post?: PostData }) {
  const [cover, setCover] = useState<string>(post?.coverImage ?? "");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function uploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok && data.urls?.[0]) setCover(data.urls[0]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <form action={savePost} onSubmit={() => setSubmitting(true)} className="space-y-6">
      {post?.id && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="coverImage" value={cover} />

      <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="font-bold text-slate-900">Yazı Bilgileri</h2>
        <div className="mt-4 grid gap-4">
          <label className="block">
            <span className={labelCls}>Başlık *</span>
            <input name="title" required defaultValue={post?.title} className={inputCls} placeholder="Örn: Kütahya'da Yatırımlık Arsa Alırken Dikkat Edilmesi Gerekenler" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>URL (slug) — boş bırakılırsa başlıktan üretilir</span>
              <input name="slug" defaultValue={post?.slug} className={inputCls} placeholder="kutahya-yatirimlik-arsa-rehberi" />
            </label>
            <label className="block">
              <span className={labelCls}>Yazar</span>
              <input name="author" defaultValue={post?.author ?? ""} className={inputCls} placeholder="Kütahya Satılık" />
            </label>
          </div>
          <label className="block">
            <span className={labelCls}>Kısa Özet (liste & paylaşımda görünür)</span>
            <textarea name="excerpt" rows={2} defaultValue={post?.excerpt ?? ""} className={inputCls} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>Etiketler (virgülle)</span>
              <input name="tags" defaultValue={post?.tags ?? ""} className={inputCls} placeholder="yatırım, arsa, rehber" />
            </label>
            <label className="block">
              <span className={labelCls}>Durum</span>
              <select name="status" defaultValue={post?.status || "draft"} className={inputCls}>
                <option value="draft">Taslak (yayında değil)</option>
                <option value="published">Yayında</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {/* Kapak görseli */}
      <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="font-bold text-slate-900">Kapak Görseli</h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="relative h-28 w-44 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
            {cover && <Image src={cover} alt="" fill sizes="176px" className="object-cover" />}
          </div>
          <div>
            <label className="inline-block cursor-pointer rounded-lg bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100">
              {uploading ? "Yükleniyor..." : cover ? "Görseli Değiştir" : "Görsel Yükle"}
              <input type="file" accept="image/*" onChange={uploadCover} className="hidden" />
            </label>
            {cover && (
              <button type="button" onClick={() => setCover("")} className="ml-2 text-sm text-red-600 hover:underline">
                Kaldır
              </button>
            )}
          </div>
        </div>
      </section>

      {/* İçerik (WYSIWYG) */}
      <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="mb-3 font-bold text-slate-900">İçerik</h2>
        <RichEditor name="content" defaultValue={post?.content ?? ""} />
      </section>

      {/* SEO */}
      <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="font-bold text-slate-900">SEO (opsiyonel)</h2>
        <div className="mt-4 grid gap-4">
          <label className="block">
            <span className={labelCls}>Meta Başlık</span>
            <input name="metaTitle" defaultValue={post?.metaTitle ?? ""} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Meta Açıklama</span>
            <textarea name="metaDescription" rows={2} defaultValue={post?.metaDescription ?? ""} className={inputCls} />
          </label>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting || uploading} className="rounded-lg bg-brand-700 px-6 py-3 font-bold text-white hover:bg-brand-800 disabled:opacity-60">
          {submitting ? "Kaydediliyor..." : post?.id ? "Değişiklikleri Kaydet" : "Yazıyı Kaydet"}
        </button>
        <Link href="/admin/blog" className="rounded-lg px-6 py-3 font-medium text-slate-600 hover:bg-slate-100">İptal</Link>
      </div>
    </form>
  );
}
