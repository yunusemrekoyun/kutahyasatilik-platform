"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Mail, Phone, Heart, MessageCircle, Menu, X, User, ChevronDown,
  Map, BarChart3, Calculator, UserPlus, Star,
} from "lucide-react";
import { SITE, telLink, whatsappLink } from "@/lib/site";
import { useSiteContact } from "@/components/SiteContactProvider";
import { useStore } from "@/components/store/StoreProvider";
import NotificationBell from "@/components/NotificationBell";

// İlan tipleri (İlanlar menüsü)
const PROPERTY_LINKS = [
  { href: "/ilanlar", label: "Tüm İlanlar" },
  { href: "/daire", label: "Satılık Daire" },
  { href: "/arsa", label: "Satılık Arsa" },
  { href: "/villa", label: "Villa" },
  { href: "/yatirimlik-arsa", label: "Yatırımlık Arsa" },
  { href: "/isyeri", label: "İşyeri / Dükkan" },
];

// Keşfet menüsü: harita + bölge/değerleme araçları (her biri kısa açıklamalı — ne işe yaradığı net).
const EXPLORE_LINKS = [
  { href: "/harita", label: "Harita", desc: "İlanları haritada gör", Icon: Map },
  { href: "/bolge-analizi", label: "Bölge Analizi", desc: "İlçe fiyat & yatırım verisi", Icon: BarChart3 },
  { href: "/degerleme", label: "Değerleme", desc: "Mülkünün değerini öğren", Icon: Calculator },
];

const SIMPLE_LINKS = [
  { href: "/blog", label: "Blog" },
  { href: "/hakkimizda", label: "Kurumsal" },
];

