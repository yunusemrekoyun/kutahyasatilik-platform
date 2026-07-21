"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { savePopup } from "@/app/admin/actions";

type PopupData = {
  id?: string;
  title?: string;
  body?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkText?: string | null;
  active?: boolean;
  frequency?: string;
  delaySec?: number;
};

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-paper px-3.5 py-2.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

export default function PopupForm({ popup }: { popup?: PopupData }) {
  const [image, setImage] = useState(popup?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok && data.urls?.[0]) setImage(data.urls[0]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <form action={savePopup} onSubmit={() => setSubmitting(true)} className="max-w-2xl space-y-6">
      {popup?.id && <input type="hidden" name="id" value={popup.id} />}
      <input type="hidden" name="imageUrl" value={image} />

      <section className="rounded-lg bg-paper p-6 ring-1 ring-stone">
        <h2 className="font-bold text-slate-900">Reklam İçeriği</h2>
        <div className="mt-4 grid gap-4">
          <label className="block">
            <span className={labelCls}>Başlık *</span>
            <input name="title" required defaultValue={popup?.title} className={inputCls} placeholder="Örn: Bu Haftaya Özel Fırsatlar!" />
          </label>
          <label className="block">
            <span className={labelCls}>Açıklama Metni</span>
            <textarea name="body" rows={3} defaultValue={popup?.body ?? ""} className={inputCls} placeholder="Kısa duyuru / kampanya metni" />
          </label>

          {/* Görsel */}
          <div>
            <span className={labelCls}>Görsel (opsiyonel)</span>
            <div className="mt-1 flex items-center gap-4">
              <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-stone">
                {image && <Image src={image} alt="" fill sizes="160px" className="object-cover" />}
              </div>
              <div>
                <label className="inline-block cursor-pointer rounded-lg bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100">
                  {uploading ? "Yükleniyor..." : image ? "Değiştir" : "Görsel Yükle"}
                  <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
                </label>
                {image && <button type="button" onClick={() => setImage("")} className="ml-2 text-sm text-red-600 hover:underline">Kaldır</button>}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>Buton Metni</span>
              <input name="linkText" defaultValue={popup?.linkText ?? ""} className={inputCls} placeholder="Fırsatları Gör" />
            </label>
            <label className="block">
              <span className={labelCls}>Buton Adresi (URL)</span>
              <input name="linkUrl" defaultValue={popup?.linkUrl ?? ""} className={inputCls} placeholder="/ilanlar veya https://..." />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-paper p-6 ring-1 ring-stone">
        <h2 className="font-bold text-slate-900">Gösterim Ayarları</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={labelCls}>Gösterim Sıklığı</span>
            <select name="frequency" defaultValue={popup?.frequency || "session"} className={inputCls}>
              <option value="session">Oturumda bir kez</option>
              <option value="daily">Günde bir kez</option>
              <option value="always">Her ziyarette</option>
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Açılma Gecikmesi (sn)</span>
            <input name="delaySec" type="number" min={0} max={30} defaultValue={popup?.delaySec ?? 2} className={inputCls} />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
            <input type="checkbox" name="active" defaultChecked={popup?.active} className="h-4 w-4 rounded border-slate-300" />
            Yayında (aktif)
          </label>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting || uploading} className="rounded-lg bg-brand-700 px-6 py-3 font-bold text-white hover:bg-brand-800 disabled:opacity-60">
          {submitting ? "Kaydediliyor..." : popup?.id ? "Değişiklikleri Kaydet" : "Reklamı Kaydet"}
        </button>
        <Link href="/admin/reklamlar" className="rounded-lg px-6 py-3 font-medium text-slate-600 hover:bg-slate-100">İptal</Link>
      </div>
    </form>
  );
}
