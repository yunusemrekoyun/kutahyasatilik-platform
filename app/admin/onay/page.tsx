import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, User, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/format";
import { CATEGORY_LABELS, getSubTypeLabel } from "@/lib/categories";
import { countAlertsForListing } from "@/lib/matching";
import { approveListing, rejectListing } from "../actions";

export const dynamic = "force-dynamic";

const PER_PAGE = 25;

export default async function AdminModeration({
  searchParams,
}: {
  searchParams: Promise<{ sayfa?: string }>;
}) {
  const page = Math.max(1, Number((await searchParams).sayfa) || 1);
  // Sayfalama ZORUNLU: aşağıdaki eşleşen-talep sayacı ilan BAŞINA ayrı sorgu
  // atıyor (koşul her ilanın kendi fiyat/alan değerine bağlı, tek sorguya
  // indirilemiyor). Sınırsız kuyrukta bu, tek istekte yüzlerce eşzamanlı
  // sorgu demekti; sayfa boyutu aynı zamanda sorgu sayısının tavanıdır.
  const [total, listings] = await Promise.all([
    prisma.listing.count({ where: { moderationStatus: "pending" } }),
    prisma.listing.findMany({
      where: { moderationStatus: "pending" },
      orderBy: { createdAt: "asc" },
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
      include: {
        images: { take: 1, orderBy: { sortOrder: "asc" } },
        agent: { select: { name: true, title: true, agency: true, email: true } },
        // Bireysel ilanlarda danışman yok; sahibi kullanıcıdır.
        user: { select: { name: true, email: true } },
      },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const alertCounts = await Promise.all(listings.map((l) => countAlertsForListing(l)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Onay Bekleyen İlanlar</h1>
        <p className="text-sm text-muted">
          Emlakçıların eklediği {total} ilan yayın onayı bekliyor.
        </p>
      </div>

      {listings.length === 0 && (
        <div className="flex items-center justify-center gap-2 bg-paper p-10 text-center text-muted/70 border border-stone">
          <CheckCircle2 className="h-5 w-5 text-green-600" /> Onay bekleyen ilan yok.
        </div>
      )}

      <div className="space-y-4">
        {listings.map((l, idx) => (
          <div key={l.id} className="overflow-hidden rounded-lg bg-paper ring-1 ring-amber-200">
            <div className="flex flex-col gap-4 p-5 sm:flex-row">
              <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-lg bg-canvas sm:h-32 sm:w-44">
                {l.images[0] && (
                  <Image src={l.images[0].url} alt={l.title} fill sizes="200px" className="object-cover" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-bold text-ink">{l.title}</h2>
                  <span className="whitespace-nowrap text-lg font-black text-brand-700">{formatPrice(l.price, l.currency)}</span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {CATEGORY_LABELS[l.category] ?? l.category} · {getSubTypeLabel(l.category, l.propertyType)} · {l.neighborhood ? `${l.neighborhood}, ` : ""}{l.district} · {formatDate(l.createdAt)}
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-brand-700">
                  <User className="h-4 w-4" />
                  {l.agent
                    ? `${l.agent.name}${l.agent.title ? ` — ${l.agent.title}` : ""}${l.agent.agency ? ` (${l.agent.agency})` : ""}`
                    : l.user
                      ? `${l.user.name} (bireysel)`
                      : "Bilinmeyen danışman"}
                </p>
                {alertCounts[idx] > 0 && (
                  <Link href="/admin/alici-talepleri" className="mt-1 inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-bold text-green-700 hover:bg-green-100">
                    Bu ilana uygun {alertCounts[idx]} alıcı talebi bekliyor
                  </Link>
                )}
                <p className="mt-2 line-clamp-2 text-sm text-muted">{l.description}</p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link href={`/admin/ilanlar/${l.id}`} target="_blank" className="rounded-lg bg-canvas px-3 py-2 text-xs font-semibold text-ink hover:bg-stone">
                    Detayları İncele / Düzenle
                  </Link>
                  <form action={approveListing}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"><Check className="h-4 w-4" />Onayla ve Yayınla</button>
                  </form>
                  <form action={rejectListing} className="flex items-center gap-1.5">
                    <input type="hidden" name="id" value={l.id} />
                    <input name="note" placeholder="Red sebebi (ops.)" className="w-40 rounded-md border border-stone px-2 py-1.5 text-xs outline-none" />
                    <button className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Reddet</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Sayfa {page} / {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/onay${page - 1 > 1 ? `?sayfa=${page - 1}` : ""}`} className="rounded-lg bg-paper px-3 py-1.5 font-medium text-ink border border-stone hover:border-brand-300">‹ Önceki</Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/onay?sayfa=${page + 1}`} className="rounded-lg bg-paper px-3 py-1.5 font-medium text-ink border border-stone hover:border-brand-300">Sonraki ›</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
