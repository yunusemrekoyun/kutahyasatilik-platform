"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireApprovedAgent } from "@/lib/agentAuth";
import { slugify } from "@/lib/format";
import { deleteUploadFiles } from "@/lib/uploads";
import { deleteVideo } from "@/lib/videoStorage";
import { notifyAdmins } from "@/lib/notify";

function num(v: FormDataEntryValue | null): number | null {
  if (v === null || v === "") return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  // PostgreSQL Int (32-bit) taşmasını önle: aralık dışı → null (P2020 ValueOutOfRange crash).
  return Number.isFinite(n) && Math.abs(n) <= 2_147_483_647 ? n : null;
}
function str(v: FormDataEntryValue | null): string | null {
  const s = v === null ? "" : String(v).trim();
  return s === "" ? null : s;
}
function bool(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true" || v === "1";
}

// Emlakçı ilan ekler/günceller — ilan her zaman "beklemede" durumuna düşer ve
// admin onayına gider. featured / yatırım puanı / SEO gibi alanlar admin tekelindedir.
export async function submitAgentListing(formData: FormData) {
  const agent = await requireApprovedAgent();

  const id = str(formData.get("id"));
  const title = String(formData.get("title") || "").trim();
  const price = num(formData.get("price")) ?? 0;
  if (!title || price <= 0) {
    throw new Error("Başlık ve fiyat zorunludur");
  }

  // Filtre sistemini besleyen zorunlu alanlar
  const ptype = String(formData.get("propertyType") || "daire");
  const isLand = ptype === "arsa" || ptype === "tarla";
  const areaVal = num(formData.get("areaGross"));
  if (!areaVal || areaVal <= 0) throw new Error("Alan (brüt m²) zorunludur");
  if (!isLand && !str(formData.get("rooms"))) throw new Error("Oda sayısı zorunludur");
  if (isLand && !str(formData.get("zoningStatus"))) throw new Error("İmar durumu zorunludur");

  // İlan kotası (§5/§26): YENİ ilan oluştururken tek paketin listingQuota'sını aşma.
  if (!id) {
    let quota: number | null = null;
    try {
      const pkg = await prisma.package.findFirst({ orderBy: { createdAt: "asc" }, select: { listingQuota: true } });
      quota = pkg?.listingQuota ?? null;
    } catch {
      quota = null; // paket tablosu yoksa kotayı atla (kademeli)
    }
    if (quota != null) {
      const count = await prisma.listing.count({ where: { agentId: agent.id } });
      if (count >= quota) {
        throw new Error(`İlan kotanız dolu (${quota}). Yeni ilan için yönetimle iletişime geçin.`);
      }
    }
  }

  // Düzenleme ise: yalnızca kendi ilanı (+ mevcut slug'ı al)
  let existingSlug: string | null = null;
  if (id) {
    const owned = await prisma.listing.findUnique({
      where: { id },
      select: { agentId: true, slug: true },
    });
    if (!owned || owned.agentId !== agent.id) throw new Error("Yetkisiz");
    existingSlug = owned.slug;
  }

  // Slug: düzenlemede mevcut slug KORUNUR (kalıcı link/SEO kırılmasın; admin formu da korur).
  // Yeni ilanda başlıktan üretilir.
  let slug = existingSlug || str(formData.get("slug")) || slugify(title);
  const existing = await prisma.listing.findUnique({ where: { slug } });
  if (existing && existing.id !== id) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  let imageUrls: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("imagesJson") || "[]"));
    if (Array.isArray(parsed)) imageUrls = parsed.filter((u) => typeof u === "string");
  } catch {
    /* yoksay */
  }

  const featuresRaw = String(formData.get("features") || "");
  const features = featuresRaw.split(",").map((s) => s.trim()).filter(Boolean);

  const data = {
    title,
    slug,
    description: String(formData.get("description") || "").trim(),
    propertyType: String(formData.get("propertyType") || "daire"),
    listingType: String(formData.get("listingType") || "sale"),
    status: String(formData.get("status") || "active") === "sold" ? "sold" : "active",
    price,
    currency: String(formData.get("currency") || "TRY"),
    district: String(formData.get("district") || "Merkez"),
    neighborhood: str(formData.get("neighborhood")),
    address: str(formData.get("address")),
    lat: num(formData.get("lat")),
    lng: num(formData.get("lng")),
    areaGross: num(formData.get("areaGross")),
    areaNet: num(formData.get("areaNet")),
    rooms: str(formData.get("rooms")),
    floor: str(formData.get("floor")),
    totalFloors: num(formData.get("totalFloors")),
    buildingAge: str(formData.get("buildingAge")),
    heating: str(formData.get("heating")),
    furnished: bool(formData.get("furnished")),
    inSite: bool(formData.get("inSite")),
    balcony: bool(formData.get("balcony")),
    parking: bool(formData.get("parking")),
    deedStatus: str(formData.get("deedStatus")),
    zoningStatus: str(formData.get("zoningStatus")),
    adaNo: str(formData.get("adaNo")),
    parselNo: str(formData.get("parselNo")),
    kaks: str(formData.get("kaks")),
    videoUrl: str(formData.get("videoUrl")),
    droneUrl: str(formData.get("droneUrl")),
    virtualTourUrl: str(formData.get("virtualTourUrl")),
    features: features.length ? JSON.stringify(features) : null,
    // Emlakçı ilanı: her kayıt/güncellemede yeniden onaya düşer
    moderationStatus: "pending",
    agentId: agent.id,
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
    const removed = (existing?.images ?? [])
      .map((i) => i.url)
      .filter((u) => !imageUrls.includes(u));
    await deleteUploadFiles(removed);
    // video değiştiyse/kaldırıldıysa eski yerel videoyu (mp4+poster) diskten sil
    if (existing?.videoUrl && existing.videoUrl !== data.videoUrl) {
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
    await prisma.listingImage.createMany({
      data: imageUrls.map((url, i) => ({ listingId, url, sortOrder: i })),
    });
  }

  await notifyAdmins({
    type: "listing_pending",
    title: "Yeni ilan onay bekliyor",
    body: title,
    link: "/admin/onay",
  });
  revalidatePath("/emlakci/panel");
  redirect("/emlakci/panel");
}

