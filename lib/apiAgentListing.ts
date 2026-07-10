import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/format";
import { deleteUploadFiles } from "@/lib/uploads";
import { deleteVideo } from "@/lib/videoStorage";
import { notifyAdmins } from "@/lib/notify";

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
): Promise<{ id: string; slug: string }> {
  // Sahiplik kontrolü EN ÖNCE — başkasının/olmayan ilan için alan validasyonuna
  // girmeden 403 dönsün (400 "alan zorunlu" bilgi sızdırır/yanıltır).
  // Düzenlemede mevcut slug da buradan alınır ve KORUNUR (web panel ile aynı:
  // başlık değişse bile yayınlanmış /ilan/<slug> linki kırılmaz).
  let existingSlug: string | null = null;
  if (id) {
    const owned = await prisma.listing.findUnique({ where: { id }, select: { agentId: true, slug: true } });
    if (!owned || owned.agentId !== agentId) throw new AgentListingError(403, "Yetkisiz");
    existingSlug = owned.slug;
  }

  const title = String(body.title || "").trim();
  const price = num(body.price) ?? 0;
  if (!title || price <= 0) throw new AgentListingError(400, "Başlık ve fiyat zorunludur");

  const ptype = String(body.propertyType || "daire");
  const isLand = ptype === "arsa" || ptype === "tarla";
  const areaVal = num(body.areaGross);
  if (!areaVal || areaVal <= 0) throw new AgentListingError(400, "Alan (brüt m²) zorunludur");
  if (!isLand && !str(body.rooms)) throw new AgentListingError(400, "Oda sayısı zorunludur");
  if (isLand && !str(body.zoningStatus)) throw new AgentListingError(400, "İmar durumu zorunludur");

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

  let slug = existingSlug || str(body.slug) || slugify(title);
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

  const data = {
    title,
    slug,
    description: String(body.description || "").trim(),
    propertyType: ptype,
    listingType: String(body.listingType || "sale"),
    status: String(body.status || "active") === "sold" ? "sold" : "active",
    price,
    currency: String(body.currency || "TRY"),
    district: String(body.district || "Merkez"),
    neighborhood: str(body.neighborhood),
    address: str(body.address),
    // Harita konumu: gövdede yoksa DOKUNMA (eski istemci/twin göndermezse null'lamasın).
    ...(has(body, "lat") ? { lat: num(body.lat) } : {}),
    ...(has(body, "lng") ? { lng: num(body.lng) } : {}),
    areaGross: num(body.areaGross),
    areaNet: num(body.areaNet),
    rooms: str(body.rooms),
    floor: str(body.floor),
    totalFloors: num(body.totalFloors),
    buildingAge: str(body.buildingAge),
    heating: str(body.heating),
    furnished: bool(body.furnished),
    inSite: bool(body.inSite),
    balcony: bool(body.balcony),
    parking: bool(body.parking),
    deedStatus: str(body.deedStatus),
    zoningStatus: str(body.zoningStatus),
    adaNo: str(body.adaNo),
    parselNo: str(body.parselNo),
    kaks: str(body.kaks),
    // Medya linkleri: gövdede yoksa DOKUNMA (video/drone/sanal-tur silinmesin).
    ...(has(body, "videoUrl") ? { videoUrl: str(body.videoUrl) } : {}),
    ...(has(body, "droneUrl") ? { droneUrl: str(body.droneUrl) } : {}),
    ...(has(body, "virtualTourUrl") ? { virtualTourUrl: str(body.virtualTourUrl) } : {}),
    features: features.length ? JSON.stringify(features) : null,
    moderationStatus: "pending", // her kayıt/güncelleme yeniden admin onayına düşer
    agentId,
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
    await prisma.listingImage.deleteMany({ where: { listingId: id } });
    const removed = (existing?.images ?? []).map((i) => i.url).filter((u) => !imageUrls.includes(u));
    await deleteUploadFiles(removed);
    // Yalnız videoUrl gövdede VARSA ve gerçekten değiştiyse eski videoyu sil (anahtar yoksa koru).
    if (has(body, "videoUrl") && existing?.videoUrl && existing.videoUrl !== str(body.videoUrl)) {
      await deleteVideo(existing.videoUrl);
    }
  } else {
    const created = await prisma.listing.create({ data });
    listingId = created.id;
  }

  if (oldPrice === null || oldPrice !== price) {
    await prisma.priceHistory.create({ data: { listingId, price } });
  }
  if (imageUrls.length) {
    await prisma.listingImage.createMany({ data: imageUrls.map((url, i) => ({ listingId, url, sortOrder: i })) });
  }

  await notifyAdmins({
    type: "listing_pending",
    title: "Yeni ilan onay bekliyor",
    body: title,
    link: "/admin/onay",
  }).catch(() => {});

  return { id: listingId, slug };
}
