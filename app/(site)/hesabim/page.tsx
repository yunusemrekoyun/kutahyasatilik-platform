import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, Mail, User as UserIcon, MessageSquare } from "lucide-react";
import { getUserSession } from "@/lib/userAuth";
import { prisma } from "@/lib/prisma";
import { LEAD_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import LogoutButton from "@/components/user/LogoutButton";
import SavedSearches from "@/components/user/SavedSearches";
import ProfileForm from "@/components/user/ProfileForm";
import ChangePasswordForm from "@/components/user/ChangePasswordForm";
import RequestStatusStepper from "@/components/RequestStatusStepper";

export const metadata: Metadata = {
  title: "Hesabım",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getUserSession();
  if (!session) redirect("/giris?next=/hesabim");

  const [user, leads] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true, phone: true, createdAt: true },
    }),
    prisma.lead.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      include: { listing: { select: { slug: true, title: true } } },
    }),
  ]);

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

      {/* Taleplerim — süreç takibi */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-slate-900">Taleplerim</h2>
        <p className="text-sm text-slate-500">Bıraktığınız taleplerin süreç durumunu buradan izleyebilirsiniz.</p>
        {leads.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-white p-6 text-center text-sm text-slate-400 ring-1 ring-slate-200">
            Henüz talebiniz yok. Bir ilanda &quot;Randevu / Bilgi Al&quot; ya da &quot;Mülkünü Sat&quot; ile talep bırakabilirsiniz.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {leads.map((l) => (
              <div key={l.id} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{LEAD_TYPE_LABELS[l.type] || "Talep"}</p>
                    {l.listing ? (
                      <Link href={`/ilan/${l.listing.slug}`} className="text-sm text-brand-700 hover:underline">{l.listing.title}</Link>
                    ) : l.district ? (
                      <p className="text-sm text-slate-500">{l.district}{l.propertyType ? ` · ${PROPERTY_TYPE_LABELS[l.propertyType] || l.propertyType}` : ""}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{formatDate(l.createdAt)}</span>
                </div>
                {l.message && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{l.message}</p>}
                {l.preferredDate && (
                  <p className="mt-1 text-sm text-slate-500">Tercih edilen tarih: {l.preferredDate}</p>
                )}
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <RequestStatusStepper status={l.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profil bilgileri — ad/telefon düzenlenebilir; e-posta değiştirilemez */}
      <div className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="font-bold text-slate-900">Profil Bilgileri</h2>
        <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-500">
          <Mail className="h-4 w-4 text-slate-400" /> {user?.email ?? session.email}
          <span className="text-slate-300">·</span> e-posta değiştirilemez
        </p>
        <div className="mt-4">
          <ProfileForm defaultName={name} defaultPhone={user?.phone ?? ""} />
        </div>
      </div>

      {/* Şifre değiştir */}
      <div className="mt-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="font-bold text-slate-900">Şifre Değiştir</h2>
        <p className="mt-1 text-sm text-slate-500">Güvenliğiniz için düzenli olarak güçlü bir şifre belirleyin.</p>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </div>

      <Link href="/hesabim/mesajlar" className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-5 ring-1 ring-slate-200 transition hover:ring-brand-300">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700"><MessageSquare className="h-5 w-5" /></span>
        <div>
          <p className="font-semibold text-slate-900">Mesajlarım</p>
          <p className="text-xs text-slate-500">Danışmanlarla yazışmalar ve teklifler</p>
        </div>
      </Link>

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
