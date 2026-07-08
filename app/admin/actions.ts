"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { slugify, parseJsonArray } from "@/lib/format";
import { sanitizeCmsHtml } from "@/lib/sanitize";
import { deleteUploadFiles } from "@/lib/uploads";
import { deleteVideo } from "@/lib/videoStorage";
import { notifyAgent, notifyUser, notifyMatchingAlerts } from "@/lib/notify";
import { sendEmail, notificationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

async function ensureAuth() {
  const session = await getSession();
  if (!session) throw new Error("Yetkisiz");
  return session;
}

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

// İlan değişikliğinde etkilenen kamu (ISR) sayfalarını anında tazele.
function revalidateListingSurfaces(slug?: string) {
  revalidatePath("/");
  revalidatePath("/ilanlar");
  revalidatePath("/harita");
  revalidatePath("/kutahya-satilik-daire");
  revalidatePath("/kutahya-satilik-arsa");
  revalidatePath("/kutahya-satilik-villa");
  revalidatePath("/kutahya-yatirimlik-arsa");
  if (slug) revalidatePath(`/ilan/${slug}`);
}

export async function saveListing(formData: FormData) {
  await ensureAuth();

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

  // slug
  let slug = str(formData.get("slug")) || slugify(title);
  const existing = await prisma.listing.findUnique({ where: { slug } });
  if (existing && existing.id !== id) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  // görseller (JSON array of urls)
  let imageUrls: string[] = [];
  try {
    const raw = String(formData.get("imagesJson") || "[]");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) imageUrls = parsed.filter((u) => typeof u === "string");
  } catch {
    /* yoksay */
  }

  // özellikler (virgülle ayrılmış)
  const featuresRaw = String(formData.get("features") || "");
  const features = featuresRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const data = {
    title,
    slug,
    description: String(formData.get("description") || "").trim(),
    propertyType: String(formData.get("propertyType") || "daire"),
    listingType: String(formData.get("listingType") || "sale"),
    status: String(formData.get("status") || "active"),
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
    featured: bool(formData.get("featured")),
    verified: bool(formData.get("verified")),
    investmentScore: num(formData.get("investmentScore")),
    valueGrowthPct: num(formData.get("valueGrowthPct")),
    features: features.length ? JSON.stringify(features) : null,
    metaTitle: str(formData.get("metaTitle")),
    metaDescription: str(formData.get("metaDescription")),
  };

  let listingId: string;
  let oldPrice: number | null = null;
  if (id) {
    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { price: true, videoUrl: true, status: true, moderationStatus: true, images: { select: { url: true } } },
    });
    oldPrice = existing?.price ?? null;
    await prisma.listing.update({ where: { id }, data });
    listingId = id;
    // görselleri tazele; artık kullanılmayan dosyaları diskten sil
    await prisma.listingImage.deleteMany({ where: { listingId: id } });
    const removed = (existing?.images ?? [])
      .map((i) => i.url)
      .filter((u) => !imageUrls.includes(u));
    await deleteUploadFiles(removed);
    // video değiştiyse/kaldırıldıysa eski yerel videoyu (mp4+poster) diskten sil
    if (existing?.videoUrl && existing.videoUrl !== data.videoUrl) {
      await deleteVideo(existing.videoUrl);
    }
    // passive/sold → active geçişi de (onaylı ilan) eşleşen aramalara bildirilsin.
    if (data.status === "active" && existing?.status !== "active" && existing?.moderationStatus === "approved") {
      await notifyMatchingAlerts({ ...data, slug });
    }
  } else {
    const created = await prisma.listing.create({ data });
    listingId = created.id;
    // Yeni admin ilanı aktif olarak yayınlanıyorsa (admin ilanları otomatik onaylı)
    // eşleşen aktif kayıtlı aramalara haber ver.
    if (data.status === "active") {
      await notifyMatchingAlerts(data);
    }
  }

  // Fiyat geçmişi: yeni ilanda ilk kayıt, düzenlemede fiyat değiştiyse kayıt
  if (oldPrice === null || oldPrice !== price) {
    await prisma.priceHistory.create({ data: { listingId, price } });
  }

  if (imageUrls.length) {
    await prisma.listingImage.createMany({
      data: imageUrls.map((url, i) => ({ listingId, url, sortOrder: i })),
    });
  }

  revalidatePath("/admin/ilanlar");
  revalidateListingSurfaces(slug);
  redirect("/admin/ilanlar");
}

