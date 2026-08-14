"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import { DISTRICTS } from "@/lib/constants";
import { publicImageUrl } from "@/lib/media";
import { submitUserListing, type ListingFormState } from "@/app/(site)/ilan-ver/actions";

/** Emlak bilinçli olarak yok: bireysel akış yalnız bu iki kategoride açık. */
const SELF_SERVICE: CategoryKey[] = ["vasita", "teknoloji"];

const MAX_IMAGES = 6;

const fieldCls =
  "h-11 w-full rounded-lg border border-stone bg-paper px-3.5 text-[15px] text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";
const labelCls = "mb-1.5 block text-sm font-semibold text-ink";
const sectionCls = "border-t border-stone pt-6";

export default function UserListingForm() {
  const [state, formAction, pending] = useActionState<ListingFormState, FormData>(
    submitUserListing,
    {}
  );
  const [category, setCategory] = useState<CategoryKey>("vasita");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const definition = CATEGORIES[category];

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setUploadError(`En fazla ${MAX_IMAGES} fotoğraf ekleyebilirsiniz.`);
      return;
    }

    setUploading(true);
    setUploadError("");
    try {
      const body = new FormData();
      files.slice(0, room).forEach((file) => body.append("files", file));
      const res = await fetch("/api/upload/seller", { method: "POST", body });
      const data = await res.json().catch(() => null);
      // Fotoğraf seçildiği hâlde yükleme başarısızsa sessizce geçmiyoruz:
      // kullanıcı fotoğrafın gittiğini sanıp ilanı fotoğrafsız göndermesin.
      if (!res.ok || !data?.ok || !Array.isArray(data.urls) || !data.urls.length) {
        throw new Error(data?.error || "Fotoğraflar yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.");
      }
      setImages((current) => [...current, ...(data.urls as string[])].slice(0, MAX_IMAGES));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Fotoğraflar yüklenemedi.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="imagesJson" value={JSON.stringify(images)} />

      {/* Kategori — alt tür ve nitelik alanlarını belirler */}
      <div>
        <span className={labelCls}>Kategori</span>
        <div role="radiogroup" aria-label="Kategori" className="flex flex-wrap gap-2">
          {SELF_SERVICE.map((key) => {
            const on = key === category;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setCategory(key)}
                className={`min-h-11 rounded-lg border px-5 text-[15px] font-semibold transition ${
                  on ? "border-brand-700 bg-brand-700 text-white" : "border-stone bg-paper text-ink hover:border-brand-300"
                }`}
              >
                {CATEGORIES[key].label}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="category" value={category} />
        <p className="mt-2 text-xs text-muted">
          Emlak ilanları emlakçılarımız üzerinden yayımlanıyor.{" "}
          <a href="/satici" className="font-semibold text-brand-700 hover:underline">Mülkünüzü satmak için buraya bakın.</a>
        </p>
      </div>

      <div className={sectionCls}>
        <label htmlFor="propertyType" className={labelCls}>Tür</label>
        {/* key: kategori değişince tarayıcı eski seçimi korumasın */}
        <select id="propertyType" name="propertyType" key={category} required className={fieldCls} defaultValue="">
          <option value="" disabled>Seçin</option>
          {definition.subTypes.map((sub) => (
            <option key={sub.value} value={sub.value}>{sub.label}</option>
          ))}
        </select>
      </div>

      <div className={sectionCls}>
        <label htmlFor="title" className={labelCls}>İlan başlığı</label>
        <input id="title" name="title" required minLength={10} maxLength={120} className={fieldCls}
          placeholder={category === "vasita" ? "Örn. 2019 Renault Clio 1.5 dCi Touch" : "Örn. iPhone 14 Pro 256 GB Garantili"} />
      </div>

      <div>
        <label htmlFor="description" className={labelCls}>Açıklama</label>
        <textarea id="description" name="description" required minLength={20} maxLength={4000} rows={6}
          className={`${fieldCls} h-auto py-3`}
          placeholder="Ürünün durumu, kullanım geçmişi ve öne çıkan özellikleri..." />
      </div>

      {/* Kategoriye özel alanlar — kayıttan üretilir (lib/categories.ts) */}
      <div className={sectionCls}>
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">{definition.label} bilgileri</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {definition.fields.map((field) => {
            const id = `attr_${field.key}`;
            const error = state.fieldErrors?.[field.key];
            return (
              <div key={`${category}-${field.key}`}>
                <label htmlFor={id} className={labelCls}>
                  {field.label}
                  {field.unit ? <span className="font-normal text-muted"> ({field.unit})</span> : null}
                  {field.required ? <span className="text-red-600"> *</span> : null}
                </label>
                {field.type === "select" ? (
                  <select id={id} name={id} required={field.required} className={fieldCls} defaultValue="">
                    <option value="" disabled={field.required}>Seçin</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={id}
                    name={id}
                    required={field.required}
                    type={field.type === "number" ? "number" : "text"}
                    inputMode={field.type === "number" ? "numeric" : undefined}
                    min={field.min}
                    max={field.max}
                    maxLength={field.maxLength}
                    placeholder={field.placeholder}
                    className={fieldCls}
                  />
                )}
                {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className={sectionCls}>
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">Fiyat ve konum</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="price" className={labelCls}>Fiyat (₺)</label>
            <input id="price" name="price" required type="number" min={1} inputMode="numeric" className={fieldCls} placeholder="450000" />
          </div>
          <div>
            <label htmlFor="district" className={labelCls}>İlçe</label>
            <select id="district" name="district" required className={fieldCls} defaultValue="">
              <option value="" disabled>Seçin</option>
              {DISTRICTS.map((d) => <option key={d.slug} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="neighborhood" className={labelCls}>Mahalle <span className="font-normal text-muted">(opsiyonel)</span></label>
            <input id="neighborhood" name="neighborhood" maxLength={80} className={fieldCls} />
          </div>
        </div>
      </div>

      <div className={sectionCls}>
        <h2 className="mb-1 font-display text-lg font-semibold text-ink">Fotoğraflar</h2>
        <p className="mb-4 text-sm text-muted">En fazla {MAX_IMAGES} fotoğraf. İlk fotoğraf kapak olur.</p>

        <div className="flex flex-wrap gap-3">
          {images.map((url, index) => (
            <div key={url} className="relative h-24 w-24 overflow-hidden border border-stone bg-canvas">
              <Image src={publicImageUrl(url) || url} alt={`Fotoğraf ${index + 1}`} fill sizes="96px" className="object-cover" />
              <button
                type="button"
                onClick={() => setImages((current) => current.filter((item) => item !== url))}
                aria-label={`${index + 1}. fotoğrafı kaldır`}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/70 text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {images.length < MAX_IMAGES && (
            <label className="grid h-24 w-24 cursor-pointer place-items-center border border-dashed border-stone bg-paper text-muted transition hover:border-brand-400 hover:text-brand-700">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
              <input type="file" accept="image/*" multiple onChange={handleFiles} disabled={uploading} className="sr-only" />
              <span className="sr-only">Fotoğraf ekle</span>
            </label>
          )}
        </div>
        {uploadError ? <p className="mt-2 text-sm font-medium text-red-600">{uploadError}</p> : null}
      </div>

      {state.error ? (
        <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className={sectionCls}>
        <button
          type="submit"
          disabled={pending || uploading}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-6 text-base font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60 sm:w-auto"
        >
          {pending ? <><Loader2 className="h-5 w-5 animate-spin" /> Gönderiliyor...</> : "İlanı Gönder"}
        </button>
        <p className="mt-3 text-xs text-muted">
          İlanınız yayımlanmadan önce ekibimizin onayından geçer. Onaylandığında bildirim alırsınız.
        </p>
      </div>
    </form>
  );
}
