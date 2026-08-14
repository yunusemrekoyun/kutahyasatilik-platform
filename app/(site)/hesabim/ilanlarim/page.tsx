import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, PackageOpen, Plus, XCircle } from "lucide-react";
import { getUserSession } from "@/lib/userAuth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/format";
import { publicImageUrl, thumbUrl } from "@/lib/media";
import { getSubTypeLabel, CATEGORY_LABELS } from "@/lib/categories";
import { deleteUserListing } from "@/app/(site)/ilan-ver/actions";

export const metadata: Metadata = {
  title: "İlanlarım",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const MODERATION: Record<string, { label: string; className: string; Icon: typeof Clock }> = {
  pending: { label: "Onay bekliyor", className: "bg-amber-50 text-amber-700 ring-amber-200", Icon: Clock },
  approved: { label: "Yayında", className: "bg-green-50 text-green-700 ring-green-200", Icon: CheckCircle2 },
  rejected: { label: "Reddedildi", className: "bg-red-50 text-red-700 ring-red-200", Icon: XCircle },
};

export default async function MyListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getUserSession();
  if (!session) redirect("/giris?next=/hesabim/ilanlarim");

  const sp = await searchParams;
  const justSubmitted = sp.durum === "gonderildi";

  const listings = await prisma.listing.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, slug: true, title: true, price: true, currency: true,
      category: true, propertyType: true, district: true, createdAt: true,
      moderationStatus: true, note: true, status: true,
      images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-6 sm:py-14">
      <nav aria-label="Sayfa yolu" className="mb-2 text-sm text-muted">
        <Link href="/hesabim" className="hover:text-brand-700">Hesabım</Link>
        <span className="mx-2 text-stone">/</span>
        <span className="text-ink">İlanlarım</span>
      </nav>

      <div className="mb-8 flex flex-col gap-4 border-b border-stone pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Yayınlarım</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-brand-950">İlanlarım</h1>
        </div>
        <Link
          href="/ilan-ver"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          <Plus className="h-4 w-4" /> Yeni İlan
        </Link>
      </div>

      {justSubmitted && (
        <p role="status" className="mb-6 border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          İlanınız alındı. Ekibimiz onayladıktan sonra yayına girecek.
        </p>
      )}

      {listings.length === 0 ? (
        <div className="border-y border-stone bg-paper p-12 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-lg border border-stone bg-canvas text-muted">
            <PackageOpen className="h-7 w-7" />
          </span>
          <h2 className="mt-4 font-display text-lg font-semibold text-ink">Henüz ilanınız yok</h2>
          <p className="mx-auto mt-1.5 max-w-md text-muted">
            Aracınızı veya teknoloji ürününüzü birkaç dakikada yayımlayabilirsiniz.
          </p>
          <Link href="/ilan-ver" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-700 px-5 text-sm font-semibold text-white transition hover:bg-brand-800">
            İlan Ver
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-stone border-y border-stone">
          {listings.map((listing) => {
            const badge = MODERATION[listing.moderationStatus] ?? MODERATION.pending;
            const cover = publicImageUrl(listing.images[0]?.url);
            return (
              <li key={listing.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
                <div className="relative h-20 w-28 shrink-0 overflow-hidden border border-stone bg-canvas">
                  <Image
                    src={cover ? thumbUrl(cover) : "/placeholder-listing.webp"}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="eyebrow mb-1">
                    {CATEGORY_LABELS[listing.category] ?? listing.category} ·{" "}
                    {getSubTypeLabel(listing.category, listing.propertyType)} · {listing.district}
                  </p>
                  {/* Onaylanmamış ilanın herkese açık sayfası yok; başlık düz metin kalır. */}
                  {listing.moderationStatus === "approved" ? (
                    <Link href={`/ilan/${listing.slug}`} className="font-display text-lg font-semibold text-ink hover:text-brand-700">
                      {listing.title}
                    </Link>
                  ) : (
                    <p className="font-display text-lg font-semibold text-ink">{listing.title}</p>
                  )}
                  <p className="mt-1 text-sm text-muted">
                    {formatPrice(listing.price, listing.currency)} · {formatDate(listing.createdAt)}
                  </p>
                  {listing.moderationStatus === "rejected" && listing.note ? (
                    <p className="mt-2 border-l-2 border-red-300 pl-3 text-sm text-red-700">{listing.note}</p>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badge.className}`}>
                    <badge.Icon className="h-3.5 w-3.5" /> {badge.label}
                  </span>
                  <form action={deleteUserListing}>
                    <input type="hidden" name="id" value={listing.id} />
                    <button
                      type="submit"
                      className="min-h-11 text-sm font-semibold text-muted transition hover:text-red-600"
                    >
                      Sil
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