export async function deleteListing(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  if (id) {
    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { slug: true, videoUrl: true, images: { select: { url: true } } },
    });
    await prisma.listing.delete({ where: { id } });
    await deleteUploadFiles(existing?.images.map((i) => i.url) ?? []);
    await deleteVideo(existing?.videoUrl);
    revalidatePath("/admin/ilanlar");
    revalidateListingSurfaces(existing?.slug);
  }
}

export async function updateLeadStatus(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "new");
  if (id) {
    await prisma.lead.update({ where: { id }, data: { status } });
    revalidatePath("/admin/talepler");
  }
}

export async function deleteLead(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  if (id) {
    await prisma.lead.delete({ where: { id } });
    revalidatePath("/admin/talepler");
  }
}

// --- Emlakçı (danışman) onay yönetimi ---

export async function approveAgent(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.agent.update({
    where: { id },
    data: { status: "approved", approvedAt: new Date(), note: null },
  });
  await notifyAgent(id, {
    type: "system",
    title: "Başvurunuz onaylandı",
    body: "Danışman hesabınız aktif. Giriş yapıp ilan ekleyebilirsiniz.",
    link: "/emlakci/panel",
  });
  revalidatePath("/admin/emlakcilar");
}

export async function rejectAgent(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  const note = str(formData.get("note"));
  if (!id) return;
  await prisma.agent.update({
    where: { id },
    data: { status: "rejected", note },
  });
  revalidatePath("/admin/emlakcilar");
}

export async function suspendAgent(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.agent.update({ where: { id }, data: { status: "suspended" } });
  revalidatePath("/admin/emlakcilar");
}

export async function deleteAgent(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  if (!id) return;
  // İlanların emlakçı bağı kopar (onDelete: SetNull); ilanlar admin'e devrolur.
  await prisma.agent.delete({ where: { id } });
  revalidatePath("/admin/emlakcilar");
}

// --- İlan yayın onayı (emlakçı ilanları) ---

export async function approveListing(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const updated = await prisma.listing.update({
    where: { id },
    data: { moderationStatus: "approved", note: null },
    select: {
      slug: true, agentId: true, title: true, status: true,
      propertyType: true, listingType: true, district: true, price: true, areaGross: true, rooms: true,
    },
  });
  if (updated.agentId) {
    await notifyAgent(updated.agentId, {
      type: "listing_approved",
      title: "İlanınız onaylandı",
      body: updated.title,
      link: "/emlakci/panel",
    });
  }
  // Onaylanan ilan artık herkese açık → eşleşen aktif kayıtlı aramalara haber ver.
  if (updated.status === "active") {
    await notifyMatchingAlerts(updated);
  }
  revalidatePath("/admin/onay");
  revalidatePath("/admin/ilanlar");
  revalidateListingSurfaces(updated.slug);
}

export async function rejectListing(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  const note = str(formData.get("note"));
  if (!id) return;
  const updated = await prisma.listing.update({
    where: { id },
    data: { moderationStatus: "rejected", note },
    select: { slug: true, agentId: true, title: true },
  });
  if (updated.agentId) {
    await notifyAgent(updated.agentId, {
      type: "listing_rejected",
      title: "İlanınız reddedildi",
      body: note ? `${updated.title} — ${note}` : updated.title,
      link: "/emlakci/panel",
    });
  }
  revalidatePath("/admin/onay");
  revalidatePath("/admin/ilanlar");
  revalidateListingSurfaces(updated.slug);
}

