"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Heart,
  Menu,
  MessageCircle,
  Phone,
  User,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CATEGORY_LIST } from "@/lib/categories";
import { LANDING_PAGES } from "@/lib/constants";
import { useSiteContact } from "@/components/SiteContactProvider";
import { useStore } from "@/components/store/StoreProvider";
import NotificationBell from "@/components/NotificationBell";
import { telLink, whatsappLink } from "@/lib/site";

/**
 * İlanlar açılır menüsü — KATEGORİYE GÖRE GRUPLU.
 *
 * Eskiden emlak alt türleri (Daire, Arsa...) ile Vasıta ve Teknoloji aynı düz
 * listedeydi; menü "emlak sitesi + iki ek sekme" gibi okunuyordu.
 *
 * Emlağa özel ARAÇLAR (harita, bölge analizi, emlak ofisleri) da buraya, emlak
 * grubunun içine alındı. Üst menüde dururlarken bir vasıta ilanına bakan
 * kullanıcı başlıkta "Emlak Ağı" görüyordu. Bağlamı sorgu parametresinden
 * okumak Header'ı useSearchParams'a bağlardı ve o da sitenin tamamının
 * ön-render'ını bozuyor (build "useSearchParams should be wrapped in a suspense
 * boundary" ile düşüyor). Araçları emlak grubunun içine koymak hem bu sorunu
 * yaşatmıyor hem de aradıkları yerde duruyorlar.
 */

/** Alt türün SEO iniş sayfası varsa güzel URL, yoksa filtreli liste bağlantısı. */
const LANDING_BY_PROPERTY_TYPE = new Map(LANDING_PAGES.map((p) => [p.propertyType, p.slug]));

/**
 * Menü etiketi kayıttan gelir. TEK İSTİSNA burada:
 * `tarla` alt türünün iniş sayfası bilerek "Yatırımlık Arsa" adıyla yayında
 * (arama hacmi "tarla"dan yüksek). Menü bağlantısı o sayfaya gittiği için
 * etiketinin de sayfayla aynı olması gerekiyor.
 */
const MENU_LABEL_OVERRIDES: Record<string, string> = { tarla: "Yatırımlık Arsa" };

/** Emlağa özel araçlar — alt tür değiller, grubun sonuna eklenirler. */
const ESTATE_TOOLS = [
  { href: "/harita", label: "Haritada ara" },
  { href: "/bolge-analizi", label: "Bölge analizi" },
  { href: "/emlak-ofisleri", label: "Emlak ofisleri" },
  { href: "/danismanlar", label: "Danışmanlar" },
];

const LISTING_MENU: { title: string; href: string; items: { href: string; label: string }[] }[] =
  CATEGORY_LIST.map((category) => ({
    title: category.label,
    href: `/ilanlar?kategori=${category.key}`,
    items: [
      ...category.subTypes.map((sub) => {
        const landing = LANDING_BY_PROPERTY_TYPE.get(sub.value);
        return {
          href: landing
            ? `/${landing}`
            : `/ilanlar?kategori=${category.key}&tur=${sub.value}`,
          label: MENU_LABEL_OVERRIDES[sub.value] ?? sub.label,
        };
      }),
      ...(category.key === "emlak" ? ESTATE_TOOLS : []),
    ],
  }));

/** Aktiflik kontrolü için düz liste. */
const PROPERTY_LINKS = LISTING_MENU.flatMap((group) => group.items);

/**
 * Üst menü BAĞLAMA DUYARLI.
 *
 * Harita, Bölge Analizi ve Emlak Ağı yalnız emlağa ait araçlar: harita
 * kapsamı emlak, bölge analizi m² fiyatı üzerine kurulu, emlak ofisleri zaten
 * adında. Vasıta ya da teknoloji ilanlarına bakan kullanıcı bunları menüde
 * görünce site "sonradan vasıta eklenmiş bir emlak sitesi" gibi okunuyordu.
 *
 * Kural: emlak bağlamındayken (emlak kategorisi, emlak alt tür sayfaları,
 * emlak araçları) görünürler; diğer kategorilerde gizlenirler. Ana sayfada ve
 * bağlamsız yerlerde görünmeye devam ederler — site emlak ağırlıklı.
 */
