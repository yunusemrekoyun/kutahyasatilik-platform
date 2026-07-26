import Link from "next/link";
import { ArrowUpRight, Award, LineChart, MapPin, MessageCircle, Phone, ShieldCheck, Zap } from "lucide-react";
import ConsentSettingsLink from "@/components/ConsentSettingsLink";
import { getSiteContact } from "@/lib/contact";
import { DISTRICTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { SITE, telLink, whatsappLink } from "@/lib/site";

export default async function Footer() {
  const contact = await getSiteContact();
  let menuPages: { slug: string; title: string }[] = [];
  try {
    menuPages = await prisma.page.findMany({
      where: { status: "published", showInMenu: true },
      orderBy: { menuOrder: "asc" },
      select: { slug: true, title: true },
    });
  } catch {}

  let statYears = "";
  try {
    const row = await prisma.setting.findUnique({ where: { key: "home_stat_years" } });
    statYears = row?.value?.trim() || "";
  } catch {}

  return (
    <footer className="mt-20 bg-brand-950 text-slate-300">
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4">
          {[
            statYears
              ? { Icon: Award, title: `${statYears}+ Yıl Tecrübe`, text: "Kütahya'da yerel danışmanlık" }
              : { Icon: MapPin, title: "Kütahya Odaklı", text: "Merkez ve ilçe portföyü" },
            { Icon: ShieldCheck, title: "Şeffaf Süreç", text: "İlan ve iletişim bilgileri açık" },
            { Icon: Zap, title: "Doğrudan İletişim", text: "Telefon ve WhatsApp erişimi" },
            { Icon: LineChart, title: "Bölgesel Veriler", text: "Karar öncesi piyasa görünümü" },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="flex items-start gap-2.5">
              <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" strokeWidth={1.7} />
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs leading-5 text-slate-400">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <p className="font-display text-xl font-bold tracking-tight text-white">Kütahya<span className="text-gold-400">Satılık</span></p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            Kütahya merkez ve ilçelerinde güncel portföy, bölgesel veri ve yerel danışmanlık tek yerde.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {contact.phoneRaw && (
              <a href={telLink(contact.phoneRaw)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20">
                <Phone aria-hidden="true" className="h-4 w-4" /> {contact.phone}
              </a>
            )}
            {contact.whatsapp && (
              <a href={whatsappLink(contact.whatsapp, "Merhaba, gayrimenkul hakkında bilgi almak istiyorum.")} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700">
                <MessageCircle aria-hidden="true" className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gold-300">Portföy</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/ilanlar" className="hover:text-gold-300">Tüm İlanlar</Link></li>
            <li><Link href="/daire" className="hover:text-gold-300">Satılık Daire</Link></li>
            <li><Link href="/arsa" className="hover:text-gold-300">Satılık Arsa</Link></li>
            <li><Link href="/villa" className="hover:text-gold-300">Satılık Villa</Link></li>
            <li><Link href="/harita" className="hover:text-gold-300">Harita ile Ara</Link></li>
            <li><Link href="/bolge-analizi" className="hover:text-gold-300">Bölge Analizi</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gold-300">Hizmetler</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/satici" className="hover:text-gold-300">Mülkünü Sat</Link></li>
            <li><Link href="/alici-talebi" className="hover:text-gold-300">Alıcı Talebi</Link></li>
            <li><Link href="/degerleme" className="hover:text-gold-300">Ön Değerleme</Link></li>
            <li><Link href="/emlak-ofisleri" className="hover:text-gold-300">Emlak Ofisleri</Link></li>
            <li><Link href="/danismanlar" className="hover:text-gold-300">Danışmanlar</Link></li>
            <li><Link href="/yerel-araclar" className="hover:text-gold-300">Resmî Yerel Araçlar</Link></li>
            <li><Link href="/emlakci/kayit" className="hover:text-gold-300">Danışman Ol</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gold-300">İlçeler</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm md:grid-cols-1">
            {DISTRICTS.slice(0, 8).map((district) => (
              <li key={district.slug}><Link href={`/ilanlar?ilce=${encodeURIComponent(district.name)}`} className="hover:text-gold-300">{district.name}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.domain}. Tüm hakları saklıdır.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/kvkk" className="hover:text-slate-300">KVKK ve Gizlilik</Link>
            <Link href="/iletisim" className="hover:text-slate-300">İletişim</Link>
            <ConsentSettingsLink />
            {menuPages.map((page) => <Link key={page.slug} href={`/sayfa/${page.slug}`} className="hover:text-slate-300">{page.title}</Link>)}
            <a href="https://bahalabs.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-gold-300">Bahalabs <ArrowUpRight aria-hidden="true" className="h-3 w-3" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
