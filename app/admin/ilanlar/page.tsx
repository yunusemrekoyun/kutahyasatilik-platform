import Link from "next/link";
import Image from "next/image";
import { PlusCircle, Search, Eye, Heart, Inbox, Star, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { PROPERTY_TYPE_LABELS, LISTING_STATUS_LABELS, MODERATION_STATUS_LABELS } from "@/lib/constants";
import { deleteListing } from "../actions";
import { PageHeader, StatusBadge, adminCard, adminBtnPrimary, adminInput } from "@/components/admin/ui";

const STATUS_TONE: Record<string, "success" | "danger" | "neutral"> = {
  active: "success",
  sold: "danger",
  passive: "neutral",
};

export const dynamic = "force-dynamic";

const PER_PAGE = 50;

export default async function AdminListings({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();
  const page = Math.max(1, Number(typeof sp.sayfa === "string" ? sp.sayfa : "1") || 1);

  const where = q
    ? {
        OR: [
          { title: { contains: q } },
          { district: { contains: q } },
          { slug: { contains: q } },
        ],
      }
    : {};

  // Sayfalama ZORUNLU: 50k+ ilanda sınırsız findMany sayfayı çökertir.
  const [total, listings] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, _count: { select: { leads: true, favorites: true } } },
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qPrefix = q ? `q=${encodeURIComponent(q)}&` : "";

  return (
    <div>
      <PageHeader title="İlanlar" description={`${total} ilan${q ? ` · "${q}" araması` : ""}`}>
        <form method="get" className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={q} placeholder="Başlık / ilçe / slug ara…" className={`${adminInput} w-full pl-9 sm:w-64`} />
        </form>
        <Link href="/admin/ilanlar/yeni" className={adminBtnPrimary}>
          <PlusCircle className="h-4 w-4" /> Yeni İlan
        </Link>
      </PageHeader>

      <div className={`overflow-hidden ${adminCard}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone bg-canvas text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="p-3">İlan</th>
                <th className="p-3">Tür</th>
                <th className="p-3">İlçe</th>
                <th className="p-3">Fiyat</th>
                <th className="p-3">Durum</th>
                <th className="p-3 text-center" title="Görüntülenme"><Eye className="mx-auto h-4 w-4" /></th>
                <th className="p-3 text-center" title="Favori"><Heart className="mx-auto h-4 w-4" /></th>
                <th className="p-3 text-center" title="Talep"><Inbox className="mx-auto h-4 w-4" /></th>
                <th className="p-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">İlan bulunamadı.</td></tr>
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
                  <td className="p-3 text-slate-600">{l.district}</td>
                  <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">{formatPrice(l.price, l.currency)}</td>
                  <td className="p-3">
                    <div className="flex flex-col items-start gap-1">
                      <span className="inline-flex items-center gap-1.5">
                        <StatusBadge tone={STATUS_TONE[l.status] || "neutral"}>{LISTING_STATUS_LABELS[l.status]}</StatusBadge>
                        {l.featured && <Star className="h-4 w-4 fill-gold-400 text-gold-400" />}
                      </span>
                      {/* Onay durumu: yalnız yayında DEĞİLse göster (onay bekleyen/reddedilen 'Aktif' sanılmasın) */}
                      {l.moderationStatus !== "approved" && (
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${l.moderationStatus === "rejected" ? "bg-red-50 text-red-700 ring-red-200" : "bg-amber-50 text-amber-700 ring-amber-200"}`}>
                          {MODERATION_STATUS_LABELS[l.moderationStatus] || l.moderationStatus}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center tabular-nums text-slate-600">{l.viewCount}</td>
                  <td className="p-3 text-center tabular-nums text-slate-600">{l._count.favorites}</td>
                  <td className="p-3 text-center tabular-nums text-slate-600">{l._count.leads}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/ilan/${l.slug}`} target="_blank" title="Görüntüle" className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"><ExternalLink className="h-4 w-4" /></Link>
                      <Link href={`/admin/ilanlar/${l.id}`} title="Düzenle" className="grid h-8 w-8 place-items-center rounded-md text-brand-700 hover:bg-brand-50"><Pencil className="h-4 w-4" /></Link>
                      <form action={deleteListing}>
                        <input type="hidden" name="id" value={l.id} />
                        <button title="Sil" className="grid h-8 w-8 place-items-center rounded-md text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">Sayfa {page} / {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/ilanlar?${qPrefix}sayfa=${page - 1}`} className="rounded-lg bg-paper px-3 py-1.5 font-medium text-slate-700 ring-1 ring-stone hover:ring-brand-300">‹ Önceki</Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/ilanlar?${qPrefix}sayfa=${page + 1}`} className="rounded-lg bg-paper px-3 py-1.5 font-medium text-slate-700 ring-1 ring-stone hover:ring-brand-300">Sonraki ›</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
