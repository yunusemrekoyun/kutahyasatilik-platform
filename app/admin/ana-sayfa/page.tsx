import { prisma } from "@/lib/prisma";
import { saveHomeTexts } from "../actions";

export const dynamic = "force-dynamic";

const FIELDS: { key: string; label: string; hint?: string; type?: "text" | "textarea" }[] = [
  { key: "home_hero_badge", label: "Üst Rozet Metni", hint: "Örn: Kütahya'nın Dijital Emlak Ofisi" },
  { key: "home_hero_title", label: "Ana Başlık", hint: "Hero ana başlık (vurgu kelimesi hariç)" },
  { key: "home_hero_highlight", label: "Başlık Vurgu Kelimesi", hint: "Altın renkte görünen kısım" },
  { key: "home_hero_subtitle", label: "Alt Açıklama", type: "textarea" },
  { key: "home_stat_sales", label: "Tamamlanan Satış (gösterim)", hint: "Örn: 850" },
  { key: "home_stat_years", label: "Yıl Tecrübe (gösterim)", hint: "Örn: 15" },
  { key: "home_why_title", label: "'Neden Biz' Başlığı" },
];

export default async function AdminHomeTexts() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: FIELDS.map((f) => f.key) } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900">Ana Sayfa Metinleri</h1>
      <p className="text-sm text-slate-500">
        Ana sayfadaki başlık ve metinleri buradan düzenleyin. Boş bırakılan alanlar varsayılan metni gösterir.
      </p>

      <form action={saveHomeTexts} className="mt-6 max-w-2xl space-y-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{f.label}</span>
            {f.type === "textarea" ? (
              <textarea name={f.key} rows={3} defaultValue={map.get(f.key) ?? ""} className={inputCls} />
            ) : (
              <input name={f.key} defaultValue={map.get(f.key) ?? ""} className={inputCls} />
            )}
            {f.hint && <span className="mt-1 block text-xs text-slate-400">{f.hint}</span>}
          </label>
        ))}
        <button className="rounded-lg bg-brand-700 px-6 py-3 font-bold text-white hover:bg-brand-800">
          Metinleri Kaydet
        </button>
      </form>
    </div>
  );
}
