"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Panel", icon: "📊", exact: true },
  { href: "/admin/ilanlar", label: "İlanlar", icon: "🏠" },
  { href: "/admin/ilanlar/yeni", label: "Yeni İlan", icon: "➕" },
  { href: "/admin/onay", label: "Onay Bekleyen", icon: "✅" },
  { href: "/admin/emlakcilar", label: "Emlakçılar", icon: "🤝" },
  { href: "/admin/talepler", label: "Talepler", icon: "📬" },
  { href: "/admin/alici-talepleri", label: "Alıcı Talepleri", icon: "🔔" },
  { href: "/admin/blog", label: "Blog", icon: "📝" },
  { href: "/admin/sayfalar", label: "Sayfalar", icon: "📄" },
  { href: "/admin/yorumlar", label: "Müşteri Yorumları", icon: "💬" },
  { href: "/admin/reklamlar", label: "Pop-up Reklamlar", icon: "📣" },
  { href: "/admin/ana-sayfa", label: "Ana Sayfa Metinleri", icon: "🏠" },
  { href: "/admin/ayarlar", label: "Ayarlar", icon: "⚙️" },
];

export default function AdminNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className={mobile ? "flex gap-1 overflow-x-auto no-scrollbar" : "flex flex-col gap-1 p-3"}>
      {ITEMS.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition ${
            isActive(it.href, it.exact)
              ? "bg-brand-700 text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <span>{it.icon}</span>
          {it.label}
        </Link>
      ))}
      <button
        onClick={logout}
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 whitespace-nowrap ${
          mobile ? "" : "mt-2"
        }`}
      >
        <span>🚪</span> Çıkış
      </button>
    </nav>
  );
}
