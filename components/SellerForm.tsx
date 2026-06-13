"use client";

import { useState } from "react";
import { useUtm } from "@/lib/useUtm";
import { trackConversion } from "@/lib/track";
import { DISTRICTS, PROPERTY_TYPES } from "@/lib/constants";

export default function SellerForm() {
  const utm = useUtm();
  const [status, setStatus] = useState<"idle" | "uploading" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  async function uploadPhotos(): Promise<string[]> {
    if (files.length === 0) return [];
    const fd = new FormData();
    files.slice(0, 6).forEach((f) => fd.append("files", f));
    const res = await fetch("/api/upload/seller", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok || !data.ok) return [];
    return data.urls as string[];
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      let photos: string[] = [];
      if (files.length > 0) {
        setStatus("uploading");
        photos = await uploadPhotos();
      }
      setStatus("loading");
      const payload = {
        type: "seller",
        name: String(fd.get("name") || ""),
        phone: String(fd.get("phone") || ""),
        district: String(fd.get("district") || ""),
        neighborhood: String(fd.get("neighborhood") || ""),
        propertyType: String(fd.get("propertyType") || ""),
        estimatedPrice: String(fd.get("estimatedPrice") || ""),
        message: String(fd.get("message") || ""),
        photos,
        ...utm,
      };
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Gönderilemedi");
      trackConversion({ type: "seller_lead", district: payload.district });
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="text-5xl">🎉</div>
        <h3 className="mt-3 text-2xl font-bold text-slate-900">Talebiniz alındı!</h3>
        <p className="mt-2 text-slate-600">
          Mülkünüz için en kısa sürede sizinle iletişime geçeceğiz. Doğru fiyatlandırma
          ve hızlı satış için ekibimiz sizi arayacak.
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <input name="name" required placeholder="Ad Soyad *" className={inputCls} />
        <input name="phone" required type="tel" placeholder="Telefon *" className={inputCls} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <select name="district" required defaultValue="" className={inputCls}>
          <option value="" disabled>İlçe seçin *</option>
          {DISTRICTS.map((d) => (
            <option key={d.slug} value={d.name}>{d.name}</option>
          ))}
        </select>
        <input name="neighborhood" placeholder="Mahalle" className={inputCls} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <select name="propertyType" required defaultValue="" className={inputCls}>
          <option value="" disabled>Mülk Türü *</option>
          {PROPERTY_TYPES.map((p) => (
            <option key={p.value} value={p.label}>{p.label}</option>
          ))}
        </select>
        <input name="estimatedPrice" placeholder="Tahmini Fiyat (₺)" className={inputCls} />
      </div>
      <textarea name="message" rows={2} placeholder="Eklemek istedikleriniz (m², oda sayısı, durum...)" className={inputCls} />

      <div>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Fotoğraf Yükle (opsiyonel, en fazla 6)</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
          />
        </label>
        {files.length > 0 && (
          <p className="mt-1.5 text-xs text-slate-500">{files.length} fotoğraf seçildi</p>
        )}
      </div>

      {status === "error" && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "uploading" || status === "loading"}
        className="w-full rounded-xl bg-gold-500 px-4 py-3.5 text-base font-bold text-slate-900 hover:bg-gold-400 disabled:opacity-60 transition shadow-md"
      >
        {status === "uploading"
          ? "Fotoğraflar yükleniyor..."
          : status === "loading"
          ? "Gönderiliyor..."
          : "Ücretsiz Değerleme Talep Et →"}
      </button>
      <p className="text-center text-xs text-slate-500">
        Komisyon ve satış sürecini sizin için yönetiyoruz. Hızlı, güvenli, şeffaf.
      </p>
    </form>
  );
}
