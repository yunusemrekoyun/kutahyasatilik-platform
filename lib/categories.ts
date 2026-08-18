// ---------------------------------------------------------------------------
// Kategori kaydı — çok kategorili ilan platformunun tek kaynağı.
//
// Form alanları, doğrulama, filtre kontrolleri ve detay sayfasındaki nitelik
// tablosu HEP buradan üretilir. Yeni bir kategori eklemek için bu dosyaya kayıt
// düşmek yeterlidir; migration gerekmez.
//
// Emlak bir istisnadır: alanları Listing üzerinde gerçek kolonlar olarak durur
// (rooms, areaGross, zoningStatus...). Bu yüzden `fields` listesi boştur ve
// `attributes` JSONB alanını kullanmaz. Diğer kategoriler tersini yapar.
// ---------------------------------------------------------------------------

import { PROPERTY_TYPES } from "./constants";

export const CATEGORY_KEYS = ["emlak", "vasita", "teknoloji"] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const DEFAULT_CATEGORY: CategoryKey = "emlak";

export type CategoryFieldType = "text" | "number" | "select";

export type CategoryOption = { value: string; label: string };

export type CategoryField = {
  key: string;
  label: string;
  type: CategoryFieldType;
  required?: boolean;
  /** type === "select" için zorunlu */
  options?: readonly CategoryOption[];
  /** Sayı alanlarında değerin sonuna eklenir: "120.000 km" */
  unit?: string;
  /**
   * Sayıyı binlik ayracı olmadan yazar. Yıl gibi alanlar sayı olarak tutulur
   * ama miktar değildir: "2019" doğru, "2.019" değil.
   */
  plain?: boolean;
  placeholder?: string;
  /**
   * Filtre arayüzünde kontrol olarak görünür. YALNIZ "select" ve "number"
   * alanlarda kullanılır: serbest metin üzerinde JSONB araması büyük/küçük
   * harfe duyarlı kalıyor ve "renault" yazan "Renault"u bulamıyor. Marka gibi
   * metin alanları zaten ilan başlığında geçtiği için genel arama (q) onları
   * trigram indeksi üzerinden yakalar.
   */
  filterable?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
};

export type CategoryDef = {
  key: CategoryKey;
  label: string;
  /** Kategori içi alt tür — Listing.propertyType kolonuna yazılır */
  subTypes: readonly CategoryOption[];
  /** Emlakta boş: alanlar gerçek kolonlarda tutulur */
  fields: readonly CategoryField[];
  /** Kartta gösterilecek 1-2 özet alanın anahtarı */
  summaryFields: readonly string[];
};

const CURRENT_YEAR = new Date().getFullYear();

const VASITA_FIELDS: readonly CategoryField[] = [
  { key: "marka", label: "Marka", type: "text", required: true, maxLength: 40, placeholder: "Örn. Renault" },
  { key: "model", label: "Model", type: "text", required: true, maxLength: 60, placeholder: "Örn. Clio 1.5 dCi" },
  { key: "yil", label: "Yıl", type: "number", required: true, filterable: true, plain: true, min: 1950, max: CURRENT_YEAR + 1 },
  { key: "kilometre", label: "Kilometre", type: "number", required: true, filterable: true, min: 0, max: 2_000_000, unit: "km" },
  {
    key: "yakit",
    label: "Yakıt",
    type: "select",
    required: true,
    filterable: true,
    options: [
      { value: "benzin", label: "Benzin" },
      { value: "dizel", label: "Dizel" },
      { value: "lpg", label: "Benzin & LPG" },
      { value: "elektrik", label: "Elektrik" },
      { value: "hibrit", label: "Hibrit" },
    ],
  },
  {
    key: "vites",
    label: "Vites",
    type: "select",
    required: true,
    filterable: true,
    options: [
      { value: "manuel", label: "Manuel" },
      { value: "otomatik", label: "Otomatik" },
    ],
  },
  { key: "renk", label: "Renk", type: "text", maxLength: 30, placeholder: "Örn. Beyaz" },
  {
    key: "hasar",
    label: "Hasar durumu",
    type: "select",
    required: true,
    options: [
      { value: "hasarsiz", label: "Hasarsız" },
      { value: "boyali", label: "Boyalı" },
      { value: "degisen", label: "Değişen parçalı" },
      { value: "hasar_kayitli", label: "Hasar kayıtlı" },
    ],
  },
];

