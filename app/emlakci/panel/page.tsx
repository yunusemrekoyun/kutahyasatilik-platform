import Link from "next/link";
import Image from "next/image";
import { Mail, Eye, Heart } from "lucide-react";
import { getAgentSession } from "@/lib/agentAuth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { PROPERTY_TYPE_LABELS, MODERATION_STATUS_LABELS } from "@/lib/constants";
import { deleteAgentListing, updateAgentProfile } from "./actions";
import AgentLogoUpload from "@/components/agent/AgentLogoUpload";

export const dynamic = "force-dynamic";

const modBadge: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default async function AgentDashboard() {
  const session = await getAgentSession();
  const agent = await prisma.agent.findUnique({ where: { id: session!.agentId } });
  if (!agent) return null;

  const listings = await prisma.listing.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "desc" },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, _count: { select: { leads: true, favorites: true } } },
  });

  const counts = {
    total: listings.length,
    pending: listings.filter((l) => l.moderationStatus === "pending").length,
    approved: listings.filter((l) => l.moderationStatus === "approved").length,
    rejected: listings.filter((l) => l.moderationStatus === "rejected").length,
  };
  // İlan bazlı etkileşim toplamları
  const engagement = {
    views: listings.reduce((s, l) => s + l.viewCount, 0),
    favorites: listings.reduce((s, l) => s + l._count.favorites, 0),
    leads: listings.reduce((s, l) => s + l._count.leads, 0),
  };

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none";

  return (
    <div className="space-y-8">
      {/* Üst başlık */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Hoş geldiniz, {agent.name}
          </h1>
          <p className="text-sm text-slate-500">
            {agent.title || "Gayrimenkul Danışmanı"}
            {agent.agency ? ` · ${agent.agency}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/emlakci/panel/mesajlar"
            className="rounded-lg bg-paper px-4 py-2.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"
          >
            Mesajlar
          </Link>
          <Link
            href="/emlakci/panel/talepler"
            className="rounded-lg bg-paper px-4 py-2.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"
          >
            Gelen Talepler
          </Link>
          <Link
            href="/emlakci/panel/firsatlar"
            className="rounded-lg bg-paper px-4 py-2.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"
          >
            Portföy Fırsatları
          </Link>
          <Link
            href="/emlakci/panel/ilan/yeni"
            className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-800"
          >
            + Yeni İlan Ekle
          </Link>
        </div>
      </div>

      {/* İstatistik */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Toplam İlan", v: counts.total, c: "text-slate-900" },
          { l: "Yayında", v: counts.approved, c: "text-green-600" },
          { l: "Onay Bekleyen", v: counts.pending, c: "text-amber-600" },
          { l: "Reddedilen", v: counts.rejected, c: "text-red-600" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg bg-paper p-4 text-center ring-1 ring-stone">
            <p className={`text-3xl font-black ${s.c}`}>{s.v}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Etkileşim (tüm ilanların toplamı) */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "Görüntülenme", v: engagement.views, Icon: Eye, c: "text-brand-700" },
          { l: "Favori", v: engagement.favorites, Icon: Heart, c: "text-rose-600" },
          { l: "Talep", v: engagement.leads, Icon: Mail, c: "text-green-600" },
        ].map((s) => (
          <div key={s.l} className="flex items-center gap-3 rounded-lg bg-paper p-4 ring-1 ring-stone">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-canvas ${s.c}`}><s.Icon className="h-5 w-5" /></span>
            <div>
              <p className={`text-2xl font-black leading-none ${s.c}`}>{s.v}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{s.l}</p>
            </div>
          </div>
        ))}
      </div>

      {/* İlan listesi */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">İlanlarım</h2>
        <div className="mt-3 overflow-hidden rounded-lg bg-paper ring-1 ring-stone">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone bg-canvas text-left text-xs text-slate-500">
                  <th className="p-3">İlan</th>
                  <th className="p-3">Tür</th>
                  <th className="p-3">Fiyat</th>
                  <th className="p-3">Onay Durumu</th>
                  <th className="p-3 text-center" title="Görüntülenme"><Eye className="inline-block h-4 w-4 text-slate-500" /></th>
                  <th className="p-3 text-center" title="Favori"><Heart className="inline-block h-4 w-4 text-slate-500" /></th>
                  <th className="p-3 text-center" title="Talep"><Mail className="inline-block h-4 w-4 text-slate-500" /></th>
                  <th className="p-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {listings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Henüz ilanınız yok. &quot;Yeni İlan Ekle&quot; ile başlayın.
                    </td>
                  </tr>
                )}
                {listings.map((l) => (
                  <tr key={l.id} className="border-b border-slate-50 hover:bg-canvas">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                          {l.images[0] && (
                            <Image src={l.images[0].url} alt={l.title} fill sizes="64px" className="object-cover" />
                          )}
                        </div>
                        <span className="line-clamp-2 max-w-[220px] font-medium text-slate-800">{l.title}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">{PROPERTY_TYPE_LABELS[l.propertyType] || l.propertyType}</td>
                    <td className="p-3 whitespace-nowrap font-semibold text-slate-800">{formatPrice(l.price, l.currency)}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${modBadge[l.moderationStatus]}`}>
                        {MODERATION_STATUS_LABELS[l.moderationStatus]}
                      </span>
                      {l.status === "sold" && <span className="ml-1 text-xs text-red-600">Satıldı</span>}
                      {l.moderationStatus === "rejected" && l.note && (
                        <p className="mt-1 max-w-[200px] text-[11px] text-red-500">Sebep: {l.note}</p>
                      )}
                    </td>
                    <td className="p-3 text-center tabular-nums text-slate-600">{l.viewCount}</td>
                    <td className="p-3 text-center tabular-nums text-slate-600">{l._count.favorites}</td>
                    <td className="p-3 text-center tabular-nums text-slate-600">{l._count.leads}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        {l.moderationStatus === "approved" && (
                          <Link href={`/ilan/${l.slug}`} target="_blank" className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100">Gör</Link>
                        )}
                        <Link href={`/emlakci/panel/ilan/${l.id}`} className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">Düzenle</Link>
                        <form action={deleteAgentListing}>
                          <input type="hidden" name="id" value={l.id} />
                          <button className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50">Sil</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Profil */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Danışman Profilim</h2>
        <p className="text-sm text-slate-500">İlanlarınızda görünen isim ve unvan bilgileri.</p>
        <form action={updateAgentProfile} className="mt-3 rounded-lg bg-paper p-6 ring-1 ring-stone">
          <div className="mb-5">
            <span className="mb-2 block text-sm font-medium text-slate-700">Logo / Avatar</span>
            <AgentLogoUpload initialLogo={agent.logo} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Ad Soyad</span>
              <input name="name" defaultValue={agent.name} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Telefon</span>
              <input name="phone" defaultValue={agent.phone ?? ""} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Unvan</span>
              <input name="title" defaultValue={agent.title ?? ""} placeholder="Gayrimenkul Danışmanı" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Ofis / Marka</span>
              <input name="agency" defaultValue={agent.agency ?? ""} className={inputCls} />
            </label>
          </div>
          <button className="mt-4 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-900">
            Profili Kaydet
          </button>
        </form>
      </div>
    </div>
  );
}
