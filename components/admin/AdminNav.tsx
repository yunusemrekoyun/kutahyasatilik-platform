"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, PlusCircle, Newspaper, FileText,
  ClipboardCheck, Inbox, BellRing, Users, MessageSquare, Megaphone,
  Home, Settings, LogOut, Package as PackageIcon, Wallet, UserPlus, Gavel, HandCoins, MapPin, type LucideIcon,
} from "lucide-react";

export type AdminCounts = {
  pendingListings: number;
  newLeads: number;
  newAlerts: number;
};

type Item = { href: string; label: string; Icon: LucideIcon; exact?: boolean; badge?: keyof AdminCounts };
type Group = { label: string | null; items: Item[] };

const GROUPS: Group[] = [
  { label: null, items: [{ href: "/admin", label: "Panel", Icon: LayoutDashboard, exact: true }] },
  {
    label: "İçerik",
    items: [
      { href: "/admin/ilanlar", label: "İlanlar", Icon: Building2 },
      { href: "/admin/ilanlar/yeni", label: "Yeni İlan", Icon: PlusCircle },
      { href: "/admin/blog", label: "Blog", Icon: Newspaper },
      { href: "/admin/sayfalar", label: "Sayfalar", Icon: FileText },
    ],
  },
  {
    label: "Talepler & Kişiler",
    items: [
      { href: "/admin/onay", label: "Onay Bekleyen", Icon: ClipboardCheck, badge: "pendingListings" },
      { href: "/admin/talepler", label: "Talepler", Icon: Inbox, badge: "newLeads" },
      { href: "/admin/alici-talepleri", label: "Alıcı Talepleri", Icon: BellRing, badge: "newAlerts" },
      { href: "/admin/firsatlar", label: "Portföy Fırsatları", Icon: Gavel },
      { href: "/admin/basvurular", label: "Başvurular", Icon: UserPlus },
      { href: "/admin/emlakcilar", label: "Emlakçılar", Icon: Users },
      { href: "/admin/paket", label: "Paket", Icon: PackageIcon },
      { href: "/admin/tahsilat", label: "Tahsilat", Icon: Wallet },
    ],
  },
  {
    label: "Site",
    items: [
      { href: "/admin/yorumlar", label: "Müşteri Yorumları", Icon: MessageSquare },
      { href: "/admin/reklamlar", label: "Pop-up Reklamlar", Icon: Megaphone },
      { href: "/admin/reklam-talepleri", label: "Reklam Talepleri", Icon: HandCoins },
      { href: "/admin/ilceler", label: "İlçe Verisi", Icon: MapPin },
      { href: "/admin/ana-sayfa", label: "Ana Sayfa Metinleri", Icon: Home },
    ],
  },
  { label: "Ayarlar", items: [{ href: "/admin/ayarlar", label: "Ayarlar", Icon: Settings }] },
];

export default function AdminNav({
  counts,
  collapsed = false,
  onNavigate,
}: {
  counts: AdminCounts;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/giris");
    router.refresh();
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      {GROUPS.map((group, gi) => (
        <div key={gi}>
          {group.label && !collapsed && (
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</p>
          )}
          {group.label && collapsed && gi > 0 && <div className="mx-3 mb-2 border-t border-slate-100" />}
          <div className="flex flex-col gap-0.5">
            {group.items.map((it) => {
              const active = isActive(it.href, it.exact);
              const count = it.badge ? counts[it.badge] : 0;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={onNavigate}
                  title={collapsed ? it.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center rounded-lg text-sm font-medium transition ${
                    collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                  } ${active ? "bg-brand-700 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                >
                  {active && !collapsed && (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gold-400" />
                  )}
                  <span className="relative shrink-0">
                    <it.Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.3 : 2} />
                    {count > 0 && collapsed && (
                      <span className="absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </span>
                  {!collapsed && <span className="flex-1 truncate">{it.label}</span>}
                  {!collapsed && count > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${active ? "bg-white/20 text-white" : "bg-red-100 text-red-700"}`}>
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={logout}
        title={collapsed ? "Çıkış" : undefined}
        className={`mt-auto flex items-center rounded-lg text-sm font-medium text-red-600 transition hover:bg-red-50 ${
          collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
        }`}
      >
        <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
        {!collapsed && "Çıkış"}
      </button>
    </nav>
  );
}
