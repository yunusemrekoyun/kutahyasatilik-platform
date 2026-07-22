import Link from "next/link";
import { ArrowUpRight, MessageCircle, Phone } from "lucide-react";
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

  return (
    <footer className="mt-24 border-t border-white/10 bg-brand-950 text-brand-100">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-6 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-5">
          <p className="font-display text-3xl font-semibold tracking-tight text-white">Kütahya<span className="text-gold-400">Satılık</span></p>
          <p className="mt-5 max-w-md text-base leading-7 text-brand-200">
            Kütahya merkez ve ilçelerinde güncel portföy, bölgesel veri ve yerel danışmanlık tek yerde.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {contact.phoneRaw && (
              <a href={telLink(contact.phoneRaw)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/20 px-4 text-sm font-semibold text-white hover:bg-paper/10">
                <Phone className="h-4 w-4" /> {contact.phone}
              </a>
            )}
            {contact.whatsapp && (
              <a href={whatsappLink(contact.whatsapp, "Merhaba, gayrimenkul hakkında bilgi almak istiyorum.")} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/20 px-4 text-sm font-semibold text-white hover:bg-paper/10">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
          <div>
            <h2 className="eyebrow !text-gold-300">Portföy</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/ilanlar" className="hover:text-white">Tüm İlanlar</Link></li>
              <li><Link href="/daire" className="hover:text-white">Daire</Link></li>
              <li><Link href="/arsa" className="hover:text-white">Arsa</Link></li>
              <li><Link href="/villa" className="hover:text-white">Villa</Link></li>
              <li><Link href="/harita" className="hover:text-white">Haritada Ara</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="eyebrow !text-gold-300">Hizmetler</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/satici" className="hover:text-white">Mülkünü Sat</Link></li>
              <li><Link href="/alici-talebi" className="hover:text-white">Alıcı Talebi</Link></li>
              <li><Link href="/degerleme" className="hover:text-white">Ön Değerleme</Link></li>
              <li><Link href="/bolge-analizi" className="hover:text-white">Bölge Analizi</Link></li>
              <li><Link href="/emlak-ofisleri" className="hover:text-white">Emlak Ofisleri</Link></li>
              <li><Link href="/danismanlar" className="hover:text-white">Danışmanlar</Link></li>
              <li><Link href="/yerel-araclar" className="hover:text-white">Resmî Yerel Araçlar</Link></li>
              <li><Link href="/emlakci/kayit" className="hover:text-white">Danışman Ol</Link></li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <h2 className="eyebrow !text-gold-300">Kütahya</h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-1">
              {DISTRICTS.slice(0, 6).map((district) => (
                <li key={district.slug}><Link href={`/ilanlar?ilce=${encodeURIComponent(district.name)}`} className="hover:text-white">{district.name}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 text-xs text-brand-300 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <p>© {new Date().getFullYear()} {SITE.domain}. Tüm hakları saklıdır.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/kvkk" className="hover:text-white">KVKK ve Gizlilik</Link>
            <Link href="/iletisim" className="hover:text-white">İletişim</Link>
            <ConsentSettingsLink />
            {menuPages.map((page) => <Link key={page.slug} href={`/sayfa/${page.slug}`} className="hover:text-white">{page.title}</Link>)}
            <a href="https://bahalabs.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-white">Bahalabs <ArrowUpRight className="h-3 w-3" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
