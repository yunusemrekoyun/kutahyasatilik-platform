"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Building2,
  ChevronDown,
  Heart,
  Mail,
  Map,
  Menu,
  MessageCircle,
  Phone,
  Star,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { useSiteContact } from "@/components/SiteContactProvider";
import { useStore } from "@/components/store/StoreProvider";
import NotificationBell from "@/components/NotificationBell";
import { SITE, telLink, whatsappLink } from "@/lib/site";

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
  { href: "/emlak-ofisleri", label: "Emlak Ağı", Icon: Building2 },
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
  const listingButtonRef = useRef<HTMLButtonElement>(null);
  const listingMenuRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/user/me")
      .then((response) => response.json())
      .then((data) => { if (active && data?.user) setAccount({ name: data.user.name }); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    firstMobileLinkRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileOpen(false);
      mobileButtonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    if (!listingMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setListingMenuOpen(false);
      listingButtonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [listingMenuOpen]);

  if (pathname?.startsWith("/admin")) return null;

  const favoriteCount = hydrated ? favorites.length : 0;
  const firstName = account?.name.trim().split(" ")[0] || "Hesabım";
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname?.startsWith(`${href}/`));
  const listingActive = PROPERTY_LINKS.some((item) => isActive(item.href));

  return (
    <header className="sticky top-0 z-40">
      <div className="hidden bg-brand-950 text-brand-100 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <div className="flex items-center gap-2">
            <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current text-gold-300" />
            <span className="text-brand-200">{SITE.brand}</span>
            <span aria-hidden="true" className="mx-1 h-3 w-px bg-white/15" />
            <span className="text-brand-300">Kütahya&apos;da yerel gayrimenkul rehberi</span>
          </div>
          <div className="flex items-center gap-4">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="inline-flex min-h-11 items-center gap-1.5 text-brand-200 hover:text-white">
                <Mail aria-hidden="true" className="h-3.5 w-3.5" /> {contact.email}
              </a>
            )}
            {contact.phoneRaw && (
              <a href={telLink(contact.phoneRaw)} className="inline-flex min-h-11 items-center gap-1.5 text-brand-200 hover:text-white">
                <Phone aria-hidden="true" className="h-3.5 w-3.5" /> {contact.phone}
              </a>
            )}
            {contact.whatsapp && (
              <a href={whatsappLink(contact.whatsapp, "Merhaba, gayrimenkul hakkında bilgi almak istiyorum.")} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-brand-200 hover:text-white">
                <MessageCircle aria-hidden="true" className="h-3.5 w-3.5" /> WhatsApp
              </a>
            )}
            <Link href="/emlakci/kayit" className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/10 px-3 font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/20">
              <UserPlus aria-hidden="true" className="h-3.5 w-3.5" /> Danışman Başvurusu
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6">
        <Link href="/" className="shrink-0 leading-none" aria-label="Kütahya Satılık ana sayfa">
          <span className="block font-display text-xl font-bold tracking-tight text-brand-900">
            Kütahya<span className="text-gold-700">Satılık</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Ana menü">
          <div
            className="relative"
            onMouseEnter={() => setListingMenuOpen(true)}
            onMouseLeave={() => setListingMenuOpen(false)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setListingMenuOpen(false);
            }}
          >
            <button
              ref={listingButtonRef}
              type="button"
              onClick={() => setListingMenuOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowDown") return;
                event.preventDefault();
                setListingMenuOpen(true);
                requestAnimationFrame(() => listingMenuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus());
              }}
              aria-controls="listing-navigation"
              aria-expanded={listingMenuOpen}
              className={`inline-flex min-h-11 items-center gap-1 rounded-lg px-3 py-2 text-sm transition ${listingActive ? "bg-brand-50 font-semibold text-brand-800" : "font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-700"}`}
            >
              İlanlar <ChevronDown aria-hidden="true" className={`h-4 w-4 transition ${listingMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {listingMenuOpen && (
              <div id="listing-navigation" ref={listingMenuRef} className="absolute left-0 top-full pt-2">
                <div className="w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-brand-950/5">
                  {PROPERTY_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setListingMenuOpen(false)}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={`flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm transition ${isActive(item.href) ? "bg-brand-50 font-semibold text-brand-800" : "text-slate-700 hover:bg-slate-50 hover:text-brand-700"}`}
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
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm transition ${isActive(item.href) ? "bg-brand-50 font-semibold text-brand-800" : "font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-700"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link href="/favoriler" aria-label={favoriteCount > 0 ? `Favoriler, ${favoriteCount} kayıtlı ilan` : "Favoriler"} className="relative grid h-11 w-11 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-brand-900">
            <Heart aria-hidden="true" className="h-5 w-5" />
            {favoriteCount > 0 && <span aria-hidden="true" className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-gold-600 px-1 text-center text-[9px] font-bold text-white">{favoriteCount}</span>}
          </Link>
          {account && <NotificationBell />}
          <Link href={account ? "/hesabim" : "/giris"} aria-current={isActive(account ? "/hesabim" : "/giris") ? "page" : undefined} className="hidden min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-brand-900 sm:inline-flex">
            <User aria-hidden="true" className="h-4 w-4" /> {account ? firstName : "Giriş"}
          </Link>
          <Link href="/satici" className="ml-1 hidden min-h-11 items-center rounded-[10px] bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 sm:inline-flex">
            Mülkünü Sat
          </Link>
          <button
            ref={mobileButtonRef}
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="grid h-11 w-11 place-items-center rounded-md border border-slate-300 text-brand-900 lg:hidden"
            aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-controls="mobile-navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="mobile-navigation" aria-label="Mobil menü" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-slate-200 bg-white px-4 pb-8 pt-4 lg:hidden">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {PROPERTY_LINKS.map((item, index) => (
              <Link ref={index === 0 ? firstMobileLinkRef : undefined} key={item.href} href={item.href} onClick={() => setMobileOpen(false)} aria-current={isActive(item.href) ? "page" : undefined} className="flex min-h-11 items-center border-b border-slate-100 py-3 text-sm font-medium text-slate-700 hover:text-brand-700">{item.label}</Link>
            ))}
          </div>
          <div className="mt-5 grid gap-1">
            {PRIMARY_LINKS.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} aria-current={isActive(item.href) ? "page" : undefined} className="flex min-h-11 items-center gap-3 border-b border-slate-100 py-3 text-sm font-medium text-slate-700 hover:text-brand-700">
                {item.Icon ? <item.Icon aria-hidden="true" className="h-4 w-4 text-brand-600" /> : null}{item.label}
              </Link>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link href={account ? "/hesabim" : "/giris"} onClick={() => setMobileOpen(false)} className="flex min-h-11 items-center justify-center rounded-[10px] border border-brand-200 text-sm font-semibold text-brand-800">
              {account ? firstName : "Giriş Yap"}
            </Link>
            <Link href="/satici" onClick={() => setMobileOpen(false)} className="flex min-h-11 items-center justify-center rounded-lg bg-brand-700 text-sm font-semibold text-white">Mülkünü Sat</Link>
          </div>
          {(contact.phoneRaw || contact.whatsapp) && (
            <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-100 pt-5 text-sm font-semibold">
              {contact.phoneRaw && <a href={telLink(contact.phoneRaw)} className="inline-flex min-h-11 items-center gap-2 text-brand-800"><Phone aria-hidden="true" className="h-4 w-4" /> Ara</a>}
              {contact.whatsapp && <a href={whatsappLink(contact.whatsapp, "Merhaba, bilgi almak istiyorum.")} className="inline-flex min-h-11 items-center gap-2 text-brand-800"><MessageCircle aria-hidden="true" className="h-4 w-4" /> WhatsApp</a>}
            </div>
          )}
        </nav>
      )}
      </div>
    </header>
  );
}