// --- Paket (§5): tek paket; admin düzenler, yeni paket oluşturmaz ---
export async function savePackage(formData: FormData) {
  await ensureAuth();
  const id = str(formData.get("id"));
  const featuresArr = String(formData.get("features") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const data = {
    name: String(formData.get("name") || "").trim() || "Kurumsal Emlakçı Paketi",
    description: str(formData.get("description")),
    price: num(formData.get("price")) ?? 0,
    interval: String(formData.get("interval") || "monthly"),
    listingQuota: num(formData.get("listingQuota")),
    featuredQuota: num(formData.get("featuredQuota")),
    features: featuresArr.length ? JSON.stringify(featuresArr) : null,
    active: bool(formData.get("active")),
  };
  if (id) await prisma.package.update({ where: { id }, data });
  else await prisma.package.create({ data });
  revalidatePath("/admin/paket");
  redirect("/admin/paket");
}

// --- Tahsilat (§6): manuel ödeme defteri ---
export async function savePayment(formData: FormData) {
  await ensureAuth();
  const agentId = str(formData.get("agentId"));
  if (!agentId) throw new Error("Emlakçı seçilmeli");
  const status = String(formData.get("status") || "pending");
  await prisma.payment.create({
    data: {
      agentId,
      amount: num(formData.get("amount")) ?? 0,
      period: str(formData.get("period")),
      method: str(formData.get("method")),
      purpose: String(formData.get("purpose") || "package"),
      status,
      paidAt: status === "paid" ? new Date() : null,
      note: str(formData.get("note")),
    },
  });
  revalidatePath("/admin/tahsilat");
  redirect("/admin/tahsilat");
}

export async function updatePaymentStatus(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "pending");
  if (!id) return;
  const payment = await prisma.payment.update({
    where: { id },
    data: { status, paidAt: status === "paid" ? new Date() : null },
    select: { agentId: true, period: true },
  });
  const periodPrefix = payment.period ? `${payment.period} — ` : "";
  if (status === "paid") {
    await notifyAgent(payment.agentId, { type: "payment", title: "Ödemeniz onaylandı", body: `${periodPrefix}ödemeniz alındı.`, link: "/emlakci/panel" });
  } else if (status === "overdue") {
    await notifyAgent(payment.agentId, { type: "payment", title: "Ödeme gecikti", body: `${periodPrefix}ödemeniz bekleniyor.`, link: "/emlakci/panel" });
  }
  revalidatePath("/admin/tahsilat");
}

export async function deletePayment(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.payment.delete({ where: { id } });
  revalidatePath("/admin/tahsilat");
}

// --- Emlakçı başvuruları (§4) ---
export async function updateApplicationStatus(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "applied");
  const adminNote = str(formData.get("adminNote"));
  if (!id) return;
  // Sistemce ilerletilmiş başvurular (kabul/ödeme/aktif) bu dropdown ile erken bir
  // statüye GERİ düşürülemez — yalnız not güncellenir. (Aksi halde 'awaiting_payment'
  // başvuru sessizce 'applied'a dönüyordu.)
  const advanced = ["accepted", "awaiting_payment", "activated"];
  const current = await prisma.agentApplication.findUnique({ where: { id }, select: { status: true } });
  if (!current) return;
  if (advanced.includes(current.status) && !advanced.includes(status)) {
    await prisma.agentApplication.update({ where: { id }, data: { adminNote } });
  } else {
    await prisma.agentApplication.update({ where: { id }, data: { status, adminNote } });
  }
  revalidatePath("/admin/basvurular");
}

