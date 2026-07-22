export const LISTING_IMPORT_HEADERS = [
  "externalId", "title", "description", "propertyType", "listingType", "status", "price", "currency",
  "district", "neighborhood", "address", "areaGross", "areaNet", "rooms", "floor", "totalFloors",
  "buildingAge", "heating", "furnished", "inSite", "balcony", "parking", "creditEligible", "usageStatus", "propertyCondition", "bathroomCount",
  "dues", "exchangeEligible", "deedStatus", "deedType", "zoningStatus", "adaNo", "parselNo",
  "kaks", "occupancyPermit", "validUntil", "locationVisibility", "parcelVisibility", "features",
  "amenities", "images",
] as const;

type ImportInput = Record<string, unknown>;

const INTEGER_FIELDS = new Set([
  "price",
  "areaGross",
  "areaNet",
  "totalFloors",
  "bathroomCount",
  "dues",
]);

const BOOLEAN_FIELDS = new Set([
  "furnished",
  "inSite",
  "balcony",
  "parking",
  "exchangeEligible",
  "parcelVisibility",
]);

const LIST_FIELDS = new Set([
  "features",
  "amenities",
]);

const LOWERCASE_FIELDS = new Set([
  "propertyType",
  "listingType",
  "status",
  "creditEligible",
  "usageStatus",
  "propertyCondition",
  "deedType",
  "occupancyPermit",
  "locationVisibility",
]);

const ENUM_VALUES: Record<string, ReadonlySet<string>> = {
  listingType: new Set(["sale", "rent"]),
  status: new Set(["active", "sold", "passive"]),
  currency: new Set(["TRY", "USD", "EUR"]),
  creditEligible: new Set(["yes", "no", "unknown"]),
  usageStatus: new Set(["vacant", "tenant", "owner"]),
  propertyCondition: new Set(["new", "resale", "under_construction"]),
  deedType: new Set(["kat_mulkiyeti", "kat_irtifaki", "arsa_tapulu", "mustakil_tapu", "hisseli_tapu"]),
  occupancyPermit: new Set(["available", "unavailable", "pending"]),
  locationVisibility: new Set(["hidden", "approximate", "exact"]),
};

const TRUE_VALUES = new Set(["1", "true", "evet", "yes", "x"]);
const FALSE_VALUES = new Set(["0", "false", "hayır", "hayir", "no"]);
const POSTGRES_INT_MIN = -2_147_483_648;
const POSTGRES_INT_MAX = 2_147_483_647;

function listValue(value: string) {
  return value.split(/[|;]/).map((item) => item.trim()).filter(Boolean);
}

function integerValue(field: string, value: string, errors: string[]) {
  const normalized = value.replace(/\s/g, "");
  if (!/^-?\d+$/.test(normalized)) {
    errors.push(`${field} tam sayı olmalıdır`);
    return undefined;
  }
  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed < POSTGRES_INT_MIN || parsed > POSTGRES_INT_MAX) {
    errors.push(`${field} 32 bit tam sayı aralığında olmalıdır`);
    return undefined;
  }
  return parsed;
}

function booleanValue(field: string, value: string, errors: string[]) {
  const normalized = value.toLocaleLowerCase("tr-TR");
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  errors.push(`${field} için true/false, evet/hayır veya 1/0 kullanın`);
  return undefined;
}

function dateValue(field: string, value: string, errors: string[]) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    errors.push(`${field} YYYY-AA-GG biçiminde olmalıdır`);
    return undefined;
  }
  const parsed = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    errors.push(`${field} geçerli bir tarih olmalıdır`);
    return undefined;
  }
  return value;
}

export function listingImportKey(agentId: string, agencyId: string | null, externalId: string) {
  const normalizedExternalId = externalId.trim();
  if (!normalizedExternalId) return null;
  return agencyId
    ? `agency:${agencyId}:${normalizedExternalId}`
    : `agent:${agentId}:${normalizedExternalId}`;
}

export function parseListingImportRow(
  row: Record<string, string>,
  sanitizeImages: (value: string) => string[],
): { input: ImportInput; errors: string[] } {
  const input: ImportInput = {};
  const errors: string[] = [];

  for (const field of LISTING_IMPORT_HEADERS) {
    const value = row[field]?.trim() ?? "";
    // Empty CSV cells deliberately mean "leave unchanged". This makes an
    // update a patch, while create validation below still enforces essentials.
    if (!value) continue;

    if (INTEGER_FIELDS.has(field)) {
      const parsed = integerValue(field, value, errors);
      if (parsed !== undefined) input[field] = parsed;
      continue;
    }
    if (BOOLEAN_FIELDS.has(field)) {
      const parsed = booleanValue(field, value, errors);
      if (parsed !== undefined) input[field] = parsed;
      continue;
    }
    if (field === "validUntil") {
      const parsed = dateValue(field, value, errors);
      if (parsed !== undefined) input[field] = parsed;
      continue;
    }
    if (field === "images") {
      const requested = listValue(value);
      const safe = sanitizeImages(value);
      if (requested.length !== safe.length) {
        errors.push("images yalnız /uploads yolu veya izin verilen HTTPS medya adresi içerebilir");
      } else {
        input.images = safe;
      }
      continue;
    }
    if (LIST_FIELDS.has(field)) {
      input[field] = listValue(value);
      continue;
    }

    const normalized = field === "currency"
      ? value.toUpperCase()
      : LOWERCASE_FIELDS.has(field)
        ? value.toLocaleLowerCase("tr-TR")
        : value;
    const allowed = ENUM_VALUES[field];
    if (allowed && !allowed.has(normalized)) {
      errors.push(`${field} geçersiz`);
      continue;
    }
    input[field] = normalized;
  }

  return { input, errors };
}
