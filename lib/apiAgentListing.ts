import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/format";
import { deleteUploadFiles } from "@/lib/uploadDeletion";
import { deleteVideo } from "@/lib/videoStorage";
import { notifyAdmins } from "@/lib/notify";
import { listingAmenityRows } from "@/lib/listingAmenities";
import { listingImportKey } from "@/lib/listingImport";

// Emlakçı ilan oluştur/güncelle — web app/emlakci/panel/actions.ts submitAgentListing'in
// JSON (Bearer) karşılığı. Server action mobilden çağrılamadığı için aynı iş kuralları burada.
// Görseller AYRI uçtan yüklenir; burada yalnız sıralı url dizisi alınır.

export class AgentListingError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function str(v: unknown): string | null {
  const s = v === null || v === undefined ? "" : String(v).trim();
  return s === "" ? null : s;
}
function bool(v: unknown): boolean {
  return v === true || v === "on" || v === "true" || v === "1";
}
function date(v: unknown): Date | null {
  const value = str(v);
  if (!value) return null;
  const parsed = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
// Gövdede anahtar VAR MI? — yoksa alanı hiç yazmayıp mevcut değeri KORURUZ (twin kayması kalkanı).
function has(body: Body, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, key);
}
// Mobil mutlak url göndermiş olabilir → DB'de web ile aynı GÖRELİ yol saklansın.
function toRelative(u: string): string {
  if (/^https?:\/\//i.test(u)) {
    try {
      return new URL(u).pathname;
    } catch {
      return u;
    }
  }
  return u;
}

type Body = Record<string, unknown>;

