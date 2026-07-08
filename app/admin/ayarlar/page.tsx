import { Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { saveSettings } from "../actions";
import { SITE } from "@/lib/site";
import SettingImageField from "@/components/admin/SettingImageField";

export const dynamic = "force-dynamic";

async function getSettings() {
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  rows.forEach((r) => (map[r.key] = r.value));
  return map;
}

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none";

export default async function SettingsPage() {
  const s = await getSettings();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-slate-900">Ayarlar</h1>
      <p className="text-sm text-slate-500">İletişim ve marka bilgileri</p>

      <form action={saveSettings} className="mt-6 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Telefon (görünen)</span>
          <input name="phone" defaultValue={s.phone || SITE.phone} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">WhatsApp Numarası (ülke kodlu, sadece rakam)</span>
          <input name="whatsapp" defaultValue={s.whatsapp || SITE.whatsapp} placeholder="905320000000" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">E-posta</span>
          <input name="email" type="email" defaultValue={s.email || SITE.email} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Adres (iletişim sayfasında görünür)</span>
          <input name="address" defaultValue={s.address || SITE.address} className={inputCls} placeholder="Kütahya Merkez, ... Cad. No:.." />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Marka Sloganı</span>
          <input name="brand" defaultValue={s.brand || SITE.brand} className={inputCls} />
        </label>
        <div className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Ana Sayfa Hero Görseli</span>
          <SettingImageField name="home_hero_image" defaultValue={s.home_hero_image || ""} />
          <span className="mt-1.5 block text-xs text-slate-400">
            Ana sayfanın üst (lacivert) arama alanında silik arka plan olarak görünür. Boş bırakılırsa düz lacivert kullanılır.
          </span>
        </div>

        <div className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">&ldquo;Mülkünü Sat&rdquo; Hero Görseli</span>
          <SettingImageField name="seller_hero_image" defaultValue={s.seller_hero_image || ""} />
          <span className="mt-1.5 block text-xs text-slate-400">
            Mülkünü Sat sayfasının üst (lacivert) alanında silik arka plan olarak görünür. Boş bırakılırsa düz lacivert kullanılır.
          </span>
        </div>
        <button className="rounded-lg bg-brand-700 px-6 py-2.5 font-bold text-white hover:bg-brand-800">Kaydet</button>
      </form>

      <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-sm text-amber-800 ring-1 ring-amber-200">
        <p className="flex items-center gap-1.5 font-semibold"><Info className="h-4 w-4" />Not</p>
        <p className="mt-1">
          Buraya girdiğiniz telefon, WhatsApp, e-posta ve adres <strong>sitedeki tüm butonlarda ve
          iletişim alanlarında anında</strong> kullanılır (Kaydet&apos;e basınca). Telefon veya WhatsApp
          boş bırakılırsa ilgili buton sitede gösterilmez — böylece hatalı/eksik numara görünmez.
        </p>
      </div>
    </div>
  );
}