/** Üst menü artık KATEGORİ-NÖTR: emlağa özel araçlar açılır menüdeki Emlak grubunda. */
const PRIMARY_LINKS: { href: string; label: string; Icon?: LucideIcon }[] = [
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
    <header className="sticky top-0 z-40 border-b border-stone bg-paper/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-5 px-4 sm:px-6">
        <Link href="/" className="shrink-0 leading-none" aria-label="Kütahya Satılık ana sayfa">
          <span className="block text-[22px] font-bold tracking-[-0.02em] text-brand-950">
            Kütahya<span className="text-gold-700">Satılık</span>
          </span>
          <span className="mt-1 hidden text-[9px] font-bold uppercase tracking-[0.2em] text-muted sm:block">
            Kütahya&apos;nın yerel ilan platformu
          </span>
        </Link>

        <nav className="hidden h-full items-center gap-4 xl:gap-7 lg:flex" aria-label="Ana menü">
          <div
            className="relative flex h-full items-center"
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
              className={`inline-flex h-full items-center gap-1 border-b-2 text-sm font-semibold transition ${listingActive ? "border-gold-700 text-brand-950" : "border-transparent text-muted hover:text-brand-950"}`}
            >
              İlanlar <ChevronDown aria-hidden="true" className={`h-4 w-4 transition ${listingMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {listingMenuOpen && (
              <div id="listing-navigation" ref={listingMenuRef} className="absolute left-0 top-full pt-3">
                <div className="grid w-[620px] grid-cols-3 gap-5 border border-stone bg-paper p-5 shadow-prestige">
                  {LISTING_MENU.map((group) => (
                    <div key={group.title}>
                      <Link
                        href={group.href}
                        onClick={() => setListingMenuOpen(false)}
                        className="mb-2 flex min-h-11 items-center text-sm font-bold text-brand-900 hover:text-brand-700"
                      >
                        {group.title}
                      </Link>
                      <div className="flex flex-col">
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setListingMenuOpen(false)}
                            aria-current={isActive(item.href) ? "page" : undefined}
                            className={`flex min-h-10 items-center rounded-control px-2 text-sm transition ${isActive(item.href) ? "bg-brand-50 font-semibold text-brand-800" : "text-muted hover:bg-canvas hover:text-ink"}`}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
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
              className={`flex h-full items-center border-b-2 text-sm font-semibold transition ${isActive(item.href) ? "border-gold-700 text-brand-950" : "border-transparent text-muted hover:text-brand-950"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link href="/favoriler" aria-label={favoriteCount > 0 ? `Favoriler, ${favoriteCount} kayıtlı ilan` : "Favoriler"} className="relative grid h-11 w-11 place-items-center rounded-control text-muted hover:bg-canvas hover:text-brand-900">
            <Heart aria-hidden="true" className="h-5 w-5" />
            {favoriteCount > 0 && <span aria-hidden="true" className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-gold-600 px-1 text-center text-[9px] font-bold text-white">{favoriteCount}</span>}
          </Link>
          {account && <NotificationBell />}
          <Link href={account ? "/hesabim" : "/giris"} aria-current={isActive(account ? "/hesabim" : "/giris") ? "page" : undefined} className="hidden h-11 items-center gap-2 px-2 text-sm font-semibold text-ink hover:text-brand-900 sm:inline-flex">
            <User aria-hidden="true" className="h-4 w-4" /> {account ? firstName : "Giriş"}
          </Link>
          <Link href="/ilan-ver" className="ml-1 hidden rounded-control bg-gold-500 px-4 py-3 text-sm font-bold text-brand-950 transition hover:bg-gold-400 sm:inline-flex">
            İlan Ver
          </Link>
          <button
            ref={mobileButtonRef}
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="grid h-11 w-11 place-items-center rounded-control border border-stone text-brand-900 lg:hidden"
            aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-controls="mobile-navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="mobile-navigation" aria-label="Mobil menü" className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-stone bg-paper px-5 pb-8 pt-5 lg:hidden">
          {/* Mobilde de kategoriye göre gruplu: 16 bağlantılık düz liste
              kullanıcıyı hangi kategoride olduğunu anlamadan geziniyordu. */}
          {LISTING_MENU.map((group, groupIndex) => (
            <div key={group.title} className={groupIndex ? "mt-5" : ""}>
              <Link
                href={group.href}
                onClick={() => setMobileOpen(false)}
                className="flex min-h-11 items-center text-sm font-bold text-brand-900"
              >
                {group.title}
              </Link>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {group.items.map((item, index) => (
                  <Link
                    ref={groupIndex === 0 && index === 0 ? firstMobileLinkRef : undefined}
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="flex min-h-11 items-center border-b border-stone py-3 text-sm text-ink"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-5 grid gap-1">
            {PRIMARY_LINKS.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} aria-current={isActive(item.href) ? "page" : undefined} className="flex min-h-11 items-center gap-3 border-b border-stone py-3 text-sm font-semibold text-ink">
                {item.Icon ? <item.Icon aria-hidden="true" className="h-4 w-4 text-brand-600" /> : null}{item.label}
              </Link>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link href={account ? "/hesabim" : "/giris"} onClick={() => setMobileOpen(false)} className="flex min-h-11 items-center justify-center rounded-control border border-brand-200 text-sm font-semibold text-brand-800">
              {account ? firstName : "Giriş Yap"}
            </Link>
            <Link href="/ilan-ver" onClick={() => setMobileOpen(false)} className="flex min-h-11 items-center justify-center rounded-control bg-gold-500 text-sm font-bold text-brand-950">İlan Ver</Link>
            <Link href="/satici" onClick={() => setMobileOpen(false)} className="flex min-h-11 items-center justify-center rounded-control border border-brand-200 text-sm font-semibold text-brand-800">Mülkünü Sat (Emlak)</Link>
          </div>
          {(contact.phoneRaw || contact.whatsapp) && (
            <div className="mt-6 flex flex-wrap gap-4 border-t border-stone pt-5 text-sm font-semibold">
              {contact.phoneRaw && <a href={telLink(contact.phoneRaw)} className="inline-flex min-h-11 items-center gap-2 text-brand-800"><Phone aria-hidden="true" className="h-4 w-4" /> Ara</a>}
              {contact.whatsapp && <a href={whatsappLink(contact.whatsapp, "Merhaba, bilgi almak istiyorum.")} className="inline-flex min-h-11 items-center gap-2 text-brand-800"><MessageCircle aria-hidden="true" className="h-4 w-4" /> WhatsApp</a>}
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
