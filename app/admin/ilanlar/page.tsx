import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { PROPERTY_TYPE_LABELS, LISTING_STATUS_LABELS } from "@/lib/constants";
import { deleteListing } from "../actions";

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
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, _count: { select: { leads: true } } },
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qPrefix = q ? `q=${encodeURIComponent(q)}&` : "";

  const statusBadge: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    sold: "bg-red-100 text-red-700",
    passive: "bg-slate-100 text-slate-600",
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">İlanlar</h1>
          <p className="text-sm text-slate-500">{total} ilan{q ? ` · "${q}" araması` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <form method="get" className="flex items-center gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Başlık / ilçe / slug ara…"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
            <button className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Ara</button>
          </form>
          <Link href="/admin/ilanlar/yeni" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-800">
            + Yeni İlan
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                <th className="p-3">İlan</th>
                <th className="p-3">Tür</th>
                <th className="p-3">İlçe</th>
                <th className="p-3">Fiyat</th>
                <th className="p-3">Durum</th>
                <th className="p-3 text-center">👁️</th>
                <th className="p-3 text-center">📬</th>
                <th className="p-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">İlan bulunamadı.</td></tr>
              )}
              {listings.map((l) => (
                <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50">
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
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[l.status]}`}>
                      {LISTING_STATUS_LABELS[l.status]}
                    </span>
                    {l.featured && <span className="ml-1 text-xs">⭐</span>}
                  </td>
                  <td className="p-3 text-center text-slate-600">{l.viewCount}</td>
                  <td className="p-3 text-center text-slate-600">{l._count.leads}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/ilan/${l.slug}`} target="_blank" className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100">Gör</Link>
                      <Link href={`/admin/ilanlar/${l.id}`} className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">Düzenle</Link>
                      <form action={deleteListing}>
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

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">Sayfa {page} / {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/ilanlar?${qPrefix}sayfa=${page - 1}`} className="rounded-lg bg-white px-3 py-1.5 font-medium text-slate-700 ring-1 ring-slate-200 hover:ring-brand-300">‹ Önceki</Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/ilanlar?${qPrefix}sayfa=${page + 1}`} className="rounded-lg bg-white px-3 py-1.5 font-medium text-slate-700 ring-1 ring-slate-200 hover:ring-brand-300">Sonraki ›</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