// Aktivasyon: başvurudan Agent hesabı oluşturur (admin parolayı belirler).
export async function activateApplication(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  const password = String(formData.get("password") || "");
  if (!id) return;
  if (password.length < 6) throw new Error("Parola en az 6 karakter olmalı");

  const app = await prisma.agentApplication.findUnique({ where: { id } });
  if (!app) throw new Error("Başvuru bulunamadı");
  if (app.agentId) throw new Error("Bu başvuru zaten aktive edilmiş");
  if (app.status === "rejected") throw new Error("Reddedilmiş başvuru aktive edilemez");

  const email = app.email.toLowerCase();
  const dup = await prisma.agent.findUnique({ where: { email }, select: { id: true } });
  if (dup) throw new Error("Bu e-posta zaten kayıtlı bir danışmana ait");

  const root = slugify(app.name) || "danisman";
  let slug = root;
  let i = 1;
  while (await prisma.agent.findUnique({ where: { slug }, select: { id: true } })) slug = `${root}-${i++}`;

  const passwordHash = await bcrypt.hash(password, 10);
  const agent = await prisma.agent.create({
    data: {
      email,
      passwordHash,
      name: app.name,
      phone: app.phone,
      title: app.title || "Gayrimenkul Danışmanı",
      agency: app.agency || null,
      slug,
      status: "approved",
      approvedAt: new Date(),
    },
  });
  await prisma.agentApplication.update({ where: { id }, data: { status: "activated", agentId: agent.id } });
  await notifyAgent(agent.id, {
    type: "system",
    title: "Hesabınız aktif",
    body: "Danışman hesabınız açıldı. Giriş yapıp ilan ekleyebilirsiniz.",
    link: "/emlakci/panel",
  });
  revalidatePath("/admin/basvurular");
  revalidatePath("/admin/emlakcilar");
}

// Teklif oluştur (§4): paketten SNAPSHOT alır, önceki aktif teklifi supersede eder,
// versiyon++; başvurana e-posta OTP görüntüleme linki gönderir.
export async function createOffer(formData: FormData) {
  await ensureAuth();
  const applicationId = String(formData.get("id") || "");
  if (!applicationId) return;
  const app = await prisma.agentApplication.findUnique({ where: { id: applicationId } });
  if (!app) throw new Error("Başvuru bulunamadı");
  if (app.agentId) throw new Error("Bu başvuru zaten aktive edilmiş");

  let pkg;
  try {
    pkg = await prisma.package.findFirst({ orderBy: { createdAt: "asc" } });
  } catch {
    throw new Error("Paket tablosu henüz hazır değil (migration deploy edilmedi).");
  }
  if (!pkg) throw new Error("Önce /admin/paket'ten paket tanımlayın");

  await prisma.offer.updateMany({ where: { applicationId, status: "active" }, data: { status: "superseded" } });
  const last = await prisma.offer.findFirst({ where: { applicationId }, orderBy: { version: "desc" }, select: { version: true } });
  const version = (last?.version ?? 0) + 1;

  await prisma.offer.create({
    data: {
      applicationId,
      version,
      snapshotName: pkg.name,
      snapshotPrice: pkg.price,
      snapshotFeatures: pkg.features,
      interval: pkg.interval,
      validUntil: new Date(Date.now() + 7 * 24 * 3600_000),
    },
  });
  await prisma.agentApplication.update({ where: { id: applicationId }, data: { status: "offer_sent" } });

  await sendEmail({
    to: app.email,
    subject: "Danışman teklifiniz hazır",
    html: notificationEmail({
      title: "Danışman teklifiniz hazır",
      body: "Teklifinizi görüntülemek için e-postanız ve telefonunuzun son 4 hanesiyle doğrulama yapın.",
      link: "/emlakci/teklif",
    }),
  });

  revalidatePath("/admin/basvurular");
}

// --- Portföy fırsatları (§8) ---
export async function createOpportunity(formData: FormData) {
  await ensureAuth();
  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("Başlık gerekli");
  const days = num(formData.get("biddingDays")) ?? 7;
  await prisma.portfolioOpportunity.create({
    data: {
      title,
      description: str(formData.get("description")),
      district: str(formData.get("district")),
      propertyType: str(formData.get("propertyType")),
      estimatedPrice: num(formData.get("estimatedPrice")),
      areaGross: num(formData.get("areaGross")),
      rooms: str(formData.get("rooms")),
      leadId: str(formData.get("leadId")),
      biddingEndsAt: new Date(Date.now() + days * 24 * 3600_000),
    },
  });
  revalidatePath("/admin/firsatlar");
  redirect("/admin/firsatlar");
}

