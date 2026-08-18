import { getFilterableFields } from "./categories";

export type ListingFilter = {
  category?: string;
  /**
   * Kategoriye özel nitelik filtreleri. Seçim alanlarında `{ yakit: "dizel" }`,
   * sayı alanlarında `{ yil_min: "2015", yil_max: "2020" }` biçiminde okunur.
   * Yalnız `category` verildiğinde ve kayıtta filtrelenebilir işaretli alanlar
   * için uygulanır — istemciden gelen tanımsız anahtarlar sessizce atılır.
   */
  attrs?: Record<string, string>;
  propertyType?: string;
  listingType?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  rooms?: string;
  zoning?: string;
  furnished?: boolean;
  parking?: boolean;
  balcony?: boolean;
  inSite?: boolean;
  verified?: boolean;
  q?: string;
  sort?: string;
  agencySlug?: string;
  agentSlug?: string;
};

/**
 * Kamu görünürlük değişmezi — TEK KAYNAK.
 *
 * Bu öneki taşımayan her sorgu yolu, onay bekleyen (`moderationStatus: "pending"`)
 * bireysel ilanları anında yayına düşürür. Kural daha önce beş ayrı yerde elle
 * tekrarlanıyordu: buildWhere, getFeaturedListings, publicDirectory, matching ve
 * /api/v1/listings/[slug]. Yeni bir sorgu yolu açarken bunlardan birini kullan.
 *
 * İki varyant bilinçli olarak ayrı:
 * - VISIBLE: satılmış ilanlar da görünür (yalnız pasife alınanlar düşer).
 * - ACTIVE : yalnız satıştakiler. Dizin/profil **uygunluk kapısı** için —
 *   "en az bir yayında ilanı var mı" sorusunun cevabı satılmış ilanla verilemez.
 *
 * Nesne literali olarak tutuluyor (fonksiyon değil) ki Prisma iç içe filtrelerde
 * (`listings: { some: ... }`) tipi çıkarabilsin.
 */
export const PUBLIC_VISIBLE_LISTING = {
  status: { not: "passive" },
  moderationStatus: "approved",
} as const;

export const PUBLIC_ACTIVE_LISTING = {
  status: "active",
  moderationStatus: "approved",
} as const;

export function buildWhere(filter: ListingFilter) {
  const where: Record<string, unknown> = { ...PUBLIC_VISIBLE_LISTING };
  if (filter.category) where.category = filter.category;
  if (filter.propertyType) where.propertyType = filter.propertyType;
  if (filter.listingType) where.listingType = filter.listingType;
  if (filter.district) where.district = filter.district;
  if (filter.rooms) where.rooms = filter.rooms;
  if (filter.agencySlug) {
    where.status = "active";
    where.agencyRef = {
      is: { slug: filter.agencySlug, status: "approved", published: true },
    };
  }
  if (filter.agentSlug) {
    where.status = "active";
    where.agent = {
      is: { slug: filter.agentSlug, status: "approved", publicProfile: true },
    };
  }

  if (filter.minArea || filter.maxArea) {
    where.areaGross = {
      ...(filter.minArea ? { gte: filter.minArea } : {}),
      ...(filter.maxArea ? { lte: filter.maxArea } : {}),
    };
  }
  if (filter.minPrice || filter.maxPrice) {
    where.price = {
      ...(filter.minPrice ? { gte: filter.minPrice } : {}),
      ...(filter.maxPrice ? { lte: filter.maxPrice } : {}),
    };
  }

  if (filter.zoning) where.zoningStatus = { contains: filter.zoning, mode: "insensitive" };
  if (filter.furnished) where.furnished = true;
  if (filter.parking) where.parking = true;
  if (filter.balcony) where.balcony = true;
  if (filter.inSite) where.inSite = true;
  if (filter.verified) where.verified = true;

  if (filter.q) {
    const q = filter.q.trim();
    const or: Record<string, unknown>[] = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { neighborhood: { contains: q, mode: "insensitive" } },
      {
        AND: [
          { locationVisibility: "exact" },
          { address: { contains: q, mode: "insensitive" } },
        ],
      },
    ];
    if (/^[a-z0-9]{4,12}$/i.test(q)) or.push({ id: { endsWith: q.toLowerCase() } });
    where.OR = or;
  }

  const attrConditions = buildAttributeConditions(filter);
  if (attrConditions.length) where.AND = attrConditions;

  return where;
}

