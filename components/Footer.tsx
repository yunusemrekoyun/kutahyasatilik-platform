import Link from "next/link";
import { Award, ShieldCheck, Zap, LineChart, Phone, MessageCircle } from "lucide-react";
import { SITE, telLink, whatsappLink } from "@/lib/site";
import { getSiteContact } from "@/lib/contact";
import { DISTRICTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function Footer() {
  const c = await getSiteContact();
  let menuPages: { slug: string; title: string }[] = [];
  try {
    menuPages = await prisma.page.findMany({
      where: { status: "published", showInMenu: true },
      orderBy: { menuOrder: "asc" },
      select: { slug: true, title: true },
    });
  } catch {
    /* veritabanı hazır değilse boş geç */
  }

  // "Yıl Tecrübe" ana sayfayla aynı Setting'ten (home_stat_years) — hardcode değil, admin yönetir.
  let statYears = "15";
  try {
    const row = await prisma.setting.findUnique({ where: { key: "home_stat_years" } });
    if (row?.value) statYears = row.value;
  } catch {
    /* db yoksa varsayılan */
  }

  return (
    <footer className="mt-20 bg-brand-950 text-slate-300">
      {/* Üst güven şeridi */}
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4">
          {[
            { Icon: Award, t: `${statYears}+ Yıl Tecrübe`, s: "Kütahya'da köklü emlak danışmanlığı" },
            { Icon: ShieldCheck, t: "Güvenli Satış", s: "Şeffaf, komisyonlu, tapuda güvence" },
            { Icon: Zap, t: "Hızlı Dönüş", s: "Taleplere aynı gün geri dönüş" },
            { Icon: LineChart, t: "Dijital Analiz", s: "Veri destekli yatırım analizi" },
          ].map((f) => (
            <div key={f.t} className="flex items-start gap-2.5">
              <f.Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" strokeWidth={1.7} />
              <div>
                <p className="text-sm font-semibold text-white">{f.t}</p>
                <p className="text-xs text-slate-400">{f.s}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-8 md:grid-cols-5">
        <div className="md:col-span-2">
          <span className="font-display text-xl font-bold tracking-tight text-white">
            Kütahya<span className="text-gold-400">Satılık</span>
          </span>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            {SITE.brand}. Kütahya merkez ve ilçelerinde satılık konut ve ticari
            gayrimenkul portföyü. Alım, satım ve yatırım danışmanlığında
            güvenilir çözüm ortağınız.
          </p>
          {(c.phoneRaw || c.whatsapp) && (
            <div className="mt-5 flex gap-2">
              {c.phoneRaw && (
                <a href={telLink(c.phoneRaw)} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"><Phone className="h-4 w-4" /> Ara</a>
              )}
              {c.whatsapp && (
                <a href={whatsappLink(c.whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
              )}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-gold-300">Kategoriler</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/daire" className="hover:text-gold-300">Satılık Daire</Link></li>
            <li><Link href="/arsa" className="hover:text-gold-300">Satılık Arsa</Link></li>
            <li><Link href="/villa" className="hover:text-gold-300">Satılık Villa</Link></li>
            <li><Link href="/yatirimlik-arsa" className="hover:text-gold-300">Yatırımlık Arsa</Link></li>
            <li><Link href="/harita" className="hover:text-gold-300">Harita ile Ara</Link></li>
            <li><Link href="/bolge-analizi" className="hover:text-gold-300">Bölge Fiyat Analizi</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-gold-300">Kurumsal</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/hakkimizda" className="hover:text-gold-300">Hakkımızda</Link></li>
            <li><Link href="/blog" className="hover:text-gold-300">Blog</Link></li>
            <li><Link href="/satici" className="hover:text-gold-300">Mülkünü Sat</Link></li>
            <li><Link href="/alici-talebi" className="hover:text-gold-300">Aradığını Bulamadın mı?</Link></li>
            <li><Link href="/degerleme" className="hover:text-gold-300">Ücretsiz Değerleme</Link></li>
            <li><Link href="/emlakci/kayit" className="hover:text-gold-300">Danışman Ol</Link></li>
            <li><Link href="/reklam" className="hover:text-gold-300">Reklam Vermek İstiyorum</Link></li>
            <li><Link href="/iletisim" className="hover:text-gold-300">İletişim</Link></li>
            <li><Link href="/kvkk" className="hover:text-gold-300">KVKK & Gizlilik</Link></li>
            {menuPages.map((p) => (
              <li key={p.slug}><Link href={`/sayfa/${p.slug}`} className="hover:text-gold-300">{p.title}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-gold-300">İlçeler</h4>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            {DISTRICTS.slice(0, 8).map((d) => (
              <li key={d.slug}>
                <Link href={`/ilanlar?ilce=${encodeURIComponent(d.name)}`} className="hover:text-gold-300">{d.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.domain} — Tüm hakları saklıdır.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/kvkk" className="hover:text-slate-300">KVKK</Link>
            <Link href="/iletisim" className="hover:text-slate-300">İletişim</Link>
            <Link href="/giris" className="hover:text-slate-300">Giriş</Link>
            <Link href="/admin" className="hover:text-slate-300">Yönetim</Link>
            <span className="hidden text-slate-700 sm:inline">|</span>
            <a
              href="https://bahalabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-400 hover:text-gold-300"
            >
              Geliştirici: <span className="text-gold-400">bahalabs.com</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
