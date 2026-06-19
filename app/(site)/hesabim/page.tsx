import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, Mail, Phone, User as UserIcon } from "lucide-react";
import { getUserSession } from "@/lib/userAuth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/user/LogoutButton";
import SavedSearches from "@/components/user/SavedSearches";

export const metadata: Metadata = {
  title: "Hesabım",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getUserSession();
  if (!session) redirect("/giris?next=/hesabim");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, phone: true, createdAt: true },
  });

  const name = user?.name ?? session.name;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-700 text-white">
          <UserIcon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Merhaba, {name}</h1>
          <p className="text-sm text-slate-500">Hesap bilgileriniz ve hızlı erişim.</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="font-bold text-slate-900">Hesap Bilgileri</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <Mail className="h-4 w-4 text-slate-400" /> {user?.email ?? session.email}
          </div>
          {user?.phone && (
            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="h-4 w-4 text-slate-400" /> {user.phone}
            </div>
          )}
        </dl>
      </div>

      <Link href="/favoriler" className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-5 ring-1 ring-slate-200 transition hover:ring-brand-300">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-rose-50 text-rose-600"><Heart className="h-5 w-5" /></span>
        <div>
          <p className="font-semibold text-slate-900">Favorilerim</p>
          <p className="text-xs text-slate-500">Beğendiğiniz ilanlar</p>
        </div>
      </Link>

      <div className="mt-4">
        <SavedSearches />
      </div>

      <div className="mt-8">
        <LogoutButton />
      </div>
    </div>
  );
}
