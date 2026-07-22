import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAgent } from "@/lib/apiAgent";
import { AgentListingError, upsertAgentListing } from "@/lib/apiAgentListing";
import { CsvError, parseCsv } from "@/lib/csv";
import { DISTRICTS, PROPERTY_TYPES } from "@/lib/constants";
import { LISTING_AMENITIES } from "@/lib/listingAmenities";
import { notifyAdmins } from "@/lib/notify";
import { listingImportKey, parseListingImportRow } from "@/lib/listingImport";
import { revalidatePath, revalidateTag } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ImportBody = { csv?: unknown; commit?: unknown };
type PreviewRow = { row: number; externalId: string; title: string; status: "valid" | "update" | "invalid"; errors: string[] };

type ListingInput = Record<string, unknown>;
type ExistingListing = {
  id: string;
  agentId: string | null;
  title: string;
  propertyType: string;
  listingType: string;
  status: string;
  price: number;
  currency: string;
  district: string;
  areaGross: number | null;
  rooms: string | null;
  zoningStatus: string | null;
  locationVisibility: string;
};

const existingSelect = {
  id: true,
  agentId: true,
  title: true,
  propertyType: true,
  listingType: true,
  status: true,
  price: true,
  currency: true,
  district: true,
  areaGross: true,
  rooms: true,
  zoningStatus: true,
  locationVisibility: true,
} as const;

function listValue(value: string) {
  return value.split(/[|;]/).map((item) => item.trim()).filter(Boolean);
}

function safeImages(value: string) {
  return listValue(value).filter((item) => {
    if (item.startsWith("/uploads/")) {
      return !item.includes("..") && /^\/uploads\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(item);
    }
    if (!process.env.NEXT_PUBLIC_MEDIA_URL) return false;
    try {
      const base = new URL(process.env.NEXT_PUBLIC_MEDIA_URL);
      const candidate = new URL(item);
      return (
        candidate.protocol === "https:" &&
        !candidate.username &&
        !candidate.password &&
        candidate.origin === base.origin
      );
    } catch {
      return false;
    }
  });
}

function effective<T>(input: ListingInput, key: string, existing: T | null | undefined, fallback: T): T {
  return Object.prototype.hasOwnProperty.call(input, key) ? input[key] as T : existing ?? fallback;
}