export async function upsertAgentListing(
  agentId: string,
  id: string | null,
  body: Body,
  options: { notify?: boolean; deleteRemovedImageFiles?: boolean } = {},
): Promise<{ id: string; slug: string }> {
  const owner = await prisma.agent.findUnique({ where: { id: agentId }, select: { agencyId: true } });
  if (!owner) throw new AgentListingError(401, "Yetkisiz");
  // Sahiplik kontrolü EN ÖNCE — başkasının/olmayan ilan için alan validasyonuna
  // girmeden 403 dönsün (400 "alan zorunlu" bilgi sızdırır/yanıltır).
  // Düzenlemede mevcut slug da buradan alınır ve KORUNUR (web panel ile aynı:
  // başlık değişse bile yayınlanmış /ilan/<slug> linki kırılmaz).
  let existingOwned: {
    slug: string;
    title: string;
    price: number;
    propertyType: string;
    areaGross: number | null;
    rooms: string | null;
    zoningStatus: string | null;
  } | null = null;
  if (id) {
    const owned = await prisma.listing.findUnique({
      where: { id },
      select: {
        agentId: true,
        slug: true,
        title: true,
        price: true,
        propertyType: true,
        areaGross: true,
        rooms: true,
        zoningStatus: true,
      },
    });
    if (!owned || owned.agentId !== agentId) throw new AgentListingError(403, "Yetkisiz");
    existingOwned = owned;
  }

  const title = has(body, "title") ? String(body.title ?? "").trim() : existingOwned?.title ?? "";
  const price = has(body, "price") ? num(body.price) ?? 0 : existingOwned?.price ?? 0;
  if (!title || price <= 0) throw new AgentListingError(400, "Başlık ve fiyat zorunludur");

  const ptype = has(body, "propertyType") ? String(body.propertyType || "") : existingOwned?.propertyType ?? "daire";
  const isLand = ptype === "arsa" || ptype === "tarla";
  const areaVal = has(body, "areaGross") ? num(body.areaGross) : existingOwned?.areaGross ?? null;
  const rooms = has(body, "rooms") ? str(body.rooms) : existingOwned?.rooms ?? null;
  const zoningStatus = has(body, "zoningStatus") ? str(body.zoningStatus) : existingOwned?.zoningStatus ?? null;
  if (!areaVal || areaVal <= 0) throw new AgentListingError(400, "Alan (brüt m²) zorunludur");
  if (!isLand && !rooms) throw new AgentListingError(400, "Oda sayısı zorunludur");
  if (isLand && !zoningStatus) throw new AgentListingError(400, "İmar durumu zorunludur");

  // İlan kotası — yalnız YENİ ilanda (ilk paketin listingQuota'sı; tablo yoksa atla).
  if (!id) {
    let quota: number | null = null;
    try {
      const pkg = await prisma.package.findFirst({ orderBy: { createdAt: "asc" }, select: { listingQuota: true } });
      quota = pkg?.listingQuota ?? null;
    } catch {
      quota = null;
    }
    if (quota != null) {
      const count = await prisma.listing.count({ where: { agentId } });
      if (count >= quota) {
        throw new AgentListingError(403, `İlan kotanız dolu (${quota}). Yeni ilan için yönetimle iletişime geçin.`);
      }
    }
  }

  let slug = existingOwned?.slug || str(body.slug) || slugify(title);
  const collide = await prisma.listing.findUnique({ where: { slug } });
  if (collide && collide.id !== id) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  let imageUrls: string[] = [];
  if (Array.isArray(body.images)) {
    imageUrls = (body.images as unknown[]).filter((u): u is string => typeof u === "string").map(toRelative);
  }

  const features = Array.isArray(body.features)
    ? (body.features as unknown[]).map((s) => String(s).trim()).filter(Boolean)
    : String(body.features || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  const amenityKeys = Array.isArray(body.amenities)
    ? (body.amenities as unknown[]).map(String).filter(Boolean)
    : [];
  const amenities = listingAmenityRows(amenityKeys);
  const externalId = has(body, "externalId") ? str(body.externalId) : null;
  const status = ["sold", "passive"].includes(String(body.status)) ? String(body.status) : "active";

  const data = {
    ...(!id || has(body, "title") ? { title } : {}),
    slug,
    ...(!id || has(body, "description") ? { description: String(body.description ?? "").trim() } : {}),
    ...(!id || has(body, "propertyType") ? { propertyType: ptype } : {}),
    ...(!id || has(body, "listingType") ? { listingType: String(body.listingType || "sale") } : {}),
    ...(!id || has(body, "status") ? { status } : {}),
    ...(!id || has(body, "price") ? { price } : {}),
    ...(!id || has(body, "currency") ? { currency: String(body.currency || "TRY") } : {}),
    ...(!id || has(body, "district") ? { district: String(body.district || "Merkez") } : {}),
    ...(has(body, "neighborhood") ? { neighborhood: str(body.neighborhood) } : {}),
    ...(has(body, "address") ? { address: str(body.address) } : {}),
    // Harita konumu: gövdede yoksa DOKUNMA (eski istemci/twin göndermezse null'lamasın).
    ...(has(body, "lat") ? { lat: num(body.lat) } : {}),
    ...(has(body, "lng") ? { lng: num(body.lng) } : {}),
    ...(!id || has(body, "areaGross") ? { areaGross: areaVal } : {}),
    ...(has(body, "areaNet") ? { areaNet: num(body.areaNet) } : {}),
    ...(!id || has(body, "rooms") ? { rooms } : {}),
    ...(has(body, "floor") ? { floor: str(body.floor) } : {}),
    ...(has(body, "totalFloors") ? { totalFloors: num(body.totalFloors) } : {}),
    ...(has(body, "buildingAge") ? { buildingAge: str(body.buildingAge) } : {}),
    ...(has(body, "heating") ? { heating: str(body.heating) } : {}),
    ...(has(body, "furnished") ? { furnished: bool(body.furnished) } : {}),
    ...(has(body, "inSite") ? { inSite: bool(body.inSite) } : {}),
    ...(has(body, "balcony") ? { balcony: bool(body.balcony) } : {}),
    ...(has(body, "parking") ? { parking: bool(body.parking) } : {}),
    ...(has(body, "creditEligible") ? { creditEligible: str(body.creditEligible) } : {}),
    ...(has(body, "usageStatus") ? { usageStatus: str(body.usageStatus) } : {}),
    ...(has(body, "propertyCondition") ? { propertyCondition: str(body.propertyCondition) } : {}),
    ...(has(body, "bathroomCount") ? { bathroomCount: num(body.bathroomCount) } : {}),
    ...(has(body, "dues") ? { dues: num(body.dues) } : {}),
    ...(has(body, "exchangeEligible") ? { exchangeEligible: bool(body.exchangeEligible) } : {}),
    ...(has(body, "deedType") ? { deedType: str(body.deedType) } : {}),
    ...(has(body, "occupancyPermit") ? { occupancyPermit: str(body.occupancyPermit) } : {}),
    ...(has(body, "validUntil") ? { validUntil: date(body.validUntil) } : {}),
    ...(has(body, "deedStatus") ? { deedStatus: str(body.deedStatus) } : {}),
    ...(!id || has(body, "zoningStatus") ? { zoningStatus } : {}),
    ...(has(body, "adaNo") ? { adaNo: str(body.adaNo) } : {}),
    ...(has(body, "parselNo") ? { parselNo: str(body.parselNo) } : {}),
    ...(has(body, "kaks") ? { kaks: str(body.kaks) } : {}),
    ...(has(body, "locationVisibility") ? {
      locationVisibility: ["hidden", "approximate", "exact"].includes(String(body.locationVisibility))
        ? String(body.locationVisibility)
        : "approximate",
    } : {}),
    ...(has(body, "parcelVisibility") ? { parcelVisibility: bool(body.parcelVisibility) } : {}),
    // Medya linkleri: gövdede yoksa DOKUNMA (video/drone/sanal-tur silinmesin).
    ...(has(body, "videoUrl") ? { videoUrl: str(body.videoUrl) } : {}),
    ...(has(body, "droneUrl") ? { droneUrl: str(body.droneUrl) } : {}),
    ...(has(body, "virtualTourUrl") ? { virtualTourUrl: str(body.virtualTourUrl) } : {}),
    ...(has(body, "features") ? { features: features.length ? JSON.stringify(features) : null } : {}),
    moderationStatus: "pending", // her kayıt/güncelleme yeniden admin onayına düşer
    agentId,
    agencyId: owner.agencyId,
    ...(has(body, "externalId") ? {
      externalId,
      importKey: externalId ? listingImportKey(agentId, owner.agencyId, externalId) : null,
    } : {}),
  };

  let listingId: string;
  let oldPrice: number | null = null;
  if (id) {
    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { price: true, videoUrl: true, images: { select: { url: true } } },
    });
    oldPrice = existing?.price ?? null;
    await prisma.listing.update({ where: { id }, data });
    listingId = id;
    if (has(body, "images")) {
      await prisma.listingImage.deleteMany({ where: { listingId: id } });
      const removed = (existing?.images ?? []).map((i) => i.url).filter((u) => !imageUrls.includes(u));
      if (options.deleteRemovedImageFiles !== false) await deleteUploadFiles(removed);
    }
    // Yalnız videoUrl gövdede VARSA ve gerçekten değiştiyse eski videoyu sil (anahtar yoksa koru).
    if (has(body, "videoUrl") && existing?.videoUrl && existing.videoUrl !== str(body.videoUrl)) {
      await deleteVideo(existing.videoUrl);
    }
  } else {
    const created = await prisma.listing.create({
      data: {
        ...data,
        title,
        description: String(body.description ?? "").trim(),
        propertyType: ptype,
        listingType: String(body.listingType || "sale"),
        status,
        price,
        currency: String(body.currency || "TRY"),
        district: String(body.district || "Merkez"),
      },
    });
    listingId = created.id;
  }

  if (oldPrice === null || oldPrice !== price) {
    await prisma.priceHistory.create({ data: { listingId, price } });
  }
  if (has(body, "images") && imageUrls.length) {
    await prisma.listingImage.createMany({ data: imageUrls.map((url, i) => ({ listingId, url, sortOrder: i })) });
  }
  if (has(body, "amenities")) {
    await prisma.listingAmenity.deleteMany({ where: { listingId } });
    if (amenities.length) {
      await prisma.listingAmenity.createMany({
        data: amenities.map((amenity) => ({ ...amenity, listingId })),
      });
    }
  }

  if (options.notify !== false) {
    await notifyAdmins({
      type: "listing_pending",
      title: "Yeni ilan onay bekliyor",
      body: title,
      link: "/admin/onay",
    }).catch(() => {});
  }

  return { id: listingId, slug };
}