// Satıcı talebini (§8) portföy fırsatına dönüştürür — leadId bağlanır, alanlar önden dolar.
export async function promoteLeadToOpportunity(formData: FormData) {
  await ensureAuth();
  const leadId = String(formData.get("id") || "");
  if (!leadId) return;
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Talep bulunamadı");
  const rawPrice = lead.estimatedPrice ? Number(lead.estimatedPrice.replace(/[^\d]/g, "")) : NaN;
  // PG Int taşmasını önle: 2.1 milyarı aşan (ör. hatalı/çok haneli fiyat) → null.
  const price = Number.isFinite(rawPrice) && rawPrice > 0 && rawPrice <= 2_147_483_647 ? rawPrice : null;
  const title = `${lead.propertyType || "Mülk"}${lead.district ? ` · ${lead.district}` : ""} — ${lead.name}`;
  await prisma.portfolioOpportunity.create({
    data: {
      leadId: lead.id,
      title,
      description: lead.message || null,
      district: lead.district,
      propertyType: lead.propertyType,
      estimatedPrice: price,
      biddingEndsAt: new Date(Date.now() + 7 * 24 * 3600_000),
    },
  });
  await prisma.lead.update({ where: { id: leadId }, data: { status: "closed" } });
  revalidatePath("/admin/talepler");
  redirect("/admin/firsatlar");
}

export async function closeOpportunity(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.portfolioOpportunity.update({ where: { id }, data: { status: "closed" } });
  revalidatePath("/admin/firsatlar");
}

// Kazanan teklifi seç → kazanan emlakçıya atanmış ilan oluştur (onay bekler).
export async function selectWinningBid(formData: FormData) {
  await ensureAuth();
  const opportunityId = String(formData.get("opportunityId") || "");
  const bidId = String(formData.get("bidId") || "");
  if (!opportunityId || !bidId) return;

  const opp = await prisma.portfolioOpportunity.findUnique({ where: { id: opportunityId } });
  if (!opp) throw new Error("Fırsat bulunamadı");
  if (opp.listingId) throw new Error("Bu fırsat zaten ilana dönüştürülmüş");
  const bid = await prisma.bid.findUnique({ where: { id: bidId } });
  if (!bid || bid.opportunityId !== opportunityId) throw new Error("Teklif bulunamadı");

  const base = slugify(opp.title) || "ilan";
  let slug = base;
  let i = 1;
  while (await prisma.listing.findUnique({ where: { slug }, select: { id: true } })) slug = `${base}-${i++}`;
  const price = opp.estimatedPrice ?? 0;

  // Atomik: çift-tıklama/yarış → koşullu kilit (yalnız listingId hâlâ null ise ilerle).
  const created = await prisma.$transaction(async (tx) => {
    const claim = await tx.portfolioOpportunity.updateMany({
      where: { id: opportunityId, listingId: null },
      data: { status: "awarded" },
    });
    if (claim.count !== 1) return null; // başka bir işlem kazananı zaten seçti
    await tx.bid.updateMany({ where: { opportunityId }, data: { status: "lost" } });
    await tx.bid.update({ where: { id: bidId }, data: { status: "won" } });
    const listing = await tx.listing.create({
      data: {
        slug,
        title: opp.title,
        description: opp.description || opp.title,
        propertyType: opp.propertyType || "daire",
        listingType: "sale",
        status: "active",
        moderationStatus: "pending", // kazanan emlakçı düzenler, admin onaylar
        agentId: bid.agentId,
        price,
        district: opp.district || "Merkez",
        areaGross: opp.areaGross,
        rooms: opp.rooms,
      },
    });
    // Kaynak satıcı talebindeki (Lead) fotoğrafları ilana taşı — yoksa ilan görselsiz doğar → placeholder.
    if (opp.leadId) {
      const lead = await tx.lead.findUnique({ where: { id: opp.leadId }, select: { photos: true } });
      const urls = parseJsonArray(lead?.photos).filter((u) => typeof u === "string" && u.length > 0);
      if (urls.length) {
        await tx.listingImage.createMany({ data: urls.map((url, i) => ({ listingId: listing.id, url, sortOrder: i })) });
      }
    }
    // Sahte 0₺ PriceHistory yazma (fiyat-grafiğini kirletir); yalnız gerçek fiyatta.
    if (price > 0) await tx.priceHistory.create({ data: { listingId: listing.id, price } });
    await tx.portfolioOpportunity.update({ where: { id: opportunityId }, data: { status: "listed", listingId: listing.id } });
    return listing;
  });
  if (!created) throw new Error("Bu fırsat için kazanan zaten seçilmiş");

  // Bildirimler (ikincil): kazanan + kaybedenler + talep sahibi.
  await notifyAgent(bid.agentId, {
    type: "system",
    title: "Portföy fırsatını kazandınız",
    body: `${opp.title} — size atanmış ilan oluşturuldu (onay bekliyor, düzenleyebilirsiniz).`,
    link: "/emlakci/panel",
  });
  const losers = await prisma.bid.findMany({ where: { opportunityId, status: "lost" }, select: { agentId: true } });
  for (const l of losers) {
    if (l.agentId !== bid.agentId) {
      await notifyAgent(l.agentId, {
        type: "system",
        title: "Portföy teklifi sonuçlandı",
        body: `${opp.title} fırsatında başka bir teklif kazandı.`,
        link: "/emlakci/panel/firsatlar",
      });
    }
  }
  if (opp.userId) {
    await notifyUser(opp.userId, {
      type: "system",
      title: "Talebiniz ilana dönüştü",
      body: `${opp.title} için bir danışman atandı; ilanınız hazırlanıyor.`,
      link: "/hesabim",
    });
  }
  revalidatePath("/admin/firsatlar");
}

