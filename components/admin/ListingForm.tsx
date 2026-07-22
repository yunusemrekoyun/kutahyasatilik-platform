"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { saveListing } from "@/app/admin/actions";
import { DISTRICTS, PROPERTY_TYPES } from "@/lib/constants";
import VideoUploadField from "@/components/admin/VideoUploadField";
import LocationPicker from "@/components/LocationPicker";
import ThousandsInput from "@/components/ThousandsInput";
import ProfessionalListingFields from "@/components/listings/ProfessionalListingFields";
import { ArrowLeft, ArrowRight, Trash2, Star, Check } from "lucide-react";

type ListingData = {
  id?: string;
  title?: string;
  slug?: string;
  description?: string;
  propertyType?: string;
  listingType?: string;
  status?: string;
  agencyId?: string | null;
  referenceNo?: string | null;
  price?: number;
  currency?: string;
  district?: string;
  neighborhood?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  areaGross?: number | null;
  areaNet?: number | null;
  rooms?: string | null;
  floor?: string | null;
  totalFloors?: number | null;
  buildingAge?: string | null;
  heating?: string | null;
  furnished?: boolean;
  inSite?: boolean;
  balcony?: boolean;
  parking?: boolean;
  creditEligible?: string | null;
  usageStatus?: string | null;
  propertyCondition?: string | null;
  bathroomCount?: number | null;
  dues?: number | null;
  exchangeEligible?: boolean | null;
  deedType?: string | null;
  occupancyPermit?: string | null;
  validUntil?: Date | string | null;
  locationVisibility?: string | null;
  parcelVisibility?: boolean | null;
  deedStatus?: string | null;
  zoningStatus?: string | null;
  adaNo?: string | null;
  parselNo?: string | null;
  kaks?: string | null;
  videoUrl?: string | null;
  droneUrl?: string | null;
  virtualTourUrl?: string | null;
  featured?: boolean;
  verified?: boolean;
  investmentScore?: number | null;
  valueGrowthPct?: number | null;
  features?: string[];
  metaTitle?: string | null;
  metaDescription?: string | null;
  images?: { url: string }[];
  amenities?: { key: string }[];
};

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-paper px-3.5 py-2.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