/**
 * Kategoriye özel JSONB nitelik koşulları. Her koşul ayrı bir AND maddesi olur;
 * tek bir `attributes` nesnesine birden fazla yol koşulu yazılamaz.
 *
 * Kayıtta tanımlı olmayan veya seçenek listesinde bulunmayan değerler atılır,
 * böylece istemciden gelen serbest metin sorguya sızmaz.
 */
function buildAttributeConditions(filter: ListingFilter): Record<string, unknown>[] {
  if (!filter.category || !filter.attrs) return [];
  const attrs = filter.attrs;
  const out: Record<string, unknown>[] = [];

  for (const field of getFilterableFields(filter.category)) {
    if (field.type === "select") {
      const value = attrs[field.key]?.trim();
      if (value && field.options?.some((o) => o.value === value)) {
        out.push({ attributes: { path: [field.key], equals: value } });
      }
      continue;
    }

    if (field.type === "number") {
      // Number("") === 0 olduğu için boş değer önce elenmeli.
      const range: Record<string, number> = {};
      const min = attrs[`${field.key}_min`]?.trim();
      const max = attrs[`${field.key}_max`]?.trim();
      if (min && Number.isFinite(Number(min))) range.gte = Number(min);
      if (max && Number.isFinite(Number(max))) range.lte = Number(max);
      if (Object.keys(range).length) {
        out.push({ attributes: { path: [field.key], ...range } });
      }
    }
  }

  return out;
}

/**
 * Kategoriye göre kullanılabilir sıralamalar.
 *
 * Fiyat ve tarih her kategoride anlamlı. Diğerleri değil: "en düşük kilometre"
 * bir dairede, "en büyük alan" bir telefonda karşılığı olmayan seçeneklerdi ve
 * eskiden yalnız bu dördü vardı — vasıta arayanın ilk iki refleksi (en yeni
 * model, en az km) sitede hiç yoktu.
 */
export const SORT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  ortak: [
    { value: "", label: "Önerilen" },
    { value: "price_asc", label: "Fiyat (Artan)" },
    { value: "price_desc", label: "Fiyat (Azalan)" },
    { value: "oldest", label: "En Eski İlan" },
  ],
  emlak: [
    { value: "area_desc", label: "Alan (Büyükten)" },
    { value: "area_asc", label: "Alan (Küçükten)" },
  ],
  vasita: [
    { value: "year_desc", label: "Model Yılı (Yeniden)" },
    { value: "year_asc", label: "Model Yılı (Eskiden)" },
    { value: "km_asc", label: "Kilometre (Azdan)" },
    { value: "km_desc", label: "Kilometre (Çoktan)" },
  ],
  teknoloji: [],
};

/** Bir kategoride gösterilecek sıralama listesi (ortak + kategoriye özel). */
export function sortOptionsFor(category?: string) {
  return [...SORT_OPTIONS.ortak, ...(SORT_OPTIONS[category ?? ""] ?? [])];
}

export function buildOrderBy(sort?: string) {
  switch (sort) {
    case "price_asc": return [{ price: "asc" as const }];
    case "price_desc": return [{ price: "desc" as const }];
    case "oldest": return [{ createdAt: "asc" as const }];
    // attrYear/attrKm attributes'tan türetilmiş kolonlar (bkz. schema.prisma).
    // Boş olanlar sona: veri girilmemiş bir ilan listenin başını kapatmasın.
    case "year_desc": return [{ attrYear: { sort: "desc" as const, nulls: "last" as const } }];
    case "year_asc": return [{ attrYear: { sort: "asc" as const, nulls: "last" as const } }];
    case "km_asc": return [{ attrKm: { sort: "asc" as const, nulls: "last" as const } }];
    case "km_desc": return [{ attrKm: { sort: "desc" as const, nulls: "last" as const } }];
    case "area_desc": return [{ areaGross: { sort: "desc" as const, nulls: "last" as const } }];
    case "area_asc": return [{ areaGross: { sort: "asc" as const, nulls: "last" as const } }];
    default: return [{ featured: "desc" as const }, { createdAt: "desc" as const }];
  }
}
