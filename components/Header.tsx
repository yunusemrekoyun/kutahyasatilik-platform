"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Mail, Phone, LogIn, UserPlus, Heart, MessageCircle, Menu, X } from "lucide-react";
import { SITE, telLink, whatsappLink } from "@/lib/site";
import { useStore } from "@/components/store/StoreProvider";

const NAV = [
  { href: "/ilanlar", label: "Tüm İlanlar" },
  { href: "/kutahya-satilik-daire", label: "Satılık Daire" },
  { href: "/kutahya-satilik-arsa", label: "Satılık Arsa" },
  { href: "/kutahya-satilik-villa", label: "Villa" },
  { href: "/kutahya-yatirimlik-arsa", label: "Yatırımlık" },
  { href: "/harita", label: "Harita" },
  { href: "/bolge-analizi", label: "Bölge Analizi" },
  { href: "/degerleme", label: "Değerleme" },
  { href: "/blog", label: "Blog" },
  { href: "/hakkimizda", label: "Kurumsal" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { favorites, hydrated } = useStore();
  const favCount = hydrated ? favorites.length : 0;

  if (pathname?.startsWith("/admin")) return null;

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-40">
      {/* Üst kurumsal bar */}
      <div className="hidden md:block bg-brand-950 text-brand-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <div className="flex items-center gap-5">
            <span className="text-gold-300">★ {SITE.brand}</span>
            <span className="text-brand-300">Hafta içi 09:00–19:00 · Cumartesi 10:00–17:00</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={`mailto:${SITE.email}`} className="inline-flex items-center gap-1.5 hover:text-white">
              <Mail className="h-3.5 w-3.5" /> {SITE.email}
            </a>
            <a href={telLink()} className="inline-flex items-center gap-1.5 hover:text-white">
              <Phone className="h-3.5 w-3.5" /> {SITE.phone}
            </a>
            <span className="h-3.5 w-px bg-white/20" />
            <Link href="/emlakci/giris" className="inline-flex items-center gap-1.5 hover:text-white">
              <LogIn className="h-3.5 w-3.5" /> Danışman Girişi
            </Link>
            <Link
              href="/emlakci/kayit"
              className="inline-flex items-center gap-1.5 rounded-full bg-gold-500 px-3 py-1 font-semibold text-brand-950 transition hover:bg-gold-400"
            >
              <UserPlus className="h-3.5 w-3.5" /> Danışman Başvurusu Yap
            </Link>
          </div>
        </div>
      </div>

      {/* Ana bar */}
      <div className="bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-brand-700 to-brand-900 text-gold-300 font-display font-bold text-lg shadow-sm">
                K
              </span>
              <span className="leading-tight">
                <span className="block font-display text-lg font-bold text-brand-900">
                  Kütahya<span className="text-gold-500">Satılık</span>
                </span>
                <span className="block text-[9px] uppercase tracking-[0.18em] text-slate-400">
                  Dijital Emlak Ofisi
                </span>
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-0.5">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                    isActive(n.href)
                      ? "text-brand-700 bg-brand-50"
                      : "text-slate-700 hover:text-brand-700 hover:bg-brand-50"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/favoriler"
                aria-label="Favoriler"
                className="relative grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <Heart className="h-5 w-5" />
                {favCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-gold-500 text-[10px] font-bold text-brand-950">
                    {favCount}
                  </span>
                )}
              </Link>
              <a
                href={whatsappLink("Merhaba, gayrimenkul hakkında bilgi almak istiyorum.")}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <Link
                href="/satici"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-gold-500 px-3.5 py-2 text-sm font-bold text-brand-950 hover:bg-gold-400 transition"
              >
                Mülkünü Sat
              </Link>

              <button
                onClick={() => setOpen((o) => !o)}
                className="lg:hidden grid h-10 w-10 place-items-center rounded-md border border-slate-300"
                aria-label="Menü"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3">
            <nav className="flex flex-col gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand-50 rounded-md"
                >
                  {n.label}
                </Link>
              ))}
              <Link href="/favoriler" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand-50 rounded-md">
                <Heart className="h-4 w-4" /> Favorilerim {favCount > 0 ? `(${favCount})` : ""}
              </Link>
              <Link href="/emlakci/giris" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50 rounded-md">
                <LogIn className="h-4 w-4" /> Danışman Girişi
              </Link>
              <Link href="/emlakci/kayit" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-brand-950 bg-gold-500 hover:bg-gold-400 rounded-md">
                <UserPlus className="h-4 w-4" /> Danışman Başvurusu Yap
              </Link>
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href={whatsappLink("Merhaba, bilgi almak istiyorum.")} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-green-600 px-3 py-2.5 text-center text-sm font-semibold text-white">
                WhatsApp
              </a>
              <a href={telLink()} className="rounded-lg bg-brand-700 px-3 py-2.5 text-center text-sm font-semibold text-white">
                Ara
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
