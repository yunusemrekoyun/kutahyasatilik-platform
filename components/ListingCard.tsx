import Link from "next/link";
import Image from "next/image";
import { MapPin, BedDouble, Maximize, Star, ArrowRight, Gem, Flame, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { publicImageUrl, thumbUrl } from "@/lib/media";
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

export default function ListingCard({
  listing,
  priority = false,
  variant = "standard",
}: {
  listing: ListingCardData;
  priority?: boolean;
  variant?: "editorial" | "standard" | "compact";
}) {
  const safeCover = publicImageUrl(listing.coverImage);
  const cover = safeCover ? thumbUrl(safeCover) : "/placeholder-listing.webp";
  const agentLogo = publicImageUrl(listing.agentLogo);
  const isLand = listing.propertyType === "arsa" || listing.propertyType === "tarla";
  const isSold = listing.status === "sold";
  const location = `${listing.neighborhood ? `${listing.neighborhood}, ` : ""}${listing.district}`;

  return (
    <article className={`group flex overflow-hidden border border-stone bg-paper transition duration-200 hover:border-brand-300 ${
      variant === "compact" ? "flex-row" : "flex-col"
    }`}>
      <div className={`relative overflow-hidden bg-slate-100 ${
        variant === "editorial" ? "aspect-[16/10]" : variant === "compact" ? "w-36 shrink-0 sm:w-44" : "aspect-[4/3]"
      }`}>
        <CardActions listing={listing} />
        <Link href={`/ilan/${listing.slug}`} className="relative block h-full w-full">
          <Image
            src={cover}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        </Link>
        {/* Tek durum işareti: Satıldıda gizli (SATILDI overlay var) — yoksa Öne çıkan > Doğrulanmış > Satılık */}
        <div className="pointer-events-none absolute left-3 top-3">
          {!isSold && (listing.featured ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-paper/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gold-800">
              <Star className="h-3.5 w-3.5 fill-current" /> Vitrinde
            </span>
          ) : listing.verified ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-green-700 px-2.5 py-1 text-[11px] font-semibold text-white">
              Doğrulanmış
            </span>
          ) : (
            <span className="rounded-md bg-brand-950/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
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

      <div className={`flex min-w-0 flex-grow flex-col ${variant === "editorial" ? "p-5 sm:p-6" : "p-4"}`}>
        <Link href={`/ilan/${listing.slug}`} className="block">
          <span className="eyebrow mb-2 block line-clamp-1">
            {PROPERTY_TYPE_LABELS[listing.propertyType] || listing.propertyType} · {location}
          </span>
          <h3 className={`line-clamp-2 font-display font-semibold leading-snug text-ink transition-colors group-hover:text-brand-700 ${variant === "editorial" ? "text-2xl sm:text-3xl" : variant === "compact" ? "text-base" : "text-xl"}`}>
            {listing.title}
          </h3>
        </Link>

        <div className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-medium text-muted ${variant === "compact" ? "hidden sm:flex" : ""}`}>
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

        {listing.agentName && variant !== "compact" && (
          <div className="mt-3 flex items-center gap-2">
            {agentLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agentLogo}
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

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-stone pt-4">
          <span className={`${variant === "editorial" ? "text-2xl" : "text-lg"} font-bold tabular-nums text-gold-800`}>
            {formatPrice(listing.price, listing.currency)}
          </span>
          <Link
            href={`/ilan/${listing.slug}`}
            className={`shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-900 ${variant === "compact" ? "hidden sm:inline-flex" : "inline-flex"}`}
          >
            İncele <ArrowRight className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </div>
    </article>
  );
}
