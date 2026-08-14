"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Map, Heart, User } from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";

const TABS = [
  { href: "/", label: "Ana Sayfa", icon: Home, exact: true },
  // Bina ikonu siteyi emlak sitesi gibi gösteriyordu; ızgara ikonu kategori-nötr.
  { href: "/ilanlar", label: "İlanlar", icon: LayoutGrid },
  { href: "/harita", label: "Harita", icon: Map },
  { href: "/favoriler", label: "Favoriler", icon: Heart, badge: true },
  // Hesap sağ altta (kullanıcı beklentisi). Girişsizse /hesabim → /giris'e yönlendirir,
  // giriş sonrası geri döner. İletişim: menüdeki "Bize Ulaşın" + footer.
  { href: "/hesabim", label: "Hesabım", icon: User },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const { favorites, hydrated } = useStore();
  const favCount = hydrated ? favorites.length : 0;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav aria-label="Mobil ana menü" className="fixed inset-x-0 bottom-0 z-40 border-t border-stone bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map((t) => {
          const active = isActive(t.href, t.exact);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-1 border-t-2 text-[10px] font-semibold transition ${
                active ? "border-gold-700 text-brand-800" : "border-transparent text-muted"
              }`}
            >
              <span className="relative">
                <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={active ? 2.4 : 1.9} />
                {t.badge && favCount > 0 && (
                  <span aria-hidden="true" className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold-500 px-1 text-[9px] font-bold text-brand-950">
                    {favCount}
                  </span>
                )}
              </span>
              {t.label}
              {t.badge && favCount > 0 && <span className="sr-only">{favCount} kayıtlı ilan</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
