import Link from "next/link";
import { getSession } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Oturum yoksa (login sayfası) sade göster — middleware diğer yolları zaten korur.
  if (!session) {
    return <div className="min-h-screen bg-slate-100">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-[1400px]">
        {/* Sidebar */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white min-h-screen sticky top-0">
          <div className="p-5 border-b border-slate-100">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-700 text-white font-black">K</span>
              <div>
                <p className="font-extrabold text-slate-900 leading-tight">Yönetim</p>
                <p className="text-[11px] text-slate-500">Kütahya Satılık</p>
              </div>
            </Link>
          </div>
          <AdminNav />
          <div className="mt-auto p-4 border-t border-slate-100">
            <p className="truncate text-xs text-slate-500">{session.email}</p>
            <Link href="/" className="mt-1 block text-xs text-brand-700 hover:underline">← Siteye dön</Link>
          </div>
        </aside>

        {/* İçerik */}
        <main className="flex-1 min-w-0">
          <div className="md:hidden border-b border-slate-200 bg-white p-4">
            <AdminNav mobile />
          </div>
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
