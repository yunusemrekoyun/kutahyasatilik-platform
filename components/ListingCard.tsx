import Link from "next/link";
import Image from "next/image";
import { MapPin, BedDouble, Maximize, Star, ArrowRight, Gem, Flame, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { thumbUrl, mediaUrl } from "@/lib/media";
import type { Badge } from "@/lib/badges";
import CardActions from "./CardActions";

export type ListingCardData = {
  id?: string; // mobil istemci mesaj başlatmak için kullanır (POST /api/v1/messages listingId)
  slug: string;
  title: string;
  price: number;
  currency: string;
  propertyType: string;
  district: string;
  neighborhood?: string | null;
  rooms?: string | null;
  areaGross?: number | null;
  status: string;
  featured: boolean;
  verified?: boolean;
  coverImage?: string | null;
  badges?: Badge[];
  agentName?: string | null;
  agentLogo?: string | null;
};

export default function ListingCard({ listing }: { listing: ListingCardData }) {
  const cover = thumbUrl(listing.coverImage) || "/placeholder-listing.webp";
  const isLand = listing.propertyType === "arsa" || listing.propertyType === "tarla";
  const isSold = listing.status === "sold";
  const location = `${listing.neighborhood ? `${listing.neighborhood}, ` : ""}${listing.district}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 transition duration-300 hover:shadow-card hover:ring-brand-200">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <CardActions listing={listing} />
        <Link href={`/ilan/${listing.slug}`} className="block h-full w-full">
          <Image
            src={cover}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        </Link>
        {/* Tek durum işareti: Satıldıda gizli (SATILDI overlay var) — yoksa Öne çıkan > Doğrulanmış > Satılık */}
        <div className="pointer-events-none absolute left-3 top-3">
          {!isSold && (listing.featured ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-gold-200 px-2.5 py-1 text-[12px] font-semibold text-gold-900 shadow-sm">
              <Star className="h-3.5 w-3.5 fill-current" /> Vitrinde
            </span>
          ) : listing.verified ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1 text-[12px] font-semibold text-white shadow-sm">
              Doğrulanmış
            </span>
          ) : (
            <span className="rounded-md bg-brand-700 px-2.5 py-1 text-[12px] font-semibold text-white shadow-sm">
              Satılık
            </span>
          ))}
        </div>
        {isSold && (
          <div className="absolute inset-0 grid place-items-center bg-brand-950/55">
            <span className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-bold tracking-wide text-white">SATILDI</span>
          </div>
        )}
      </div>

      <div className="flex flex-grow flex-col p-4">
        <Link href={`/ilan/${listing.slug}`} className="block">
          <span className="mb-1 block text-[13px] font-medium text-slate-500">
            {PROPERTY_TYPE_LABELS[listing.propertyType] || listing.propertyType} · {location}
          </span>
          <h3 className="line-clamp-2 min-h-[3rem] font-display text-lg font-semibold leading-snug text-slate-900 transition-colors group-hover:text-brand-700">
            {listing.title}
          </h3>
        </Link>

        <div className="mt-3 flex items-center gap-4 text-[13px] font-medium text-slate-600">
          {!isLand && listing.rooms && (
            <span className="inline-flex items-center gap-1.5"><BedDouble className="h-[18px] w-[18px] text-slate-400" /> {listing.rooms}</span>
          )}
          {listing.areaGross && (
            <span className="inline-flex items-center gap-1.5"><Maximize className="h-[18px] w-[18px] text-slate-400" /> {listing.areaGross} m²</span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-[18px] w-[18px] text-slate-400" /> {listing.district}
          </span>
        </div>

        {!isSold && listing.badges && listing.badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {listing.badges.map((b, i) => {
              const Icon = b.tone === "deal" ? Gem : b.tone === "hot" ? Flame : Sparkles;
              const cls =
                b.tone === "deal"
                  ? "bg-gold-100 text-gold-800 ring-gold-200"
                  : b.tone === "hot"
                  ? "bg-red-50 text-red-700 ring-red-200"
                  : "bg-green-50 text-green-700 ring-green-200";
              return (
                <span key={i} className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}>
                  <Icon className="h-3 w-3" /> {b.text}
                </span>
              );
            })}
          </div>
        )}

        {listing.agentName && (
          <div className="mt-3 flex items-center gap-2">
            {listing.agentLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(listing.agentLogo)}
                alt={listing.agentName}
                className="h-7 w-7 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                {listing.agentName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="truncate text-xs font-semibold text-slate-600">{listing.agentName}</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <span className="rounded-lg bg-gold-100 px-3 py-1.5 text-[18px] font-bold tabular-nums text-gold-900">
            {formatPrice(listing.price, listing.currency)}
          </span>
          <Link
            href={`/ilan/${listing.slug}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
          >
            İncele <ArrowRight className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </div>
    </article>
  );
}
