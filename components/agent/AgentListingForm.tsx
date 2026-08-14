"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { submitAgentListing } from "@/app/emlakci/panel/actions";
import { DISTRICTS } from "@/lib/constants";
import { CATEGORIES, CATEGORY_LIST, isCategoryKey, type CategoryKey } from "@/lib/categories";
import LocationPicker from "@/components/LocationPicker";
import VideoUploadField from "@/components/admin/VideoUploadField";
import ThousandsInput from "@/components/ThousandsInput";
import ProfessionalListingFields from "@/components/listings/ProfessionalListingFields";
import { Info, ArrowLeft, ArrowRight, Trash2 } from "lucide-react";

type ListingData = {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  /** Emlak dışı kategorilerin JSONB nitelikleri (lib/categories.ts kaydına göre). */
  attributes?: Record<string, unknown> | null;
  propertyType?: string;
  listingType?: string;
  status?: string;
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
  features?: string[];
  images?: { url: string }[];
  amenities?: { key: string }[];
};

const inputCls =
  "w-full rounded-control border border-stone px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none";
const labelCls = "block text-sm font-medium text-ink mb-1";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

export default function AgentListingForm({ listing }: { listing?: ListingData }) {
  const [images, setImages] = useState<string[]>(listing?.images?.map((i) => i.url) ?? []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Alt türler ve nitelik alanları kategori kaydından; admin formuyla aynı desen.
  const initialCategory: CategoryKey = isCategoryKey(listing?.category) ? listing.category : "emlak";
  const [category, setCategory] = useState<CategoryKey>(initialCategory);
  const definition = CATEGORIES[category];
  const isRealEstate = category === "emlak";
  const [propertyType, setPropertyType] = useState(
    listing?.propertyType || definition.subTypes[0]?.value || "daire"
  );
  const isLand = isRealEstate && (propertyType === "arsa" || propertyType === "tarla");

  function switchCategory(next: CategoryKey) {
    setCategory(next);
    setPropertyType(CATEGORIES[next].subTypes[0]?.value ?? "");
  }

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
    <form action={submitAgentListing} onSubmit={() => setSubmitting(true)} className="space-y-6">
      {listing?.id && <input type="hidden" name="id" value={listing.id} />}
      <input type="hidden" name="imagesJson" value={JSON.stringify(images)} />

      <div className="flex items-start gap-2 rounded-control bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-100">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Eklediğiniz/güncellediğiniz ilan, yayına alınmadan önce yönetim onayından geçer.</span>
      </div>

      {/* Temel bilgiler */}
      <section className="rounded-card bg-paper p-6 border border-stone">
        <h2 className="font-bold text-ink">Temel Bilgiler</h2>
        <div className="mt-4 grid gap-4">
          <Field label="İlan Başlığı *">
            <input name="title" required defaultValue={listing?.title} className={inputCls} placeholder="Örn: Merkez'de 3+1 Sıfır Satılık Daire" />
          </Field>
          <Field label="Açıklama">
            <textarea name="description" rows={5} defaultValue={listing?.description} className={inputCls} placeholder="İlan detaylı açıklaması..." />
          </Field>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Kategori *">
              <select
                name="category"
                value={category}
                onChange={(e) => switchCategory(e.target.value as CategoryKey)}
                className={inputCls}
              >
                {CATEGORY_LIST.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </Field>
            <Field label={isRealEstate ? "Mülk Türü *" : "Tür *"}>
              <select name="propertyType" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={inputCls}>
                {definition.subTypes.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <input type="hidden" name="listingType" value="sale" />
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
          </div>
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
          {listing?.id && (
            <Field label="İlan Durumu">
              <select name="status" defaultValue={listing?.status || "active"} className={inputCls}>
                <option value="active">Aktif (Satışta)</option>
                <option value="sold">Satıldı</option>
              </select>
            </Field>
          )}
        </div>
      </section>

      {/* Görseller */}
      <section className="rounded-card bg-paper p-6 border border-stone">
        <h2 className="font-bold text-ink">Görseller</h2>
        <p className="text-xs text-muted">İlk görsel kapak olarak kullanılır. Sıralamak için okları kullanın.</p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((url, i) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-control border border-stone">
              <Image src={url} alt="" fill sizes="120px" className="object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 rounded bg-brand-700 px-1.5 py-0.5 text-[10px] font-bold text-white">Kapak</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 opacity-0 transition group-hover:opacity-100">
                <button type="button" onClick={() => move(url, -1)} className="px-1 text-white"><ArrowLeft className="h-4 w-4" /></button>
                <button type="button" onClick={() => removeImage(url)} className="px-1 text-red-300"><Trash2 className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(url, 1)} className="px-1 text-white"><ArrowRight className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          <label className="grid aspect-square cursor-pointer place-items-center rounded-control border-2 border-dashed border-stone text-center text-xs text-muted hover:border-brand-400 hover:text-brand-600">
            {uploading ? "Yükleniyor..." : "+ Görsel Ekle"}
            <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
          </label>
        </div>
      </section>

      {/* Medya: video / drone / sanal tur */}
      <section className="rounded-card bg-paper p-6 border border-stone">
        <h2 className="font-bold text-ink">Video & Sanal Tur (opsiyonel)</h2>
        <p className="text-xs text-muted">Tanıtım videosunu doğrudan yükleyin (önerilen) ya da YouTube/Vimeo linki yapıştırın. Sanal tur için Matterport/360 linki kullanın.</p>
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

      {/* Kategoriye özel nitelikler — kayıttan üretilir; emlakta kayıt boş döner */}
      {!isRealEstate && definition.fields.length > 0 && (
        <section className="rounded-card bg-paper p-6 border border-stone">
          <h2 className="font-bold text-ink">{definition.label} bilgileri</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {definition.fields.map((field) => {
              const id = `attr_${field.key}`;
              const current = listing?.attributes?.[field.key];
              return (
                <Field key={`${category}-${field.key}`} label={`${field.label}${field.unit ? ` (${field.unit})` : ""}${field.required ? " *" : ""}`}>
                  {field.type === "select" ? (
                    <select name={id} required={field.required} defaultValue={String(current ?? "")} className={inputCls}>
                      <option value="" disabled={field.required}>Seçin</option>
                      {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input
                      name={id}
                      required={field.required}
                      type={field.type === "number" ? "number" : "text"}
                      min={field.min}
                      max={field.max}
                      maxLength={field.maxLength}
                      placeholder={field.placeholder}
                      defaultValue={String(current ?? "")}
                      className={inputCls}
                    />
                  )}
                </Field>
              );
            })}
          </div>
        </section>
      )}

      {/* Detaylar — gayrimenkule özgü, emlak dışında hiç gösterilmez */}
      {isRealEstate && (
      <section className="rounded-card bg-paper p-6 border border-stone">
        <h2 className="font-bold text-ink">Detaylar</h2>
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
          ].map((c) => (
            <label key={c.name} className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name={c.name} defaultChecked={c.val} className="h-4 w-4 rounded border-stone" />
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

      )}

      {isRealEstate && (
        <ProfessionalListingFields values={listing} propertyType={propertyType} inputClassName={inputCls} />
      )}

      {/* Konum */}
      <section className="rounded-card bg-paper p-6 border border-stone">
        <h2 className="font-bold text-ink">Konum (opsiyonel)</h2>
        <p className="mt-1 text-xs text-muted">Haritada tıklayarak veya pini sürükleyerek konumu işaretleyin; ilan haritada görünür.</p>
        <div className="mt-4">
          <LocationPicker initialLat={listing?.lat ?? null} initialLng={listing?.lng ?? null} />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting || uploading} className="rounded-control bg-brand-700 px-6 py-3 font-bold text-white hover:bg-brand-800 disabled:opacity-60">
          {submitting ? "Gönderiliyor..." : listing?.id ? "Güncelle ve Onaya Gönder" : "İlanı Onaya Gönder"}
        </button>
        <Link href="/emlakci/panel" className="rounded-control px-6 py-3 font-medium text-muted hover:bg-canvas">İptal</Link>
      </div>
    </form>
  );
}