const TEKNOLOJI_FIELDS: readonly CategoryField[] = [
  { key: "marka", label: "Marka", type: "text", required: true, maxLength: 40, placeholder: "Örn. Apple" },
  { key: "model", label: "Model", type: "text", required: true, maxLength: 60, placeholder: "Örn. iPhone 14 Pro" },
  {
    key: "durum",
    label: "Durum",
    type: "select",
    required: true,
    filterable: true,
    options: [
      { value: "sifir", label: "Sıfır" },
      { value: "ikinci_el", label: "İkinci el" },
    ],
  },
  {
    key: "garanti",
    label: "Garanti",
    type: "select",
    options: [
      { value: "var", label: "Garantisi var" },
      { value: "yok", label: "Garantisi yok" },
    ],
  },
  {
    key: "kutu",
    label: "Kutu & aksesuar",
    type: "select",
    options: [
      { value: "tam", label: "Kutulu, aksesuarları tam" },
      { value: "eksik", label: "Kutusu yok / aksesuar eksik" },
    ],
  },
];

export const CATEGORIES: Record<CategoryKey, CategoryDef> = {
  emlak: {
    key: "emlak",
    label: "Emlak",
    subTypes: PROPERTY_TYPES,
    fields: [],
    summaryFields: [],
  },
  vasita: {
    key: "vasita",
    label: "Vasıta",
    subTypes: [
      { value: "otomobil", label: "Otomobil" },
      { value: "motosiklet", label: "Motosiklet" },
      { value: "ticari", label: "Ticari Araç" },
      { value: "traktor", label: "Traktör & Tarım" },
    ],
    fields: VASITA_FIELDS,
    summaryFields: ["yil", "kilometre"],
  },
  teknoloji: {
    key: "teknoloji",
    label: "Teknoloji",
    subTypes: [
      { value: "telefon", label: "Telefon" },
      { value: "bilgisayar", label: "Bilgisayar" },
      { value: "tablet", label: "Tablet" },
      { value: "konsol", label: "Oyun Konsolu" },
      { value: "kamera", label: "Fotoğraf & Kamera" },
    ],
    fields: TEKNOLOJI_FIELDS,
    summaryFields: ["durum"],
  },
};

export const CATEGORY_LIST: readonly CategoryDef[] = CATEGORY_KEYS.map((k) => CATEGORIES[k]);

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORY_KEYS.map((k) => [k, CATEGORIES[k].label])
);

export function isCategoryKey(value: unknown): value is CategoryKey {
  return typeof value === "string" && (CATEGORY_KEYS as readonly string[]).includes(value);
}

/** Bilinmeyen değerlerde emlağa düşer — kamu sorgularında hiçbir zaman patlamaz. */
export function toCategoryKey(value: unknown): CategoryKey {
  return isCategoryKey(value) ? value : DEFAULT_CATEGORY;
}

export function getCategory(value: unknown): CategoryDef {
  return CATEGORIES[toCategoryKey(value)];
}

/** Kategori içi alt türün okunabilir etiketi. Bulunamazsa ham değeri döndürür. */
export function getSubTypeLabel(category: unknown, subType: string): string {
  return getCategory(category).subTypes.find((s) => s.value === subType)?.label ?? subType;
}

export function getFilterableFields(category: unknown): readonly CategoryField[] {
  return getCategory(category).fields.filter((f) => f.filterable);
}

// ---------------------------------------------------------------------------
// Doğrulama
// ---------------------------------------------------------------------------

export type AttributeValues = Record<string, string | number>;

export type AttributeParseResult = {
  values: AttributeValues;
  /** Alan anahtarı -> hata mesajı. Boşsa geçerli. */
  errors: Record<string, string>;
};

function readRaw(input: FormData | Record<string, unknown>, key: string): string {
  const raw = input instanceof FormData ? input.get(key) : input[key];
  if (raw === null || raw === undefined) return "";
  return String(raw).trim();
}

/**
 * Kategoriye özel alanları formdan okur, doğrular ve `attributes` içine
 * yazılacak nesneyi üretir. Emlakta her zaman boş nesne döner.
 *
 * Kayıtta TANIMLI OLMAYAN anahtarlar bilerek atılır: forma enjekte edilen
 * fazladan alanlar JSONB'ye sızmaz.
 */
