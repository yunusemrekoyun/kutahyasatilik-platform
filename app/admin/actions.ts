"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { sanitizeCmsHtml } from "@/lib/sanitize";
import { deleteUploadFiles } from "@/lib/uploads";
import { deleteVideo } from "@/lib/videoStorage";
import { notifyAgent } from "@/lib/notify";

async function ensureAuth() {
  const session = await getSession();
  if (!session) throw new Error("Yetkisiz");
  return session;
}

function num(v: FormDataEntryValue | null): number | null {
  if (v === null || v === "") return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
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
      select: { price: true, videoUrl: true, images: { select: { url: true } } },
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
  } else {
    const created = await prisma.listing.create({ data });
    listingId = created.id;
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
    select: { slug: true, agentId: true, title: true },
  });
  if (updated.agentId) {
    await notifyAgent(updated.agentId, {
      type: "listing_approved",
      title: "İlanınız onaylandı",
      body: updated.title,
      link: "/emlakci/panel",
    });
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

export async function saveSettings(formData: FormData) {
  await ensureAuth();
  const keys = ["phone", "whatsapp", "email", "brand", "seller_hero_image", "home_hero_image"];
  for (const key of keys) {
    const value = String(formData.get(key) || "");
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  revalidatePath("/admin/ayarlar");
  revalidatePath("/satici");
  revalidatePath("/");
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
