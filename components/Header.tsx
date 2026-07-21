"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  Heart,
  Map,
  Menu,
  MessageCircle,
  Phone,
  User,
  X,
} from "lucide-react";
import { useSiteContact } from "@/components/SiteContactProvider";
import { useStore } from "@/components/store/StoreProvider";
import NotificationBell from "@/components/NotificationBell";
import { telLink, whatsappLink } from "@/lib/site";

const PROPERTY_LINKS = [
  { href: "/ilanlar", label: "Tüm İlanlar" },
  { href: "/daire", label: "Daire" },
  { href: "/arsa", label: "Arsa" },
  { href: "/villa", label: "Villa" },
  { href: "/yatirimlik-arsa", label: "Yatırımlık Arsa" },
  { href: "/isyeri", label: "İşyeri" },
];

const PRIMARY_LINKS = [
  { href: "/harita", label: "Harita", Icon: Map },
  { href: "/bolge-analizi", label: "Bölge Analizi", Icon: BarChart3 },
  { href: "/blog", label: "Rehber" },
  { href: "/hakkimizda", label: "Hakkımızda" },
];

export default function Header() {
  const pathname = usePathname();
  const contact = useSiteContact();
  const { favorites, hydrated } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [listingMenuOpen, setListingMenuOpen] = useState(false);
  const [account, setAccount] = useState<{ name: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/user/me")
      .then((response) => response.json())
      .then((data) => { if (active && data?.user) setAccount({ name: data.user.name }); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  const favoriteCount = hydrated ? favorites.length : 0;
  const firstName = account?.name.trim().split(" ")[0] || "Hesabım";
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname?.startsWith(`${href}/`));
  const listingActive = PROPERTY_LINKS.some((item) => isActive(item.href));

  return (
    <header className="sticky top-0 z-40 border-b border-stone bg-paper/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-5 px-4 sm:px-6">
        <Link href="/" className="shrink-0 leading-none" aria-label="Kütahya Satılık ana sayfa">
          <span className="block font-display text-[22px] font-bold tracking-[-0.02em] text-brand-950">
            Kütahya<span className="text-gold-700">Satılık</span>
          </span>
          <span className="mt-1 hidden text-[9px] font-bold uppercase tracking-[0.2em] text-muted sm:block">
            Yerel gayrimenkul rehberi
          </span>
        </Link>

        <nav className="hidden h-full items-center gap-7 lg:flex" aria-label="Ana menü">
          <div
            className="relative flex h-full items-center"
            onMouseEnter={() => setListingMenuOpen(true)}
            onMouseLeave={() => setListingMenuOpen(false)}
          >
            <button
              type="button"
              onClick={() => setListingMenuOpen((open) => !open)}
              aria-expanded={listingMenuOpen}
              className={`inline-flex h-full items-center gap-1 border-b-2 text-sm font-semibold transition ${listingActive ? "border-gold-700 text-brand-950" : "border-transparent text-slate-600 hover:text-brand-950"}`}
            >
              İlanlar <ChevronDown className={`h-4 w-4 transition ${listingMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {listingMenuOpen && (
              <div className="absolute left-0 top-full pt-3">
                <div className="w-56 border border-stone bg-paper p-2 shadow-prestige">
                  {PROPERTY_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setListingMenuOpen(false)}
                      className={`block rounded-lg px-3 py-2.5 text-sm transition ${isActive(item.href) ? "bg-brand-50 font-semibold text-brand-800" : "text-slate-700 hover:bg-canvas"}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          {PRIMARY_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-full items-center border-b-2 text-sm font-semibold transition ${isActive(item.href) ? "border-gold-700 text-brand-950" : "border-transparent text-slate-600 hover:text-brand-950"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link href="/favoriler" aria-label="Favoriler" className="relative grid h-11 w-11 place-items-center rounded-lg text-slate-600 hover:bg-canvas hover:text-brand-900">
            <Heart className="h-5 w-5" />
            {favoriteCount > 0 && <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-gold-600 px-1 text-center text-[9px] font-bold text-white">{favoriteCount}</span>}
          </Link>
          {account && <NotificationBell />}
          <Link href={account ? "/hesabim" : "/giris"} className="hidden h-11 items-center gap-2 px-2 text-sm font-semibold text-slate-700 hover:text-brand-900 sm:inline-flex">
            <User className="h-4 w-4" /> {account ? firstName : "Giriş"}
          </Link>
          <Link href="/satici" className="ml-1 hidden rounded-lg bg-brand-700 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-800 sm:inline-flex">
            Mülkünü Sat
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="grid h-11 w-11 place-items-center rounded-lg border border-stone text-brand-900 lg:hidden"
            aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-stone bg-paper px-5 pb-8 pt-5 lg:hidden">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {PROPERTY_LINKS.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="border-b border-stone py-3 text-sm font-semibold text-ink">{item.label}</Link>
            ))}
          </div>
          <div className="mt-5 grid gap-1">
            {PRIMARY_LINKS.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex min-h-11 items-center gap-3 border-b border-stone py-3 text-sm font-semibold text-ink">
                {item.Icon ? <item.Icon className="h-4 w-4 text-brand-600" /> : null}{item.label}
              </Link>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link href={account ? "/hesabim" : "/giris"} onClick={() => setMobileOpen(false)} className="flex min-h-11 items-center justify-center rounded-lg border border-brand-200 text-sm font-semibold text-brand-800">
              {account ? firstName : "Giriş Yap"}
            </Link>
            <Link href="/satici" onClick={() => setMobileOpen(false)} className="flex min-h-11 items-center justify-center rounded-lg bg-brand-700 text-sm font-semibold text-white">Mülkünü Sat</Link>
          </div>
          {(contact.phoneRaw || contact.whatsapp) && (
            <div className="mt-6 flex flex-wrap gap-4 border-t border-stone pt-5 text-sm font-semibold">
              {contact.phoneRaw && <a href={telLink(contact.phoneRaw)} className="inline-flex items-center gap-2 text-brand-800"><Phone className="h-4 w-4" /> Ara</a>}
              {contact.whatsapp && <a href={whatsappLink(contact.whatsapp, "Merhaba, bilgi almak istiyorum.")} className="inline-flex items-center gap-2 text-brand-800"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
