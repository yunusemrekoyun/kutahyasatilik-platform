import { LISTING_AMENITIES } from "@/lib/listingAmenities";

export type ProfessionalListingValues = {
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
  amenities?: Array<{ key: string }> | string[];
};

function selectedAmenityKeys(values?: ProfessionalListingValues) {
  return new Set(
    (values?.amenities ?? []).map((item) => (typeof item === "string" ? item : item.key)),
  );
}

function dateInputValue(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export default function ProfessionalListingFields({
  values,
  propertyType,
  inputClassName,
}: {
  values?: ProfessionalListingValues;
  propertyType: string;
  inputClassName: string;
}) {
  const selected = selectedAmenityKeys(values);
  const groups = Array.from(new Set(LISTING_AMENITIES.map((item) => item.group)));

  return (
    <>
      <section className="rounded-lg bg-paper p-6 ring-1 ring-stone">
        <h2 className="font-bold text-slate-900">Profesyonel İlan Bilgileri</h2>
        <p className="mt-1 text-xs text-slate-500">Yalnız doğrulayabildiğiniz bilgileri doldurun. Boş alanlar ilanda gösterilmez.</p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Krediye Uygunluk</span>
            <select name="creditEligible" defaultValue={values?.creditEligible ?? ""} className={inputClassName}>
              <option value="">Belirtilmedi</option>
              <option value="yes">Uygun</option>
              <option value="no">Uygun değil</option>
              <option value="unknown">Teyit edilmeli</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Kullanım Durumu</span>
            <select name="usageStatus" defaultValue={values?.usageStatus ?? ""} className={inputClassName}>
              <option value="">Belirtilmedi</option>
              <option value="vacant">Boş</option>
              <option value="tenant">Kiracılı</option>
              <option value="owner">Mülk sahibi kullanıyor</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Taşınmaz Durumu</span>
            <select name="propertyCondition" defaultValue={values?.propertyCondition ?? ""} className={inputClassName}>
              <option value="">Belirtilmedi</option>
              <option value="new">Sıfır</option>
              <option value="resale">İkinci el</option>
              <option value="under_construction">Yapım aşamasında</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Banyo Sayısı</span>
            <input name="bathroomCount" type="number" min="0" defaultValue={values?.bathroomCount ?? ""} className={inputClassName} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Aidat (₺)</span>
            <input name="dues" type="number" min="0" defaultValue={values?.dues ?? ""} className={inputClassName} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Tapu Tipi</span>
            <select name="deedType" defaultValue={values?.deedType ?? ""} className={inputClassName}>
              <option value="">Belirtilmedi</option>
              <option value="kat_mulkiyeti">Kat mülkiyeti</option>
              <option value="kat_irtifaki">Kat irtifakı</option>
              <option value="arsa_tapulu">Arsa tapulu</option>
              <option value="mustakil_tapu">Müstakil tapu</option>
              <option value="hisseli_tapu">Hisseli tapu</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">İskân Durumu</span>
            <select name="occupancyPermit" defaultValue={values?.occupancyPermit ?? ""} className={inputClassName}>
              <option value="">Belirtilmedi</option>
              <option value="available">İskânlı</option>
              <option value="unavailable">İskânsız</option>
              <option value="pending">Başvuru sürecinde</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">İlan Geçerlilik Tarihi</span>
            <input name="validUntil" type="date" defaultValue={dateInputValue(values?.validUntil)} className={inputClassName} />
          </label>
        </div>
        <label className="mt-4 flex min-h-11 items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="exchangeEligible" defaultChecked={values?.exchangeEligible === true} className="h-4 w-4 rounded border-slate-300" />
          Takasa uygun
        </label>
      </section>

      <section className="rounded-lg bg-paper p-6 ring-1 ring-stone">
        <h2 className="font-bold text-slate-900">Seçili Özellikler</h2>
        <p className="mt-1 text-xs text-slate-500">İlan sayfasında yalnız işaretlediğiniz özellikler gösterilir.</p>
        <div className="mt-5 space-y-5">
          {groups.map((group) => {
            const items = LISTING_AMENITIES.filter(
              (item) => item.group === group && (!item.propertyTypes || item.propertyTypes.includes(propertyType)),
            );
            if (!items.length) return null;
            return (
              <fieldset key={group}>
                <legend className="text-sm font-semibold text-slate-900">{items[0].groupLabel}</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <label key={item.key} className="flex min-h-11 items-center gap-2 rounded-lg border border-stone px-3 py-2 text-sm text-slate-700">
                      <input type="checkbox" name="amenities" value={item.key} defaultChecked={selected.has(item.key)} className="h-4 w-4 rounded border-slate-300" />
                      {item.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg bg-paper p-6 ring-1 ring-stone">
        <h2 className="font-bold text-slate-900">Konum ve Tapu Gizliliği</h2>
        <p className="mt-1 text-xs text-slate-500">Kesin konum ve parsel bilgileri yalnız açık izinle kamuya gösterilir.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Harita Konumu</span>
            <select name="locationVisibility" defaultValue={values?.locationVisibility ?? "approximate"} className={inputClassName}>
              <option value="hidden">Gizli</option>
              <option value="approximate">Yaklaşık bölge</option>
              <option value="exact">Kesin konum</option>
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 self-end rounded-lg border border-stone px-3 py-2 text-sm text-slate-700">
            <input type="checkbox" name="parcelVisibility" defaultChecked={values?.parcelVisibility === true} className="h-4 w-4 rounded border-slate-300" />
            Ada/parsel bilgisini ilanda göster
          </label>
        </div>
      </section>
    </>
  );
}
