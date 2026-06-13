import Link from "next/link";
import Image from "next/image";
import { MapPin, BedDouble, Maximize, Star, BadgeCheck, BadgePercent, Flame, Sparkles, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { thumbUrl } from "@/lib/media";
import type { Badge, BadgeTone } from "@/lib/badges";
import CardActions from "./CardActions";

const BADGE_ICON: Record<BadgeTone, typeof Flame> = {
  deal: BadgePercent,
  hot: Flame,
  new: Sparkles,
};

export type ListingCardData = {
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
};

export default function ListingCard({ listing }: { listing: ListingCardData }) {
  const cover = thumbUrl(listing.coverImage) || "https://picsum.photos/seed/placeholder/800/600";
  const isLand = listing.propertyType === "arsa" || listing.propertyType === "tarla";
  const badges = listing.badges ?? [];
  const dealBadge = badges.find((b) => b.tone === "deal");
  const cornerBadge = badges.find((b) => b.tone === "hot") ?? badges.find((b) => b.tone === "new");

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-prestige hover:ring-brand-200">
      <CardActions listing={listing} />
      <Link href={`/ilan/${listing.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <Image
            src={cover}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            <span className="w-fit rounded-md bg-brand-900/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
              {PROPERTY_TYPE_LABELS[listing.propertyType] || listing.propertyType}
            </span>
            {listing.featured && (
              <span className="inline-flex w-fit items-center gap-1 rounded-md bg-gold-500 px-2.5 py-1 text-[11px] font-bold text-brand-950">
                <Star className="h-3 w-3 fill-current" /> Öne Çıkan
              </span>
            )}
            {listing.verified && (
              <span className="inline-flex w-fit items-center gap-1 rounded-md bg-green-600/95 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                <BadgeCheck className="h-3 w-3" /> Doğrulanmış
              </span>
            )}
          </div>
          {cornerBadge && listing.status !== "sold" && (() => {
            const Icon = BADGE_ICON[cornerBadge.tone];
            return (
              <span
                className={`absolute right-3 top-3 inline-flex w-fit items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur ${
                  cornerBadge.tone === "hot" ? "bg-orange-500/95 text-white" : "bg-white/90 text-brand-800"
                }`}
              >
                <Icon className="h-3 w-3" /> {cornerBadge.text}
              </span>
            );
          })()}
          {listing.status === "sold" && (
            <div className="absolute inset-0 grid place-items-center bg-brand-950/55">
              <span className="rotate-[-8deg] rounded-lg bg-red-600 px-4 py-1.5 text-lg font-black text-white shadow-lg">SATILDI</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-950/80 to-transparent p-3 pt-8">
            {dealBadge && listing.status !== "sold" && (
              <span className="mb-1.5 inline-flex w-fit items-center gap-1 rounded-md bg-green-500 px-2 py-0.5 text-[11px] font-bold text-white shadow">
                <BadgePercent className="h-3 w-3" /> {dealBadge.text}
              </span>
            )}
            <p className="font-display text-xl font-bold text-white drop-shadow">
              {formatPrice(listing.price, listing.currency)}
            </p>
          </div>
        </div>
        <div className="p-4">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-800 group-hover:text-brand-700">
            {listing.title}
          </h3>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-gold-500" />
            {listing.neighborhood ? `${listing.neighborhood}, ` : ""}{listing.district}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-600">
            {!isLand && listing.rooms && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1"><BedDouble className="h-3.5 w-3.5 text-slate-400" /> {listing.rooms}</span>
            )}
            {listing.areaGross && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1"><Maximize className="h-3.5 w-3.5 text-slate-400" /> {listing.areaGross} m²</span>
            )}
            <span className="ml-auto inline-flex items-center gap-1 font-semibold text-brand-700">
              İncele <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
          {listing.agentName && (
            <p className="mt-2 flex items-center gap-1.5 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-100 text-[9px] font-bold text-brand-700">
                {listing.agentName.slice(0, 1).toUpperCase()}
              </span>
              Danışman: <span className="font-semibold text-slate-700">{listing.agentName}</span>
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