export function parseAttributes(
  category: unknown,
  input: FormData | Record<string, unknown>
): AttributeParseResult {
  const def = getCategory(category);
  const values: AttributeValues = {};
  const errors: Record<string, string> = {};

  for (const field of def.fields) {
    const raw = readRaw(input, `attr_${field.key}`) || readRaw(input, field.key);

    if (!raw) {
      if (field.required) errors[field.key] = `${field.label} zorunludur`;
      continue;
    }

    if (field.type === "number") {
      const n = Number(raw.replace(/[.\s]/g, "").replace(",", "."));
      if (!Number.isFinite(n)) {
        errors[field.key] = `${field.label} sayı olmalıdır`;
        continue;
      }
      if (field.min !== undefined && n < field.min) {
        errors[field.key] = `${field.label} en az ${field.min} olmalıdır`;
        continue;
      }
      if (field.max !== undefined && n > field.max) {
        errors[field.key] = `${field.label} en fazla ${field.max} olabilir`;
        continue;
      }
      values[field.key] = n;
      continue;
    }

    if (field.type === "select") {
      if (!field.options?.some((o) => o.value === raw)) {
        errors[field.key] = `${field.label} için geçersiz seçim`;
        continue;
      }
      values[field.key] = raw;
      continue;
    }

    values[field.key] = field.maxLength ? raw.slice(0, field.maxLength) : raw;
  }

  return { values, errors };
}

// ---------------------------------------------------------------------------
// Gösterim
// ---------------------------------------------------------------------------

/** Sunucu ve istemcide aynı çıktıyı verir — Intl'e bağlı hidrasyon farkı olmaz. */
function groupThousands(n: number): string {
  const [whole, frac] = Math.abs(n).toString().split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${n < 0 ? "-" : ""}${grouped}${frac ? `,${frac}` : ""}`;
}

export function formatAttributeValue(field: CategoryField, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (field.type === "select") {
    return field.options?.find((o) => o.value === value)?.label ?? String(value);
  }
  if (field.type === "number") {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return String(value);
    const text = field.plain ? String(n) : groupThousands(n);
    return field.unit ? `${text} ${field.unit}` : text;
  }
  return String(value);
}

export type DescribedAttribute = { key: string; label: string; value: string };

/** Detay sayfasındaki nitelik tablosu. Boş alanlar atlanır. */
export function describeAttributes(category: unknown, attributes: unknown): DescribedAttribute[] {
  const def = getCategory(category);
  if (!def.fields.length || !attributes || typeof attributes !== "object") return [];
  const bag = attributes as Record<string, unknown>;

  const out: DescribedAttribute[] = [];
  for (const field of def.fields) {
    const value = formatAttributeValue(field, bag[field.key]);
    if (value) out.push({ key: field.key, label: field.label, value });
  }
  return out;
}

/** Kart üzerindeki kısa özet — "2019 · 120.000 km" gibi. */
export function summarizeAttributes(category: unknown, attributes: unknown): string[] {
  const def = getCategory(category);
  if (!def.summaryFields.length || !attributes || typeof attributes !== "object") return [];
  const bag = attributes as Record<string, unknown>;

  const out: string[] = [];
  for (const key of def.summaryFields) {
    const field = def.fields.find((f) => f.key === key);
    if (!field) continue;
    const value = formatAttributeValue(field, bag[key]);
    if (value) out.push(value);
  }
  return out;
}

/**
 * attributes içindeki sayısal alanları sıralanabilir kolonlara kopyalar.
 *
 * Prisma JSON alanına göre orderBy desteklemiyor; "en yeni model" / "en düşük
 * kilometre" sıralaması bu kopyalar olmadan çalışmıyor. Tek doğruluk kaynağı
 * yine attributes — burada yalnız türetiliyor.
 */
export function sortableAttributeColumns(
  attributes: Record<string, string | number> | null | undefined,
): { attrYear: number | null; attrKm: number | null } {
  const read = (key: string) => {
    const raw = attributes?.[key];
    const n = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  };
  return { attrYear: read("yil"), attrKm: read("kilometre") };
}
