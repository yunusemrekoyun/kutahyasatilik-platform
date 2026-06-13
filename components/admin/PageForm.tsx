"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { savePage } from "@/app/admin/actions";

// TipTap (ProseMirror) ağır; admin form bundle'ına girmemesi için lazy-load.
const RichEditor = dynamic(() => import("./RichEditor"), {
  ssr: false,
  loading: () => <div className="h-[340px] animate-pulse rounded-xl bg-slate-100" />,
});

type PageData = {
  id?: string;
  title?: string;
  slug?: string;
  content?: string;
  status?: string;
  showInMenu?: boolean;
  menuOrder?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

export default function PageForm({ page }: { page?: PageData }) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form action={savePage} onSubmit={() => setSubmitting(true)} className="space-y-6">
      {page?.id && <input type="hidden" name="id" value={page.id} />}

      <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="font-bold text-slate-900">Sayfa Bilgileri</h2>
        <div className="mt-4 grid gap-4">
          <label className="block">
            <span className={labelCls}>Sayfa Başlığı *</span>
            <input name="title" required defaultValue={page?.title} className={inputCls} placeholder="Örn: Hakkımızda" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>URL (slug) — sayfa /sayfa/&lt;slug&gt; adresinde yayınlanır</span>
              <input name="slug" defaultValue={page?.slug} className={inputCls} placeholder="hakkimizda" />
            </label>
            <label className="block">
              <span className={labelCls}>Durum</span>
              <select name="status" defaultValue={page?.status || "draft"} className={inputCls}>
                <option value="draft">Taslak (yayında değil)</option>
                <option value="published">Yayında</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="showInMenu" defaultChecked={page?.showInMenu} className="h-4 w-4 rounded border-slate-300" />
              Footer menüsünde göster
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              Menü sırası
              <input type="number" name="menuOrder" defaultValue={page?.menuOrder ?? 0} className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none" />
            </label>
          </div>
        </div>
      </section>

      {/* İçerik (WYSIWYG) */}
      <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="mb-3 font-bold text-slate-900">İçerik</h2>
        <RichEditor name="content" defaultValue={page?.content ?? ""} />
      </section>

      {/* SEO */}
      <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="font-bold text-slate-900">SEO (opsiyonel)</h2>
        <div className="mt-4 grid gap-4">
          <label className="block">
            <span className={labelCls}>Meta Başlık</span>
            <input name="metaTitle" defaultValue={page?.metaTitle ?? ""} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Meta Açıklama</span>
            <textarea name="metaDescription" rows={2} defaultValue={page?.metaDescription ?? ""} className={inputCls} />
          </label>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className="rounded-lg bg-brand-700 px-6 py-3 font-bold text-white hover:bg-brand-800 disabled:opacity-60">
          {submitting ? "Kaydediliyor..." : page?.id ? "Değişiklikleri Kaydet" : "Sayfayı Kaydet"}
        </button>
        <Link href="/admin/sayfalar" className="rounded-lg px-6 py-3 font-medium text-slate-600 hover:bg-slate-100">İptal</Link>
      </div>
    </form>
  );
}