// Portföy fırsatına komisyon teklifi ver/güncelle (§8).
export async function submitBid(formData: FormData) {
  const agent = await requireApprovedAgent();
  const opportunityId = String(formData.get("opportunityId") || "");
  const commissionPct = num(formData.get("commissionPct"));
  if (!opportunityId) throw new Error("Fırsat gerekli");
  if (commissionPct === null || commissionPct < 0 || commissionPct > 100) {
    throw new Error("Geçerli bir komisyon yüzdesi girin (0–100)");
  }
  const opp = await prisma.portfolioOpportunity.findUnique({
    where: { id: opportunityId },
    select: { status: true, biddingEndsAt: true, title: true },
  });
  if (!opp || opp.status !== "open") throw new Error("Bu fırsat tekliflere kapalı");
  if (opp.biddingEndsAt && opp.biddingEndsAt < new Date()) throw new Error("Teklif süresi doldu");

  await prisma.bid.upsert({
    where: { opportunityId_agentId: { opportunityId, agentId: agent.id } },
    create: { opportunityId, agentId: agent.id, commissionPct, note: str(formData.get("note")) },
    update: { commissionPct, note: str(formData.get("note")), status: "active" },
  });
  await notifyAdmins({
    type: "system",
    title: "Portföy fırsatına yeni teklif",
    body: `${agent.name} · %${commissionPct} — ${opp.title}`,
    link: "/admin/firsatlar",
  });
  revalidatePath("/emlakci/panel/firsatlar");
}

export async function deleteAgentListing(formData: FormData) {
  const agent = await requireApprovedAgent();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const owned = await prisma.listing.findUnique({
    where: { id },
    select: { agentId: true, videoUrl: true, images: { select: { url: true } } },
  });
  if (!owned || owned.agentId !== agent.id) throw new Error("Yetkisiz");
  await prisma.listing.delete({ where: { id } });
  await deleteUploadFiles(owned.images.map((i) => i.url));
  await deleteVideo(owned.videoUrl);
  revalidatePath("/emlakci/panel");
  revalidatePath("/");
}

export async function updateAgentProfile(formData: FormData) {
  const agent = await requireApprovedAgent();
  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      name: String(formData.get("name") || agent.name).trim(),
      phone: str(formData.get("phone")),
      title: str(formData.get("title")),
      agency: str(formData.get("agency")),
      logo: str(formData.get("logo")),
    },
  });
  revalidatePath("/emlakci/panel");
}

// Emlakçı, YALNIZ kendi ilanına gelen talebin durumunu 4 aşamada ilerletir.
export async function updateAgentLeadStatus(formData: FormData) {
  const agent = await requireApprovedAgent();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  const allowed = ["received", "reviewing", "contacted", "resolved"];
  if (!id || !allowed.includes(status)) return;
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { listing: { select: { agentId: true } } },
  });
  if (!lead || lead.listing?.agentId !== agent.id) return; // sahiplik kontrolü
  await prisma.lead.update({ where: { id }, data: { status } });
  revalidatePath("/emlakci/panel/talepler");
}
