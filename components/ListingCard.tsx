import Link from "next/link";
import Image from "next/image";
import { MapPin, BedDouble, Maximize, Star, Gem, Flame, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { getSubTypeLabel } from "@/lib/categories";
import { publicImageUrl, thumbUrl } from "@/lib/media";
import type { Badge } from "@/lib/badges";
import CardActions from "./CardActions";

export type ListingCardData = {
  id?: string; // mobil istemci mesaj başlatmak için kullanır (POST /api/v1/messages listingId)
  slug: string;
  title: string;
  price: number;
  currency: string;
  /** Kategori. Eski çağrı yerleri bu alanı göndermez; emlak varsayılır. */
  category?: string;
  /** Kategori içi alt tür (emlakta daire/arsa, vasıtada otomobil...) */
  propertyType: string;
  /** Alt türün okunur etiketi — decorate() üretir, istemciler kayıt taşımasın. */
  subTypeLabel?: string;
  /**
   * Emlak dışı kategorilerde kartta gösterilecek hazır özet metinleri
   * ("2019", "120.000 km"). Emlak kendi kolonlarını (rooms/areaGross) kullanır.
   */
  attributeSummary?: string[];
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

/**
 * Varyantlar:
 * - `row`       yoğun liste satırı (/ilanlar liste görünümü) — görsel solda
 * - `standard`  ızgara kartı (varsayılan)
 * - `editorial` büyük vitrin kartı (ana sayfa ilk kart)
 * - `compact`   dar yatay kart (yan listeler)
 * - `tile`      kare vitrin karosu (ana sayfa) — kare görsel, kısa başlık, fiyat
 */
type Variant = "row" | "standard" | "editorial" | "compact" | "tile";

export default function ListingCard({
  listing,
  priority = false,
  variant = "standard",
}: {
  listing: ListingCardData;
  priority?: boolean;
  variant?: Variant;
}) {
  const safeCover = publicImageUrl(listing.coverImage);
  const cover = safeCover ? thumbUrl(safeCover) : "/placeholder-listing.webp";
  const agentLogo = publicImageUrl(listing.agentLogo);
  // Kategori gönderilmeyen eski çağrı yerleri emlak sayılır.
  const isRealEstate = !listing.category || listing.category === "emlak";
  const isLand = listing.propertyType === "arsa" || listing.propertyType === "tarla";
  const isSold = listing.status === "sold";
  const horizontal = variant === "row" || variant === "compact";
  const location = `${listing.neighborhood ? `${listing.neighborhood}, ` : ""}${listing.district}`;
  const titleId = `listing-${listing.slug}-title`;

  const mediaCls =
    variant === "tile"
      ? "aspect-square"
      : variant === "editorial"
      ? "aspect-[16/10]"
      : variant === "compact"
      ? "w-36 shrink-0 sm:w-44"
      : variant === "row"
      ? "w-32 shrink-0 sm:w-52"
      : "aspect-[4/3]";

  const titleCls =
    variant === "tile"
      ? "text-sm"
      : variant === "editorial"
      ? "text-xl sm:text-2xl"
      : variant === "compact"
      ? "text-[15px]"
      : variant === "row"
      ? "text-base sm:text-lg"
      : "text-lg";

  return (
    <article
      aria-labelledby={titleId}
      className={`group flex overflow-hidden rounded-card border border-stone bg-paper transition duration-200 hover:border-brand-300 hover:shadow-card ${
        horizontal ? "flex-row" : "flex-col"
      }`}
    >
      <div className={`relative overflow-hidden bg-canvas ${mediaCls}`}>
        <CardActions listing={listing} />
        <Link
          href={`/ilan/${listing.slug}`}
          aria-label={`${listing.title} ilanını incele`}
          className="relative block h-full w-full"
        >
          <Image
            src={cover}
            alt={listing.title}
            fill
            sizes={horizontal ? "208px" : "(max-width: 768px) 100vw, 33vw"}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        </Link>
        {/* Tek durum işareti: Satıldıda gizli (SATILDI overlay var) — yoksa Öne çıkan > Doğrulanmış > Satılık */}
        <div className="pointer-events-none absolute left-2.5 top-2.5">
          {!isSold &&
            (listing.featured ? (
              <span className="inline-flex items-center gap-1 rounded-control bg-gold-500 px-2 py-0.5 text-[11px] font-bold text-brand-950">
                <Star aria-hidden="true" className="h-3 w-3 fill-current" /> Vitrin
              </span>
            ) : listing.verified ? (
              <span className="inline-flex items-center gap-1 rounded-control bg-green-700 px-2 py-0.5 text-[11px] font-semibold text-white">
                Doğrulanmış
              </span>
            ) : null)}
        </div>
        {isSold && (
          <div className="absolute inset-0 grid place-items-center bg-brand-950/55">
            <span className="rounded-control bg-red-600 px-3 py-1 text-xs font-bold tracking-wide text-white">
              SATILDI
            </span>
          </div>
        )}
      </div>

      <div
        className={`flex min-w-0 flex-grow flex-col ${
          variant === "editorial" ? "p-5" : variant === "row" ? "p-3 sm:p-4" : variant === "tile" ? "p-2.5" : "p-3.5"
        }`}
      >
        <Link href={`/ilan/${listing.slug}`} className="block">
          <p className="mb-1 line-clamp-1 text-xs font-medium text-muted">
            {listing.subTypeLabel ?? getSubTypeLabel(listing.category, listing.propertyType)} · {location}
          </p>
          <h3
            id={titleId}
            className={`line-clamp-2 font-semibold leading-snug text-ink transition-colors group-hover:text-brand-700 ${titleCls}`}
          >
            {listing.title}
          </h3>
        </Link>

        <div
          className={`mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] text-muted ${
            variant === "compact" ? "hidden sm:flex" : variant === "tile" ? "hidden" : ""
          }`}
        >
          {isRealEstate ? (
            <>
              {!isLand && listing.rooms && (
                <span className="inline-flex items-center gap-1">
                  <BedDouble aria-hidden="true" className="h-4 w-4 text-muted/70" /> {listing.rooms}
                </span>
              )}
              {listing.areaGross && (
                <span className="inline-flex items-center gap-1">
                  <Maximize aria-hidden="true" className="h-4 w-4 text-muted/70" /> {listing.areaGross} m²
                </span>
              )}
            </>
          ) : (
            listing.attributeSummary?.map((text) => <span key={text}>{text}</span>)
          )}
          <span className="inline-flex items-center gap-1">
            <MapPin aria-hidden="true" className="h-4 w-4 text-muted/70" /> {listing.district}
          </span>
        </div>

        {!isSold && listing.badges && listing.badges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {listing.badges.map((b, i) => {
              const Icon = b.tone === "deal" ? Gem : b.tone === "hot" ? Flame : Sparkles;
              const cls =
                b.tone === "deal"
                  ? "bg-gold-100 text-gold-800 ring-gold-200"
                  : b.tone === "hot"
                  ? "bg-red-50 text-red-700 ring-red-200"
                  : "bg-green-50 text-green-700 ring-green-200";
              return (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 rounded-control px-1.5 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}
                >
                  <Icon aria-hidden="true" className="h-3 w-3" /> {b.text}
                </span>
              );
            })}
          </div>
        )}

        {listing.agentName && variant !== "compact" && variant !== "row" && variant !== "tile" && (
          <div className="mt-2.5 flex items-center gap-2">
            {agentLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={agentLogo} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
            ) : (
              <span
                aria-hidden="true"
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700"
              >
                {listing.agentName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="truncate text-xs text-muted">{listing.agentName}</span>
          </div>
        )}

        {/* Fiyat: standart arayüzlerde sayfanın en yüksek sesli öğesi.
            Editoryal dilde düz altın metindi; nötr yüzeyde okunurluk için
            lacivert taşıyıcıya alındı, altın vurgu rozetlerde kaldı. */}
        <div className={`mt-auto flex items-end justify-between gap-2 ${variant === "tile" ? "pt-2" : "pt-3"}`}>
          <span
            className={`font-bold tabular-nums text-brand-800 ${
              variant === "editorial" ? "text-xl sm:text-2xl" : variant === "compact" || variant === "tile" ? "text-base" : "text-lg"
            }`}
          >
            {formatPrice(listing.price, listing.currency)}
          </span>
        </div>
      </div>
    </article>
  );
}