export default function Header() {
  const [open, setOpen] = useState(false); // mobil menü
  const [menu, setMenu] = useState<string | null>(null); // masaüstü açılır menü
  const pathname = usePathname();
  const { favorites, hydrated } = useStore();
  const favCount = hydrated ? favorites.length : 0;
  const c = useSiteContact();

  // Oturum durumunu client-side al (layout statik/ISR kalsın diye sunucuda cookie okumuyoruz).
  const [account, setAccount] = useState<{ name: string } | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((d) => { if (active && d?.user) setAccount({ name: d.user.name }); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  const firstName = account?.name.trim().split(" ")[0] || "Hesabım";

  if (pathname?.startsWith("/admin")) return null;

  const isActive = (href: string) => pathname === href;
  const propActive = PROPERTY_LINKS.some((l) => pathname === l.href);
  const exploreActive = EXPLORE_LINKS.some((l) => pathname === l.href);

  const triggerCls = (active: boolean) =>
    `inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition ${
      active ? "font-semibold text-brand-800" : "font-medium text-slate-700 hover:text-brand-700"
    }`;

  return (
    <header className="sticky top-0 z-40">
      {/* Üst kurumsal bar */}
      <div className="hidden md:block bg-brand-950 text-brand-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <div className="flex items-center gap-2">
            <Star className="h-3.5 w-3.5 fill-current text-gold-300" />
            <span className="text-brand-200">{SITE.brand}</span>
            <span className="mx-1 h-3 w-px bg-white/15" />
            <span className="text-brand-300">Hafta içi 09:00–19:00 · Cmt 10:00–17:00</span>
          </div>
          <div className="flex items-center gap-4">
            {c.email && (
              <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 text-brand-200 hover:text-white">
                <Mail className="h-3.5 w-3.5" /> {c.email}
              </a>
            )}
            {c.phoneRaw && (
              <a href={telLink(c.phoneRaw)} className="inline-flex items-center gap-1.5 text-brand-200 hover:text-white">
                <Phone className="h-3.5 w-3.5" /> {c.phone}
              </a>
            )}
            {c.whatsapp && (
              <a href={whatsappLink(c.whatsapp, "Merhaba, gayrimenkul hakkında bilgi almak istiyorum.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-brand-200 hover:text-white">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            )}
            <span className="h-3.5 w-px bg-white/20" />
            <Link href="/emlakci/kayit" className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/20">
              <UserPlus className="h-3.5 w-3.5" /> Danışman Başvurusu
            </Link>
          </div>
        </div>
      </div>

      {/* Ana bar */}
      <div className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="shrink-0 font-display text-xl font-bold tracking-tight text-brand-900">
              Kütahya<span className="text-gold-600">Satılık</span>
            </Link>

            {/* Masaüstü nav */}
            <nav className="hidden items-center gap-0.5 lg:flex">
              {/* İlanlar */}
              <div className="relative" onMouseEnter={() => setMenu("ilanlar")} onMouseLeave={() => setMenu(null)}>
                <button
                  type="button"
                  aria-expanded={menu === "ilanlar"}
                  aria-haspopup="true"
                  onClick={() => setMenu((m) => (m === "ilanlar" ? null : "ilanlar"))}
                  className={triggerCls(propActive)}
                >
                  İlanlar <ChevronDown className={`h-4 w-4 transition ${menu === "ilanlar" ? "rotate-180" : ""}`} />
                </button>
                {menu === "ilanlar" && (
                  <div className="absolute left-0 top-full pt-2">
                    <div className="w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-brand-950/5">
                      {PROPERTY_LINKS.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          onClick={() => setMenu(null)}
                          className={`block rounded-lg px-3 py-2 text-sm transition ${
                            isActive(l.href) ? "bg-brand-50 font-semibold text-brand-800" : "text-slate-700 hover:bg-slate-50 hover:text-brand-700"
                          }`}
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Keşfet */}
              <div className="relative" onMouseEnter={() => setMenu("kesfet")} onMouseLeave={() => setMenu(null)}>
                <button
                  type="button"
                  aria-expanded={menu === "kesfet"}
                  aria-haspopup="true"
                  onClick={() => setMenu((m) => (m === "kesfet" ? null : "kesfet"))}
                  className={triggerCls(exploreActive)}
                >
                  Keşfet <ChevronDown className={`h-4 w-4 transition ${menu === "kesfet" ? "rotate-180" : ""}`} />
                </button>
                {menu === "kesfet" && (
                  <div className="absolute left-0 top-full pt-2">
                    <div className="w-72 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-brand-950/5">
                      {EXPLORE_LINKS.map(({ href, label, desc, Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMenu(null)}
                          className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition ${isActive(href) ? "bg-brand-50" : "hover:bg-slate-50"}`}
                        >
                          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-slate-800">{label}</span>
                            <span className="block text-xs text-slate-500">{desc}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {SIMPLE_LINKS.map((n) => (
                <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={triggerCls(isActive(n.href))}>
                  {n.label}
                </Link>
              ))}
            </nav>

            {/* Sağ aksiyonlar */}
            <div className="flex items-center gap-1.5">
              <Link href="/favoriler" aria-label="Favoriler" className="relative grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100">
                <Heart className="h-5 w-5" />
                {favCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-gold-500 text-[10px] font-bold text-brand-950">{favCount}</span>
                )}
              </Link>
              {account && <NotificationBell />}
              {/* Mobil: hesap her zaman üst barda görünür (ikon) — menüye gömülü değil */}
              <Link
                href={account ? "/hesabim" : "/giris"}
                aria-label={account ? "Hesabım" : "Giriş yap"}
                className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 sm:hidden"
              >
                <User className="h-5 w-5" />
              </Link>
              <Link
                href={account ? "/hesabim" : "/giris"}
                className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
              >
                <User className="h-4 w-4" /> {account ? firstName : "Giriş"}
              </Link>
              <Link
                href="/satici"
                className="hidden items-center gap-1.5 rounded-[10px] bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 sm:inline-flex"
              >
                Mülkünü Sat
              </Link>
              <button onClick={() => setOpen((o) => !o)} className="grid h-10 w-10 place-items-center rounded-md border border-slate-300 lg:hidden" aria-label="Menü">
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobil menü — sıralama: hesap → gezinme → ana eylem → iletişim */}
        {open && (
          <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
            {/* Hesap — en üstte, ilk görülen şey */}
            {account ? (
              <Link
                href="/hesabim"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl bg-brand-50 px-3.5 py-3 ring-1 ring-brand-100"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-700 text-white"><User className="h-4.5 w-4.5" /></span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-brand-900">Merhaba, {firstName}</span>
                  <span className="block text-xs text-brand-700">Hesabım · Taleplerim · Mesajlarım</span>
                </span>
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/giris" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 rounded-[10px] bg-brand-700 px-3 py-2.5 text-sm font-semibold text-white">
                  <User className="h-4 w-4" /> Giriş Yap
                </Link>
                <Link href="/kayit" onClick={() => setOpen(false)} className="flex items-center justify-center rounded-[10px] border border-brand-200 px-3 py-2.5 text-sm font-semibold text-brand-700">
                  Kayıt Ol
                </Link>
              </div>
            )}

            <nav className="mt-2 flex flex-col">
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">İlanlar</p>
              {PROPERTY_LINKS.map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand-50">{n.label}</Link>
              ))}
              <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Keşfet</p>
              {EXPLORE_LINKS.map(({ href, label, desc, Icon }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-brand-50">
                  <Icon className="h-4 w-4 shrink-0 text-brand-700" />
                  <span>
                    <span className="block text-sm font-medium text-slate-700">{label}</span>
                    <span className="block text-xs text-slate-400">{desc}</span>
                  </span>
                </Link>
              ))}
              <div className="my-2 h-px bg-slate-100" />
              {SIMPLE_LINKS.map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand-50">{n.label}</Link>
              ))}
              <Link href="/favoriler" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand-50">
                <Heart className="h-4 w-4" /> Favorilerim {favCount > 0 ? `(${favCount})` : ""}
              </Link>
            </nav>

            {/* Ana eylem */}
            <Link href="/satici" onClick={() => setOpen(false)} className="mt-3 block rounded-[10px] bg-brand-700 px-3 py-3 text-center text-sm font-semibold text-white">
              Mülkünü Sat
            </Link>

            {/* İletişim — etiketli, düzenli blok */}
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Bize Ulaşın</p>
              {(c.whatsapp || c.phoneRaw) && (
                <div className={`grid gap-2 ${c.whatsapp && c.phoneRaw ? "grid-cols-2" : "grid-cols-1"}`}>
                  {c.whatsapp && (
                    <a href={whatsappLink(c.whatsapp, "Merhaba, bilgi almak istiyorum.")} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2.5 text-sm font-semibold text-white">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  )}
                  {c.phoneRaw && (
                    <a href={telLink(c.phoneRaw)} className="flex items-center justify-center gap-1.5 rounded-lg border border-brand-200 px-3 py-2.5 text-sm font-semibold text-brand-700">
                      <Phone className="h-4 w-4" /> Bizi Ara
                    </a>
                  )}
                </div>
              )}
              <Link href="/emlakci/kayit" onClick={() => setOpen(false)} className="mt-2 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-center text-sm font-medium text-slate-500 hover:text-brand-700">
                <UserPlus className="h-4 w-4" /> Danışman olmak ister misin? Başvur
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
