"use client";

import { useState } from "react";
import Link from "next/link";
import { saveDistrict } from "@/app/admin/actions";
import { parseJsonArray } from "@/lib/format";

type DistrictData = {
  id?: string;
  name?: string;
  slug?: string | null;
  lat?: number | null;
  lng?: number | null;
  investmentScore?: number | null;
  valueGrowth3yPct?: number | null;
  valueGrowth5yPct?: number | null;
  avgPriceDaire?: number | null;
  avgPriceArsaM2?: number | null;
  description?: string | null;
  transportNote?: string | null;
  nearbySchools?: string | null;
  nearbyHospitals?: string | null;
  sortOrder?: number | null;
};

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";
// Kimlik alanları (ad/slug/konum) sabit — salt-okunur; değer yine gönderilir (readOnly, disabled değil).
const roInputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-[15px] text-slate-500 outline-none cursor-not-allowed";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

export default function DistrictForm({ district }: { district?: DistrictData }) {
  const [submitting, setSubmitting] = useState(false);

  const schools = parseJsonArray(district?.nearbySchools).join("\n");
  const hospitals = parseJsonArray(district?.nearbyHospitals).join("\n");

  return (
    <form action={saveDistrict} onSubmit={() => setSubmitting(true)} className="space-y-6">
      {district?.id && <input type="hidden" name="id" value={district.id} />}

      {/* Temel bilgiler — ad/slug/konum sabit (Kütahya'nın 13 ilçesi); yalnızca analiz verisi düzenlenir */}
      <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="font-bold text-slate-900">İlçe Bilgileri</h2>
        <p className="mt-1 text-sm text-slate-500">İlçe adı ve konumu sabittir; yalnızca aşağıdaki analiz verilerini ve sıralamayı düzenleyebilirsiniz.</p>
        <div className="mt-4 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>İlçe Adı</span>
              <input name="name" required defaultValue={district?.name} readOnly className={roInputCls} />
            </label>
            <label className="block">
              <span className={labelCls}>URL (slug)</span>
              <input name="slug" defaultValue={district?.slug ?? ""} readOnly className={roInputCls} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className={labelCls}>Enlem (lat)</span>
              <input name="lat" type="number" step="any" defaultValue={district?.lat ?? ""} readOnly className={roInputCls} />
            </label>
            <label className="block">
              <span className={labelCls}>Boylam (lng)</span>
              <input name="lng" type="number" step="any" defaultValue={district?.lng ?? ""} readOnly className={roInputCls} />
            </label>
            <label className="block">
              <span className={labelCls}>Sıralama</span>
              <input name="sortOrder" type="number" defaultValue={district?.sortOrder ?? 0} className={inputCls} />
            </label>
          </div>
        </div>
      </section>

      {/* Bölge analizi puanları */}
      <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="font-bold text-slate-900">Bölge Analizi Puanları</h2>
        <p className="mt-1 text-sm text-slate-500">Boş bırakılan alan sitede gösterilmez.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={labelCls}>Yatırım Puanı (0-100)</span>
            <input name="investmentScore" type="number" defaultValue={district?.investmentScore ?? ""} className={inputCls} placeholder="0-100" />
          </label>
          <label className="block">
            <span className={labelCls}>Değer Artışı % (3 yıl)</span>
            <input name="valueGrowth3yPct" type="number" defaultValue={district?.valueGrowth3yPct ?? ""} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Değer Artışı % (5 yıl)</span>
            <input name="valueGrowth5yPct" type="number" defaultValue={district?.valueGrowth5yPct ?? ""} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Ort. Daire Fiyatı (₺)</span>
            <input name="avgPriceDaire" type="number" defaultValue={district?.avgPriceDaire ?? ""} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Ort. Arsa m² Fiyatı (₺)</span>
            <input name="avgPriceArsaM2" type="number" defaultValue={district?.avgPriceArsaM2 ?? ""} className={inputCls} />
          </label>
        </div>
      </section>

      {/* Açıklama & notlar */}
      <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="font-bold text-slate-900">Açıklama & Notlar</h2>
        <div className="mt-4 grid gap-4">
          <label className="block">
            <span className={labelCls}>Bölge Analizi Metni</span>
            <textarea name="description" rows={4} defaultValue={district?.description ?? ""} className={inputCls} placeholder="Bölgenin genel değerlendirmesi..." />
          </label>
          <label className="block">
            <span className={labelCls}>Ulaşım / Yatırım Projeleri Notu</span>
            <textarea name="transportNote" rows={3} defaultValue={district?.transportNote ?? ""} className={inputCls} placeholder="Ulaşım imkânları, planlanan projeler..." />
          </label>
        </div>
      </section>

      {/* Yakın kurumlar */}
      <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="font-bold text-slate-900">Yakın Kurumlar</h2>
        <p className="mt-1 text-sm text-slate-500">Her satıra bir kurum yazın.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>Yakın Okullar</span>
            <textarea name="nearbySchools" rows={5} defaultValue={schools} className={inputCls} placeholder={"Atatürk İlkokulu\nCumhuriyet Ortaokulu"} />
          </label>
          <label className="block">
            <span className={labelCls}>Yakın Hastaneler</span>
            <textarea name="nearbyHospitals" rows={5} defaultValue={hospitals} className={inputCls} placeholder={"Devlet Hastanesi\nÖzel Tıp Merkezi"} />
          </label>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className="rounded-lg bg-brand-700 px-6 py-3 font-bold text-white hover:bg-brand-800 disabled:opacity-60">
          {submitting ? "Kaydediliyor..." : district?.id ? "Değişiklikleri Kaydet" : "İlçeyi Kaydet"}
        </button>
        <Link href="/admin/ilceler" className="rounded-lg px-6 py-3 font-medium text-slate-600 hover:bg-slate-100">İptal</Link>
      </div>
    </form>
  );
}