// --- Reklam talepleri (§12) ---
export async function updateAdRequestStatus(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "new");
  if (!id) return;
  await prisma.adRequest.update({ where: { id }, data: { status } });
  revalidatePath("/admin/reklam-talepleri");
}

export async function deleteAdRequest(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.adRequest.delete({ where: { id } });
  revalidatePath("/admin/reklam-talepleri");
}

export async function saveSettings(formData: FormData) {
  await ensureAuth();
  const keys = ["phone", "whatsapp", "email", "address", "brand", "seller_hero_image", "home_hero_image"];
  for (const key of keys) {
    const value = String(formData.get(key) || "");
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  revalidatePath("/admin/ayarlar");
  // İletişim bilgisi Header/Footer (layout) + tüm sayfalarda görünür → tüm site ağacını tazele.
  revalidatePath("/", "layout");
}

// --- Blog yazıları ---

async function uniqueSlugFor(
  model: "post" | "page",
  base: string,
  currentId: string | null
): Promise<string> {
  const root = slugify(base) || model;
  let slug = root;
  let i = 1;
  for (;;) {
    const found =
      model === "post"
        ? await prisma.post.findUnique({ where: { slug }, select: { id: true } })
        : await prisma.page.findUnique({ where: { slug }, select: { id: true } });
    if (!found || found.id === currentId) return slug;
    slug = `${root}-${i++}`;
  }
}

export async function savePost(formData: FormData) {
  await ensureAuth();
  const id = str(formData.get("id"));
  const title = String(formData.get("title") || "").trim();
  const content = sanitizeCmsHtml(String(formData.get("content") || "")).trim();
  if (!title) throw new Error("Başlık zorunludur");

  const slug = await uniqueSlugFor("post", str(formData.get("slug")) || title, id);
  const status = String(formData.get("status") || "draft") === "published" ? "published" : "draft";

  const base = {
    title,
    slug,
    excerpt: str(formData.get("excerpt")),
    content,
    coverImage: str(formData.get("coverImage")),
    author: str(formData.get("author")),
    tags: str(formData.get("tags")),
    status,
    metaTitle: str(formData.get("metaTitle")),
    metaDescription: str(formData.get("metaDescription")),
  };

  if (id) {
    const existing = await prisma.post.findUnique({ where: { id }, select: { publishedAt: true } });
    await prisma.post.update({
      where: { id },
      data: {
        ...base,
        publishedAt:
          status === "published" ? existing?.publishedAt ?? new Date() : null,
      },
    });
  } else {
    await prisma.post.create({
      data: { ...base, publishedAt: status === "published" ? new Date() : null },
    });
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function deletePost(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  if (id) {
    await prisma.post.delete({ where: { id } });
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
  }
}

// --- İçerik sayfaları ---

export async function savePage(formData: FormData) {
  await ensureAuth();
  const id = str(formData.get("id"));
  const title = String(formData.get("title") || "").trim();
  const content = sanitizeCmsHtml(String(formData.get("content") || "")).trim();
  if (!title) throw new Error("Başlık zorunludur");

  const slug = await uniqueSlugFor("page", str(formData.get("slug")) || title, id);
  const status = String(formData.get("status") || "draft") === "published" ? "published" : "draft";

  const data = {
    title,
    slug,
    content,
    status,
    showInMenu: bool(formData.get("showInMenu")),
    menuOrder: num(formData.get("menuOrder")) ?? 0,
    metaTitle: str(formData.get("metaTitle")),
    metaDescription: str(formData.get("metaDescription")),
  };

  if (id) {
    await prisma.page.update({ where: { id }, data });
  } else {
    await prisma.page.create({ data });
  }

  revalidatePath("/admin/sayfalar");
  revalidatePath(`/sayfa/${slug}`);
  redirect("/admin/sayfalar");
}

export async function deletePage(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  if (id) {
    const page = await prisma.page.findUnique({ where: { id }, select: { slug: true } });
    await prisma.page.delete({ where: { id } });
    revalidatePath("/admin/sayfalar");
    if (page) revalidatePath(`/sayfa/${page.slug}`);
  }
}

// --- Ana sayfa metinleri (key/value ayarlar) ---

const HOME_TEXT_KEYS = [
  "home_hero_badge",
  "home_hero_title",
  "home_hero_highlight",
  "home_hero_subtitle",
  "home_stat_sales",
  "home_stat_years",
  "home_why_title",
];

// --- Pop-up reklam / duyuru ---

export async function savePopup(formData: FormData) {
  await ensureAuth();
  const id = str(formData.get("id"));
  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("Başlık zorunludur");

  const data = {
    title,
    body: str(formData.get("body")),
    imageUrl: str(formData.get("imageUrl")),
    linkUrl: str(formData.get("linkUrl")),
    linkText: str(formData.get("linkText")),
    active: bool(formData.get("active")),
    frequency: String(formData.get("frequency") || "session"),
    delaySec: Math.max(0, Math.min(30, num(formData.get("delaySec")) ?? 2)),
  };

  if (id) {
    await prisma.popup.update({ where: { id }, data });
  } else {
    await prisma.popup.create({ data });
  }
  revalidatePath("/admin/reklamlar");
  revalidatePath("/", "layout");
  redirect("/admin/reklamlar");
}

export async function deletePopup(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  if (id) {
    await prisma.popup.delete({ where: { id } });
    revalidatePath("/admin/reklamlar");
    revalidatePath("/", "layout");
  }
}

export async function togglePopup(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  const active = bool(formData.get("active"));
  if (id) {
    await prisma.popup.update({ where: { id }, data: { active } });
    revalidatePath("/admin/reklamlar");
    revalidatePath("/", "layout");
  }
}

// --- Alıcı talepleri (kayıtlı arama) ---

export async function updateAlertStatus(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "active");
  if (id) {
    await prisma.buyerAlert.update({ where: { id }, data: { status } });
    revalidatePath("/admin/alici-talepleri");
  }
}

export async function deleteAlert(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  if (id) {
    await prisma.buyerAlert.delete({ where: { id } });
    revalidatePath("/admin/alici-talepleri");
  }
}

// --- Müşteri yorumları ---

export async function saveTestimonial(formData: FormData) {
  await ensureAuth();
  const id = str(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const text = String(formData.get("text") || "").trim();
  if (!name || !text) throw new Error("İsim ve yorum metni zorunludur");

  const data = {
    name,
    text,
    role: str(formData.get("role")),
    stars: Math.min(5, Math.max(1, num(formData.get("stars")) ?? 5)),
    published: bool(formData.get("published")),
    sortOrder: num(formData.get("sortOrder")) ?? 0,
  };

  if (id) {
    await prisma.testimonial.update({ where: { id }, data });
  } else {
    await prisma.testimonial.create({ data });
  }
  revalidatePath("/admin/yorumlar");
  revalidatePath("/");
}

export async function deleteTestimonial(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  if (id) {
    await prisma.testimonial.delete({ where: { id } });
    revalidatePath("/admin/yorumlar");
    revalidatePath("/");
  }
}

export async function saveHomeTexts(formData: FormData) {
  await ensureAuth();
  for (const key of HOME_TEXT_KEYS) {
    const value = String(formData.get(key) || "");
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  revalidatePath("/admin/ana-sayfa");
  revalidatePath("/");
}

// --- İlçe verisi (bölge analizi) ---

// Çok satırlı textarea metnini satırlara böler, boşları atar; JSON array string döner (boşsa null).
function jsonLines(v: FormDataEntryValue | null): string | null {
  const lines = String(v ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return lines.length ? JSON.stringify(lines) : null;
}

export async function saveDistrict(formData: FormData) {
  await ensureAuth();
  const id = str(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("İlçe adı zorunludur");

  let slug = str(formData.get("slug")) || slugify(name);
  // Benzersizlik: aynı ad/slug varsa (name/slug @unique) ham P2002 yerine anlaşılır davran.
  const slugTaken = await prisma.district.findUnique({ where: { slug }, select: { id: true } });
  if (slugTaken && slugTaken.id !== id) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  const nameTaken = await prisma.district.findFirst({ where: { name, ...(id ? { id: { not: id } } : {}) }, select: { id: true } });
  if (nameTaken) throw new Error(`"${name}" ilçesi zaten kayıtlı.`);

  const data = {
    name,
    slug,
    lat: num(formData.get("lat")),
    lng: num(formData.get("lng")),
    investmentScore: num(formData.get("investmentScore")),
    valueGrowth3yPct: num(formData.get("valueGrowth3yPct")),
    valueGrowth5yPct: num(formData.get("valueGrowth5yPct")),
    avgPriceDaire: num(formData.get("avgPriceDaire")),
    avgPriceArsaM2: num(formData.get("avgPriceArsaM2")),
    description: str(formData.get("description")),
    transportNote: str(formData.get("transportNote")),
    nearbySchools: jsonLines(formData.get("nearbySchools")),
    nearbyHospitals: jsonLines(formData.get("nearbyHospitals")),
    sortOrder: num(formData.get("sortOrder")) ?? 0,
  };

  if (id) {
    await prisma.district.update({ where: { id }, data });
  } else {
    await prisma.district.create({ data });
  }

  revalidatePath("/admin/ilceler");
  revalidatePath("/ilan/[slug]", "page"); // ilçe verisi ilan detay analizini besler
  revalidatePath("/bolge-analizi");
  redirect("/admin/ilceler");
}

export async function deleteDistrict(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") || "");
  if (id) {
    await prisma.district.delete({ where: { id } });
    revalidatePath("/admin/ilceler");
    revalidatePath("/bolge-analizi");
    revalidatePath("/ilan/[slug]", "page");
  }
}

// Global toggle: checkbox işaretliyse "1" (göster, varsayılan) değilse "0" (gizle).
export async function setAnalysisScores(formData: FormData) {
  await ensureAuth();
  const value = bool(formData.get("show")) ? "1" : "0";
  await prisma.setting.upsert({
    where: { key: "analysis_scores" },
    update: { value },
    create: { key: "analysis_scores", value },
  });
  revalidatePath("/admin/ilceler");
  revalidatePath("/ilan/[slug]", "page"); // toggle ilan detay analiz skorlarını etkiler
  revalidatePath("/bolge-analizi");
}