function validationErrors(input: ListingInput, existing: ExistingListing | null, parseErrors: string[]) {
  const errors = [...parseErrors];
  const propertyTypes = new Set(PROPERTY_TYPES.map((item) => item.value));
  const districts = new Set(DISTRICTS.map((item) => item.name));
  const amenities = new Set(LISTING_AMENITIES.map((item) => item.key));

  const externalId = String(input.externalId ?? "");
  const title = effective(input, "title", existing?.title, "");
  const propertyType = effective(input, "propertyType", existing?.propertyType, "");
  const listingType = effective(input, "listingType", existing?.listingType, "sale");
  const price = effective(input, "price", existing?.price, 0);
  const currency = effective(input, "currency", existing?.currency, "TRY");
  const district = effective(input, "district", existing?.district, "");
  const areaGross = effective(input, "areaGross", existing?.areaGross, null);
  const rooms = effective(input, "rooms", existing?.rooms, null);
  const zoningStatus = effective(input, "zoningStatus", existing?.zoningStatus, null);
  const locationVisibility = effective(input, "locationVisibility", existing?.locationVisibility, "approximate");

  if (!externalId || externalId.length > 100) errors.push("externalId zorunludur ve 100 karakteri aşamaz");
  if (!title) errors.push("title zorunludur");
  if (!propertyTypes.has(propertyType)) errors.push("propertyType geçersiz");
  if (!["sale", "rent"].includes(listingType)) errors.push("listingType sale veya rent olmalıdır");
  if (!price || price <= 0) errors.push("price pozitif olmalıdır");
  if (!["TRY", "USD", "EUR"].includes(currency)) errors.push("currency geçersiz");
  if (!districts.has(district)) errors.push("district geçersiz");
  if (!areaGross || areaGross <= 0) errors.push("areaGross pozitif olmalıdır");
  const isLand = propertyType === "arsa" || propertyType === "tarla";
  if (!isLand && !rooms) errors.push("konut ve işyeri için rooms zorunludur");
  if (isLand && !zoningStatus) errors.push("arsa ve tarla için zoningStatus zorunludur");
  if (!["hidden", "approximate", "exact"].includes(locationVisibility)) errors.push("locationVisibility geçersiz");
  if (typeof input.areaNet === "number" && input.areaNet <= 0) errors.push("areaNet pozitif olmalıdır");
  if (typeof input.totalFloors === "number" && input.totalFloors <= 0) errors.push("totalFloors pozitif olmalıdır");
  if (typeof input.bathroomCount === "number" && input.bathroomCount < 0) errors.push("bathroomCount negatif olamaz");
  if (typeof input.dues === "number" && input.dues < 0) errors.push("dues negatif olamaz");
  const importedAmenities = Array.isArray(input.amenities) ? input.amenities.map(String) : [];
  const unknownAmenities = importedAmenities.filter((item) => !amenities.has(item));
  if (unknownAmenities.length) errors.push(`bilinmeyen amenities: ${unknownAmenities.join(", ")}`);
  return errors;
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

async function findScopedExisting(agentId: string, agencyId: string | null, externalId: string): Promise<ExistingListing | null> {
  if (!externalId) return null;
  const importKey = listingImportKey(agentId, agencyId, externalId);
  if (importKey) {
    const imported = await prisma.listing.findUnique({ where: { importKey }, select: existingSelect });
    if (imported) return imported;
  }
  if (agencyId) {
    const agencyListing = await prisma.listing.findUnique({
      where: { agencyId_externalId: { agencyId, externalId } },
      select: existingSelect,
    });
    if (agencyListing) return agencyListing;
    // Listings created before the adviser was linked to an Agency still have
    // agencyId=NULL. Reuse the adviser's own legacy row and let the shared
    // upsert attach it to the current agency instead of creating a duplicate.
    return prisma.listing.findFirst({
      where: { agentId, externalId },
      orderBy: { createdAt: "asc" },
      select: existingSelect,
    });
  }
  return prisma.listing.findFirst({
    where: { agentId, agencyId: null, externalId },
    orderBy: { createdAt: "asc" },
    select: existingSelect,
  });
}

export async function POST(req: NextRequest) {
  const auth = await resolveApiAgent(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  const body = (await req.json().catch(() => null)) as ImportBody | null;
  const csv = typeof body?.csv === "string" ? body.csv : "";
  const commit = body?.commit === true;
  if (!csv || Buffer.byteLength(csv, "utf8") > 2_000_000) {
    return NextResponse.json({ ok: false, error: "CSV boş veya 2 MB sınırını aşıyor" }, { status: 400 });
  }

  let records: Record<string, string>[];
  try {
    records = parseCsv(csv);
  } catch (error) {
    const message = error instanceof CsvError ? error.message : "CSV okunamadı";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
  if (records.length > 250) {
    return NextResponse.json({ ok: false, error: "Tek aktarımda en fazla 250 ilan kabul edilir" }, { status: 400 });
  }

  const owner = await prisma.agent.findUnique({ where: { id: auth.agent.id }, select: { agencyId: true } });
  if (!owner) return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  const seen = new Set<string>();
  const prepared: Array<{ raw: ListingInput; existingId: string | null; preview: PreviewRow }> = [];

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const parsed = parseListingImportRow(record, safeImages);
    const raw = parsed.input;
    const externalId = String(raw.externalId ?? "");
    const existing = await findScopedExisting(auth.agent.id, owner.agencyId, externalId);
    const errors = validationErrors(raw, existing, parsed.errors);
    if (seen.has(externalId)) errors.push("aynı CSV içinde externalId tekrar ediyor");
    if (externalId) seen.add(externalId);
    if (existing && existing.agentId !== auth.agent.id) errors.push("externalId aynı firmadaki başka bir danışmana ait");
    prepared.push({
      raw,
      existingId: existing?.id ?? null,
      preview: {
        row: index + 2,
        externalId,
        title: effective(raw, "title", existing?.title, ""),
        status: errors.length ? "invalid" : existing ? "update" : "valid",
        errors,
      },
    });
  }

  const invalid = prepared.filter((item) => item.preview.status === "invalid");
  if (!commit || invalid.length) {
    return NextResponse.json({
      ok: invalid.length === 0,
      preview: true,
      total: prepared.length,
      valid: prepared.length - invalid.length,
      invalid: invalid.length,
      rows: prepared.map((item) => item.preview),
    }, { status: invalid.length && commit ? 422 : 200 });
  }

  const results: PreviewRow[] = [];
  for (const item of prepared) {
    try {
      await upsertAgentListing(auth.agent.id, item.existingId, item.raw, {
        notify: false,
        deleteRemovedImageFiles: false,
      });
      results.push(item.preview);
    } catch (error) {
      // Two simultaneous previews can both observe a missing row. The
      // database importKey is authoritative; after its unique conflict, retry
      // as an update only when the winning row belongs to this adviser.
      if (!item.existingId && isUniqueConstraintError(error)) {
        const externalId = String(item.raw.externalId ?? "");
        const winner = await findScopedExisting(auth.agent.id, owner.agencyId, externalId);
        if (winner?.agentId === auth.agent.id) {
          try {
            await upsertAgentListing(auth.agent.id, winner.id, item.raw, {
              notify: false,
              deleteRemovedImageFiles: false,
            });
            results.push({ ...item.preview, status: "update" });
            continue;
          } catch (retryError) {
            error = retryError;
          }
        } else if (winner) {
          error = new AgentListingError(409, "externalId aynı firmadaki başka bir danışmana ait");
        }
      }
      results.push({
        ...item.preview,
        status: "invalid",
        errors: [error instanceof AgentListingError ? error.message : "İlan kaydedilemedi"],
      });
    }
  }
  const saved = results.filter((item) => item.status !== "invalid").length;
  await notifyAdmins({
    type: "listing_pending",
    title: "Toplu ilan aktarımı onay bekliyor",
    body: `${auth.agent.name} tarafından ${saved} ilan aktarıldı.`,
    link: "/admin/onay",
  }).catch(() => {});
  revalidateTag("marketplace-stats", { expire: 0 });
  revalidatePath("/emlak-ofisleri");
  revalidatePath("/danismanlar");

  return NextResponse.json({
    ok: results.every((item) => item.status !== "invalid"),
    preview: false,
    total: results.length,
    saved,
    failed: results.filter((item) => item.status === "invalid").length,
    rows: results,
  });
}
