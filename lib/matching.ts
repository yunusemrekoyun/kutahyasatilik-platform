import { prisma } from "./prisma";
import { buildAttributeConditions, PUBLIC_ACTIVE_LISTING } from "./listingFilters";
import { getFilterableFields, toCategoryKey } from "./categories";

// Alıcı talebi (kayıtlı arama) ↔ ilan eşleştirme motoru.
//
// KAPSAM: Artık HER KATEGORİDE. Önceden BuyerAlert'te `category` kolonu yoktu
// ve kapsam kod tarafında "emlak" olarak sabitlenmişti; vasıta ya da teknoloji
// arayan kullanıcıya asla eşleşme gitmiyordu — arayüzde "uygun ilan gelince
// haber verelim" yazarken karşılığı olmayan bir vaatti.
//
// Kategori kriterleri iki yerde tutulur:
//   - Emlak: gerçek kolonlar (rooms, areaGross) — Listing ile aynı yapı
//   - Diğer: attributes JSONB (yil_min, kilometre_max, yakit...) — ilan
//     filtreleriyle AYNI sözleşme, böylece "aramayı kaydet" düğmesi ekrandaki
//     filtreleri olduğu gibi taşıyabiliyor.

export type AlertAttributes = Record<string, string>;

export type AlertCriteria = {
  category?: string | null;
  propertyType?: string | null;
  listingType?: string | null;
  district?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minArea?: number | null;
  rooms?: string | null;
  attributes?: unknown;
};

export type ListingForMatch = {
  propertyType: string;
  listingType?: string | null;
  district: string;
  price: number;
  areaGross?: number | null;
  rooms?: string | null;
  attributes?: unknown;
  /**
   * Verilmezse `emlak` sayılır — `Listing.category` kolonunun DB varsayılanı da
   * budur, yani kategoriyi taşımayan eski yazma yolları doğru davranışı alır.
   */
  category?: string | null;
};

function readAttributes(value: unknown): AlertAttributes {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: AlertAttributes = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === "string" && raw) out[key] = raw;
    else if (typeof raw === "number" && Number.isFinite(raw)) out[key] = String(raw);
  }
  return out;
}

/** Bir alıcı talebine uyan AKTİF & ONAYLI ilanları sorgular. */
export function alertToListingWhere(alert: AlertCriteria): Record<string, unknown> {
  const category = toCategoryKey(alert.category);
  const where: Record<string, unknown> = { ...PUBLIC_ACTIVE_LISTING, category };
  if (alert.propertyType) where.propertyType = alert.propertyType;
  if (alert.listingType) where.listingType = alert.listingType;
  if (alert.district) where.district = alert.district;
  if (alert.minPrice || alert.maxPrice) {
    where.price = {
      ...(alert.minPrice ? { gte: alert.minPrice } : {}),
      ...(alert.maxPrice ? { lte: alert.maxPrice } : {}),
    };
  }
  // Oda ve alan yalnız emlakta gerçek kolon; diğer kategorilerde bu alanlar
  // dolu gelse bile sorguya girmemeli, yoksa hiç sonuç dönmez.
  if (category === "emlak") {
    if (alert.rooms) where.rooms = alert.rooms;
    if (alert.minArea) where.areaGross = { gte: alert.minArea };
  } else {
    // Nitelik koşulları ilan filtreleriyle AYNI üreticiden geçiyor: "aramayı
    // kaydet" ekrandaki filtreleri taşıdığı için iki tarafın sözleşmesi
    // birebir aynı olmalı, yoksa kaydedilen arama farklı sonuç döndürür.
    const conditions = buildAttributeConditions({
      category,
      attrs: readAttributes(alert.attributes),
    });
    if (conditions.length) where.AND = conditions;
  }
  return where;
}

export async function findListingsForAlert(alert: AlertCriteria, take = 12) {
  return prisma.listing.findMany({
    where: alertToListingWhere(alert),
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true, slug: true, title: true, price: true, currency: true,
      category: true, propertyType: true, district: true, neighborhood: true,
      rooms: true, areaGross: true, status: true, featured: true, verified: true,
      attributes: true,
      images: { select: { url: true }, orderBy: { sortOrder: "asc" as const }, take: 1 },
      agent: { select: { name: true } },
    },
  });
}

export async function countListingsForAlert(alert: AlertCriteria): Promise<number> {
  return prisma.listing.count({ where: alertToListingWhere(alert) });
}

/**
 * Bir ilana uyan AKTİF alıcı taleplerini sorgular.
 *
 * Nitelik kriterleri (yil_min gibi) veritabanı tarafında karşılaştırılamıyor:
 * talebin JSONB'sindeki eşiği ilanın JSONB'sindeki değerle kıyaslamak SQL'de
 * her alan için ayrı ifade demek. Kaba eleme sorguda, nitelik kontrolü
 * bellekte yapılıyor — aktif talep sayısı bu ölçekte küçük.
 */
export function listingToAlertWhere(listing: ListingForMatch): Record<string, unknown> {
  const category = toCategoryKey(listing.category);
  const base: Record<string, unknown>[] = [
    { OR: [{ propertyType: null }, { propertyType: listing.propertyType }] },
    { OR: [{ listingType: null }, { listingType: listing.listingType ?? "sale" }] },
    { OR: [{ district: null }, { district: listing.district }] },
    { OR: [{ maxPrice: null }, { maxPrice: { gte: listing.price } }] },
    { OR: [{ minPrice: null }, { minPrice: { lte: listing.price } }] },
  ];
  if (category === "emlak") {
    base.push({ OR: [{ rooms: null }, { rooms: listing.rooms ?? undefined }] });
    base.push({ OR: [{ minArea: null }, { minArea: { lte: listing.areaGross ?? 0 } }] });
  }
  return { status: "active", category, AND: base };
}

/** Talebin nitelik kriterleri ilanın niteliklerini karşılıyor mu. */
export function attributesSatisfy(listing: ListingForMatch, alert: AlertCriteria): boolean {
  const category = toCategoryKey(listing.category);
  if (category === "emlak") return true;
  const wanted = readAttributes(alert.attributes);
  if (!Object.keys(wanted).length) return true;

  const have = readAttributes(listing.attributes);
  for (const field of getFilterableFields(category)) {
    if (field.type === "select") {
      const value = wanted[field.key];
      if (value && have[field.key] !== value) return false;
      continue;
    }
    const min = wanted[`${field.key}_min`];
    const max = wanted[`${field.key}_max`];
    if (!min && !max) continue;
    const actual = Number(have[field.key]);
    // Kriter var ama ilanda o alan yoksa eşleşme sayılmaz: "en fazla 100.000 km"
    // diyen kullanıcıya kilometresi bilinmeyen bir araç önerilmemeli.
    if (!Number.isFinite(actual)) return false;
    if (min && actual < Number(min)) return false;
    if (max && actual > Number(max)) return false;
  }
  return true;
}

export async function findAlertsForListing(listing: ListingForMatch, take = 100) {
  const alerts = await prisma.buyerAlert.findMany({
    where: listingToAlertWhere(listing),
    orderBy: { createdAt: "desc" },
    take,
  });
  return alerts.filter((alert) => attributesSatisfy(listing, alert));
}

export async function countAlertsForListing(listing: ListingForMatch): Promise<number> {
  return (await findAlertsForListing(listing)).length;
}
