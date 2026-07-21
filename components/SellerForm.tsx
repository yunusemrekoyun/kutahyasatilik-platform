"use client";

import { useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { useUtm } from "@/lib/useUtm";
import { trackAdsConversion } from "@/lib/track";
import { isValidTrPhone, TR_PHONE_ERROR } from "@/lib/validation";
import { DISTRICTS, PROPERTY_TYPES } from "@/lib/constants";
import LocationPicker from "@/components/LocationPicker";
import LoginRequiredNotice from "@/components/LoginRequiredNotice";
import ThousandsInput from "@/components/ThousandsInput";

export default function SellerForm({
  isLoggedIn = true,
  defaultName = "",
}: {
  isLoggedIn?: boolean;
  defaultName?: string;
}) {
  const utm = useUtm();
  const [status, setStatus] = useState<"idle" | "uploading" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  async function uploadPhotos(): Promise<string[]> {
    if (files.length === 0) return [];
    const fd = new FormData();
    files.slice(0, 6).forEach((f) => fd.append("files", f));
    const res = await fetch("/api/upload/seller", { method: "POST", body: fd });
    const data = await res.json().catch(() => null);
    // Fotoğraf seçildiği hâlde yükleme başarısızsa SESSİZCE geçme — kullanıcı
    // fotoğrafın gittiğini sanıp gönderemesin (sessiz veri kaybı). Hata fırlat.
    if (!res.ok || !data?.ok || !Array.isArray(data.urls) || data.urls.length === 0) {
      throw new Error(
        (data && data.error) ||
          "Fotoğraflar yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin ya da fotoğrafları çıkarıp öyle gönderin."
      );
    }
    return data.urls as string[];
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    if (!isValidTrPhone(String(fd.get("phone") || ""))) {
      setStatus("error");
      setError(TR_PHONE_ERROR);
      return;
    }
    try {
      let photos: string[] = [];
      if (files.length > 0) {
        setStatus("uploading");
        photos = await uploadPhotos();
      }
      setStatus("loading");
      const latVal = fd.get("lat");
      const lngVal = fd.get("lng");
      const lat = latVal ? Number(latVal) : undefined;
      const lng = lngVal ? Number(lngVal) : undefined;
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
        ...(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {}),
        ...utm,
      };
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Gönderilemedi");
      trackAdsConversion({ type: "seller_lead", district: payload.district });
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  }

  // Talep bırakmak için giriş zorunlu.
  if (!isLoggedIn) {
    return <LoginRequiredNotice text="Mülk satış talebi için giriş yapın" />;
  }

  if (status === "ok") {
    return (
      <div className="rounded-lg bg-paper p-8 text-center ring-1 ring-stone">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-50 text-green-600 ring-1 ring-green-200">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h3 className="mt-4 font-display text-2xl font-bold text-slate-900">Talebiniz alındı</h3>
        <p className="mt-2 leading-relaxed text-slate-600">
          Mülkünüz için en geç 1 iş günü içinde sizinle iletişime geçeceğiz. Sürecini
          &ldquo;Hesabım → Taleplerim&rdquo; sayfasından takip edebilirsiniz.
        </p>
      </div>
    );
  }

  const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";
  const inputCls =
    "w-full h-12 rounded-[10px] border border-slate-300 bg-paper px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sf-name" className={labelCls}>Ad Soyad <span className="text-red-500">*</span></label>
          <input id="sf-name" name="name" required defaultValue={defaultName} placeholder="Adınız ve soyadınız" className={inputCls} />
        </div>
        <div>
          <label htmlFor="sf-phone" className={labelCls}>Telefon <span className="text-red-500">*</span></label>
          <input id="sf-phone" name="phone" required type="tel" inputMode="tel" placeholder="05__ ___ __ __" className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sf-district" className={labelCls}>İlçe <span className="text-red-500">*</span></label>
          <select id="sf-district" name="district" required defaultValue="" className={inputCls}>
            <option value="" disabled>İlçe seçin</option>
            {DISTRICTS.map((d) => (
              <option key={d.slug} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sf-neighborhood" className={labelCls}>Mahalle</label>
          <input id="sf-neighborhood" name="neighborhood" placeholder="Mahalle (opsiyonel)" className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sf-type" className={labelCls}>Mülk Türü <span className="text-red-500">*</span></label>
          <select id="sf-type" name="propertyType" required defaultValue="" className={inputCls}>
            <option value="" disabled>Tür seçin</option>
            {PROPERTY_TYPES.map((p) => (
              <option key={p.value} value={p.label}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sf-price" className={labelCls}>Mülk için istenilen fiyat</label>
          {/* submitFormatted: serbest-metin alan — "2.500.000" olarak saklanır, her yerde okunaklı görünür */}
          <ThousandsInput id="sf-price" name="estimatedPrice" submitFormatted placeholder="Örn. 2.500.000" className={inputCls} />
        </div>
      </div>
      <div>
        <label htmlFor="sf-message" className={labelCls}>Eklemek istedikleriniz</label>
        <textarea id="sf-message" name="message" rows={3} placeholder="m², oda sayısı, bina durumu gibi detaylar..." className={`${inputCls} h-auto py-3 leading-relaxed`} />
      </div>

      <div>
        <span className={labelCls}>Konum <span className="font-normal text-slate-400">(opsiyonel — mülkün yerini haritada işaretleyin)</span></span>
        <LocationPicker latName="lat" lngName="lng" />
      </div>

      <div>
        <span className={labelCls}>Fotoğraf ekleyin <span className="font-normal text-slate-400">(opsiyonel, en fazla 6)</span></span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-[10px] file:border-0 file:bg-brand-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
        />
        {files.length > 0 && (
          <p className="mt-1.5 text-sm text-slate-500">{files.length} fotoğraf seçildi</p>
        )}
      </div>

      {status === "error" && (
        <p className="rounded-[10px] bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 ring-1 ring-red-200">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === "uploading" || status === "loading"}
        className="w-full rounded-[10px] bg-brand-700 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
      >
        {status === "uploading"
          ? "Fotoğraflar yükleniyor..."
          : status === "loading"
          ? "Gönderiliyor..."
          : "İlan Talebi Oluştur"}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-center text-[13px] text-slate-500">
        <Lock className="h-3.5 w-3.5" /> Bilgileriniz KVKK kapsamında korunur. Spam göndermiyoruz.
      </p>
    </form>
  );
}