export default function ListingForm({
  listing,
  agencies = [],
}: {
  listing?: ListingData;
  agencies?: { id: string; name: string; status: string }[];
}) {
  const [images, setImages] = useState<string[]>(listing?.images?.map((i) => i.url) ?? []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [propertyType, setPropertyType] = useState(listing?.propertyType || "daire");
  const isLand = propertyType === "arsa" || propertyType === "tarla";

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) setImages((prev) => [...prev, ...data.urls]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }
  function move(url: string, dir: -1 | 1) {
    setImages((prev) => {
      const i = prev.indexOf(url);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  return (
    <form action={saveListing} onSubmit={() => setSubmitting(true)} className="space-y-6">
      {listing?.id && <input type="hidden" name="id" value={listing.id} />}
      <input type="hidden" name="imagesJson" value={JSON.stringify(images)} />

      {/* Temel bilgiler */}
      <section className="rounded-lg bg-paper p-6 ring-1 ring-stone">
        <h2 className="font-bold text-slate-900">Temel Bilgiler</h2>
        <div className="mt-4 grid gap-4">
          <Field label="İlan Başlığı *">
            <input name="title" required defaultValue={listing?.title} className={inputCls} placeholder="Örn: Merkez'de 3+1 Sıfır Satılık Daire" />
          </Field>
          <Field label="Açıklama">
            <textarea name="description" rows={5} defaultValue={listing?.description} className={inputCls} placeholder="İlan detaylı açıklaması..." />
          </Field>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Mülk Türü *">
              <select name="propertyType" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={inputCls}>
                {PROPERTY_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Fiyat (₺) *">
              <ThousandsInput name="price" required defaultValue={listing?.price} placeholder="Örn. 2.500.000" className={inputCls} />
            </Field>
            <Field label="Para Birimi">
              <select name="currency" defaultValue={listing?.currency || "TRY"} className={inputCls}>
                <option value="TRY">₺ TL</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
              </select>
            </Field>
            <Field label="Durum">
              <select name="status" defaultValue={listing?.status || "active"} className={inputCls}>
                <option value="active">Aktif</option>
                <option value="sold">Satıldı</option>
                <option value="passive">Pasif</option>
              </select>
            </Field>
          </div>
          <Field label="Portföy sahibi firma">
            <select name="agencyId" defaultValue={listing?.agencyId ?? ""} className={inputCls}>
              <option value="">Bağımsız / firma yok</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}{agency.status !== "approved" ? " (onaysız)" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="İlan referans numarası">
            <input name="referenceNo" defaultValue={listing?.referenceNo ?? ""} placeholder="Örn. KS-2026-00125" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="İlçe *">
              <select name="district" defaultValue={listing?.district || "Merkez"} className={inputCls}>
                {DISTRICTS.map((d) => <option key={d.slug} value={d.name}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Mahalle">
              <input name="neighborhood" defaultValue={listing?.neighborhood ?? ""} className={inputCls} />
            </Field>
            <Field label="Adres / Tarif">
              <input name="address" defaultValue={listing?.address ?? ""} className={inputCls} />
            </Field>
          </div>
        </div>
      </section>

      {/* Görseller */}
      <section className="rounded-lg bg-paper p-6 ring-1 ring-stone">
        <h2 className="font-bold text-slate-900">Görseller</h2>
        <p className="text-xs text-slate-500">İlk görsel kapak olarak kullanılır. Sürükle-bırak yerine okları kullanın.</p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((url, i) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-stone">
              <Image src={url} alt="" fill sizes="120px" className="object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 rounded bg-brand-700 px-1.5 py-0.5 text-[10px] font-bold text-white">Kapak</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 opacity-0 transition group-hover:opacity-100">
                <button type="button" onClick={() => move(url, -1)} className="text-white text-xs px-1"><ArrowLeft className="h-4 w-4" /></button>
                <button type="button" onClick={() => removeImage(url)} className="text-red-300 text-xs px-1"><Trash2 className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(url, 1)} className="text-white text-xs px-1"><ArrowRight className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border-2 border-dashed border-slate-300 text-center text-xs text-slate-500 hover:border-brand-400 hover:text-brand-600">
            {uploading ? "Yükleniyor..." : "+ Görsel Ekle"}
            <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
          </label>
        </div>
      </section>

      {/* Medya: video / drone / sanal tur */}
      <section className="rounded-lg bg-paper p-6 ring-1 ring-stone">
        <h2 className="font-bold text-slate-900">Video & Sanal Tur</h2>
        <p className="text-xs text-slate-500">Tanıtım videosunu doğrudan yükleyin (önerilen) ya da YouTube/Vimeo linki yapıştırın. Boş bırakılırsa ilgili bölüm gösterilmez.</p>
        <div className="mt-4 grid gap-4">
          <Field label="Tanıtım Videosu (yükle veya link)">
            <VideoUploadField name="videoUrl" defaultValue={listing?.videoUrl ?? ""} />
          </Field>
          <Field label="Drone / Havadan Görüntü (YouTube/Vimeo)">
            <input name="droneUrl" defaultValue={listing?.droneUrl ?? ""} placeholder="https://www.youtube.com/watch?v=..." className={inputCls} />
          </Field>
          <Field label="360° Sanal Tur (Matterport, Kuula vb.)">
            <input name="virtualTourUrl" defaultValue={listing?.virtualTourUrl ?? ""} placeholder="https://my.matterport.com/show/?m=..." className={inputCls} />
          </Field>
        </div>
      </section>

      {/* Konut detayları */}
      <section className="rounded-lg bg-paper p-6 ring-1 ring-stone">
        <h2 className="font-bold text-slate-900">Detaylar</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Brüt m² *"><input name="areaGross" type="number" required min={1} defaultValue={listing?.areaGross ?? ""} className={inputCls} /></Field>
          <Field label="Net m²"><input name="areaNet" type="number" defaultValue={listing?.areaNet ?? ""} className={inputCls} /></Field>
          <Field label={isLand ? "Oda Sayısı" : "Oda Sayısı *"}><input name="rooms" required={!isLand} defaultValue={listing?.rooms ?? ""} placeholder="3+1" className={inputCls} /></Field>
          <Field label="Bulunduğu Kat"><input name="floor" defaultValue={listing?.floor ?? ""} className={inputCls} /></Field>
          <Field label="Kat Sayısı"><input name="totalFloors" type="number" defaultValue={listing?.totalFloors ?? ""} className={inputCls} /></Field>
          <Field label="Bina Yaşı"><input name="buildingAge" defaultValue={listing?.buildingAge ?? ""} className={inputCls} /></Field>
          <Field label="Isıtma"><input name="heating" defaultValue={listing?.heating ?? ""} className={inputCls} /></Field>
          <Field label="KAKS / Emsal"><input name="kaks" defaultValue={listing?.kaks ?? ""} className={inputCls} /></Field>
          <Field label={isLand ? "İmar Durumu *" : "İmar Durumu"}><input name="zoningStatus" required={isLand} defaultValue={listing?.zoningStatus ?? ""} placeholder="Konut, Ticari, İmara Açık..." className={inputCls} /></Field>
          <Field label="Tapu Durumu"><input name="deedStatus" defaultValue={listing?.deedStatus ?? ""} className={inputCls} /></Field>
          <Field label="Ada No"><input name="adaNo" defaultValue={listing?.adaNo ?? ""} className={inputCls} /></Field>
          <Field label="Parsel No"><input name="parselNo" defaultValue={listing?.parselNo ?? ""} className={inputCls} /></Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-5">
          {[
            { name: "furnished", label: "Eşyalı", val: listing?.furnished },
            { name: "inSite", label: "Site İçinde", val: listing?.inSite },
            { name: "balcony", label: "Balkon", val: listing?.balcony },
            { name: "parking", label: "Otopark", val: listing?.parking },
            { name: "featured", label: <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-current text-amber-500" /> Öne Çıkar</span>, val: listing?.featured },
            { name: "verified", label: <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-green-600" /> Doğrulanmış (tapu/ekspertiz)</span>, val: listing?.verified },
          ].map((c) => (
            <label key={c.name} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name={c.name} defaultChecked={c.val} className="h-4 w-4 rounded border-slate-300" />
              {c.label}
            </label>
          ))}
        </div>
        <div className="mt-4">
          <Field label="Özellikler (virgülle ayırın)">
            <input name="features" defaultValue={listing?.features?.join(", ") ?? ""} placeholder="Asansör, Otopark, Güvenlik" className={inputCls} />
          </Field>
        </div>
      </section>

      <ProfessionalListingFields values={listing} propertyType={propertyType} inputClassName={inputCls} />

      {/* Konum ve yatırım verisi */}
      <section className="rounded-lg bg-paper p-6 ring-1 ring-stone">
        <h2 className="font-bold text-slate-900">Konum & Yatırım Verisi</h2>
        <p className="mt-1 text-xs text-slate-500">Haritada tıklayarak veya pini sürükleyerek konumu işaretleyin; enlem/boylam otomatik dolar ve ilan haritada görünür.</p>
        <div className="mt-4">
          <LocationPicker initialLat={listing?.lat ?? null} initialLng={listing?.lng ?? null} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Yatırım Puanı (0-100)"><input name="investmentScore" type="number" min="0" max="100" defaultValue={listing?.investmentScore ?? ""} className={inputCls} /></Field>
          <Field label="Değer Artışı %"><input name="valueGrowthPct" type="number" defaultValue={listing?.valueGrowthPct ?? ""} className={inputCls} /></Field>
        </div>
        <p className="mt-2 text-xs text-slate-400">Yatırım puanı / değer artışı boş bırakılırsa ilçe verisinden otomatik hesaplanır.</p>
      </section>

      {/* SEO */}
      <section className="rounded-lg bg-paper p-6 ring-1 ring-stone">
        <h2 className="font-bold text-slate-900">SEO (opsiyonel)</h2>
        <div className="mt-4 grid gap-4">
          <Field label="Meta Başlık"><input name="metaTitle" defaultValue={listing?.metaTitle ?? ""} className={inputCls} /></Field>
          <Field label="Meta Açıklama"><textarea name="metaDescription" rows={2} defaultValue={listing?.metaDescription ?? ""} className={inputCls} /></Field>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting || uploading} className="rounded-lg bg-brand-700 px-6 py-3 font-bold text-white hover:bg-brand-800 disabled:opacity-60">
          {submitting ? "Kaydediliyor..." : listing?.id ? "Değişiklikleri Kaydet" : "İlanı Yayınla"}
        </button>
        <Link href="/admin/ilanlar" className="rounded-lg px-6 py-3 font-medium text-slate-600 hover:bg-slate-100">İptal</Link>
      </div>
    </form>
  );
}
