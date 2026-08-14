"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/userAuth";
import { slugify } from "@/lib/format";
import { notifyAdmins } from "@/lib/notify";
import { getCategory, parseAttributes, type CategoryKey } from "@/lib/categories";
import { DISTRICTS } from "@/lib/constants";

/**
 * Bireysel ilan verme, YALNIZ emlak dışı kategoriler için.
 *
 * Emlak ilanları emlakçı panelinden ya da adminden girilir: kırk küsur alanlık
 * künye, imar/tapu doğrulaması ve kota/paket düzeni bireysel akışa uymuyor.
 * Bu ayrım bilinçlidir.
 */
const SELF_SERVICE_CATEGORIES: CategoryKey[] = ["vasita", "teknoloji"];

// PostgreSQL Int (32-bit) sınırı — aşan değer P2020 ile patlıyor.
const MAX_PRICE = 2_147_483_647;

export type ListingFormState = { error?: string; fieldErrors?: Record<string, string> };

export async function submitUserListing(
  _prev: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const session = await getUserSession();
  if (!session) return { error: "İlan vermek için giriş yapmalısınız." };

  const categoryKey = String(formData.get("category") || "");
  if (!SELF_SERVICE_CATEGORIES.includes(categoryKey as CategoryKey)) {
    return { error: "Bu kategoride bireysel ilan verilemiyor." };
  }
  const category = getCategory(categoryKey);

  const subType = String(formData.get("propertyType") || "").trim();
  if (!category.subTypes.some((s) => s.value === subType)) {
    return { error: "Lütfen bir tür seçin." };
  }

  const title = String(formData.get("title") || "").trim();
  if (title.length < 10) return { error: "Başlık en az 10 karakter olmalıdır." };

  const description = String(formData.get("description") || "").trim();
  if (description.length < 20) return { error: "Açıklama en az 20 karakter olmalıdır." };

  const price = Number(String(formData.get("price") || "").replace(/[^\d]/g, ""));
  if (!Number.isFinite(price) || price <= 0) return { error: "Geçerli bir fiyat girin." };
  if (price > MAX_PRICE) return { error: "Fiyat çok yüksek görünüyor, kontrol edin." };

  const district = String(formData.get("district") || "").trim();
  if (!DISTRICTS.some((d) => d.name === district)) return { error: "Lütfen ilçe seçin." };

  const { values: attributes, errors: fieldErrors } = parseAttributes(category.key, formData);
  if (Object.keys(fieldErrors).length) {
    return { error: "Lütfen işaretli alanları düzeltin.", fieldErrors };
  }

  let imageUrls: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("imagesJson") || "[]"));
    if (Array.isArray(parsed)) imageUrls = parsed.filter((u) => typeof u === "string").slice(0, 6);
  } catch {
    /* görselsiz ilan da kabul edilir */
  }

  // Başlıklar sık tekrar ediyor ("Sahibinden Temiz Clio"), çakışmada son ek verilir.
  let slug = slugify(title);
  if (!slug) slug = `ilan-${Date.now().toString(36)}`;
  if (await prisma.listing.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  await prisma.listing.create({
    data: {
      slug,
      title,
      description,
      category: category.key,
      propertyType: subType,
      listingType: "sale",
      status: "active",
      // Bireysel ilan her zaman admin onayından geçer.
      moderationStatus: "pending",
      price,
      currency: "TRY",
      district,
      neighborhood: String(formData.get("neighborhood") || "").trim() || null,
      attributes,
      userId: session.userId,
      images: imageUrls.length
        ? { create: imageUrls.map((url, index) => ({ url, sortOrder: index })) }
        : undefined,
    },
  });

  await notifyAdmins({
    type: "listing_pending",
    title: "Yeni bireysel ilan onay bekliyor",
    body: title,
    link: "/admin/onay",
  });

  updateTag("marketplace-stats");
  revalidatePath("/hesabim/ilanlarim");
  redirect("/hesabim/ilanlarim?durum=gonderildi");
}

/** Kullanıcı kendi ilanını siler. Yalnız sahibi silebilir. */
export async function deleteUserListing(formData: FormData) {
  const session = await getUserSession();
  if (!session) throw new Error("Yetkisiz");

  const id = String(formData.get("id") || "");
  const owned = await prisma.listing.findUnique({
    where: { id },
    select: { userId: true },
  });
  // Sahiplik kontrolü şart: id tahmin edilebilir olmasa da yetki kontrolünü
  // istemciye bırakmıyoruz.
  if (!owned || owned.userId !== session.userId) throw new Error("Yetkisiz");

  await prisma.listing.delete({ where: { id } });
  updateTag("marketplace-stats");
  revalidatePath("/hesabim/ilanlarim");
}
