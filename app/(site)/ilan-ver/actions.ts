"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/userAuth";
import { slugify } from "@/lib/format";
import { notifyAdmins } from "@/lib/notify";
import {
  getCategory,
  parseAttributes,
  sortableAttributeColumns,
  type AttributeValues,
  type CategoryKey,
} from "@/lib/categories";
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

type ParsedListing = {
  categoryKey: CategoryKey;
  subType: string;
  title: string;
  description: string;
  price: number;
  district: string;
  neighborhood: string | null;
  // Prisma InputJsonValue ile uyumlu olması için parseAttributes'ın kendi
  // tipi kullanılıyor; Record<string, unknown> JSON kolonuna yazılamıyor.
  attributes: AttributeValues;
  imageUrls: string[];
};

/**
 * Oluşturma ve düzenleme aynı doğrulamadan geçer. Ayrı yazılsalardı iki akış
 * zamanla ayrışır ve düzenleme, oluşturmanın kapattığı bir boşluğu açık bırakırdı.
 */
function parseListingForm(
  formData: FormData
): { ok: true; value: ParsedListing } | { ok: false; state: ListingFormState } {
  const categoryKey = String(formData.get("category") || "");
  if (!SELF_SERVICE_CATEGORIES.includes(categoryKey as CategoryKey)) {
    return { ok: false, state: { error: "Bu kategoride bireysel ilan verilemiyor." } };
  }
  const category = getCategory(categoryKey);

  const subType = String(formData.get("propertyType") || "").trim();
  if (!category.subTypes.some((s) => s.value === subType)) {
    return { ok: false, state: { error: "Lütfen bir tür seçin." } };
  }

  const title = String(formData.get("title") || "").trim();
  if (title.length < 10) return { ok: false, state: { error: "Başlık en az 10 karakter olmalıdır." } };

  const description = String(formData.get("description") || "").trim();
  if (description.length < 20) return { ok: false, state: { error: "Açıklama en az 20 karakter olmalıdır." } };

  const price = Number(String(formData.get("price") || "").replace(/[^\d]/g, ""));
  if (!Number.isFinite(price) || price <= 0) return { ok: false, state: { error: "Geçerli bir fiyat girin." } };
  if (price > MAX_PRICE) return { ok: false, state: { error: "Fiyat çok yüksek görünüyor, kontrol edin." } };

  const district = String(formData.get("district") || "").trim();
  if (!DISTRICTS.some((d) => d.name === district)) return { ok: false, state: { error: "Lütfen ilçe seçin." } };

  const { values: attributes, errors: fieldErrors } = parseAttributes(category.key, formData);
  if (Object.keys(fieldErrors).length) {
    return { ok: false, state: { error: "Lütfen işaretli alanları düzeltin.", fieldErrors } };
  }

  let imageUrls: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("imagesJson") || "[]"));
    if (Array.isArray(parsed)) imageUrls = parsed.filter((u) => typeof u === "string").slice(0, 6);
  } catch {
    /* görselsiz ilan da kabul edilir */
  }

  return {
    ok: true,
    value: {
      categoryKey: category.key,
      subType,
      title,
      description,
      price,
      district,
      neighborhood: String(formData.get("neighborhood") || "").trim() || null,
      attributes,
      imageUrls,
    },
  };
}

export async function submitUserListing(
  _prev: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const session = await getUserSession();
  if (!session) return { error: "İlan vermek için giriş yapmalısınız." };

  const parsed = parseListingForm(formData);
  if (!parsed.ok) return parsed.state;
  const v = parsed.value;

  // Başlıklar sık tekrar ediyor ("Sahibinden Temiz Clio"), çakışmada son ek verilir.
  let slug = slugify(v.title);
  if (!slug) slug = `ilan-${Date.now().toString(36)}`;
  if (await prisma.listing.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  await prisma.listing.create({
    data: {
      slug,
      title: v.title,
      description: v.description,
      category: v.categoryKey,
      propertyType: v.subType,
      listingType: "sale",
      status: "active",
      // Bireysel ilan her zaman admin onayından geçer.
      moderationStatus: "pending",
      price: v.price,
      currency: "TRY",
      district: v.district,
      neighborhood: v.neighborhood,
      attributes: v.attributes,
      // attributes ile BİRLİKTE yazılmalı: Prisma JSON alanına göre orderBy
      // desteklemediği için "Model Yılı"/"Kilometre" sıralaması bu türetilmiş
      // kolonlara bakıyor. Yazılmazsa ilan NULL kalıyor ve nulls:last yüzünden
      // listenin en dibine düşüyor — bu akış zaten yalnız vasıta/teknoloji için
      // çalıştığından, yazmamak sıralamayı bu kategorilerde tamamen bozuyordu.
      ...sortableAttributeColumns(v.attributes),
      userId: session.userId,
      images: v.imageUrls.length
        ? { create: v.imageUrls.map((url, index) => ({ url, sortOrder: index })) }
        : undefined,
    },
  });

  await notifyAdmins({
    type: "listing_pending",
    title: "Yeni bireysel ilan onay bekliyor",
    body: v.title,
    link: "/admin/onay",
  });

  updateTag("marketplace-stats");
  revalidatePath("/hesabim/ilanlarim");
  redirect("/hesabim/ilanlarim?durum=gonderildi");
}

/** Admin onay ekranında gösterilen alan etiketleri. */
const DIFF_LABELS: Record<string, string> = {
  title: "Başlık",
  description: "Açıklama",
  price: "Fiyat",
  district: "İlçe",
  neighborhood: "Mahalle",
  propertyType: "Tür",
  images: "Görseller",
};

export type ModerationDiff = Record<string, { label: string; from: string; to: string }>;

function asText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return String(value);
  return String(value);
}

/**
 * Kullanıcı kendi ilanını günceller.
 *
 * Değişiklik DOĞRUDAN uygulanır ve ilan `pending`'e düşer — yani yayından kalkar
 * ve admin onaylayana kadar görünmez. Kullanıcının "tekrar onaya düşsün" kararı
 * budur; onaysız içeriğin yayında kalmaması da bu yolla sağlanıyor.
 *
 * `moderationDiff` yalnız DEĞİŞEN alanları taşır, böylece admin ekranı kırk alanlık
 * künyeyi değil sadece farkı gösterir.
 */
export async function updateUserListing(
  _prev: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const session = await getUserSession();
  if (!session) return { error: "İlan düzenlemek için giriş yapmalısınız." };

  const id = String(formData.get("id") || "");
  const current = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true, userId: true, slug: true, category: true,
      title: true, description: true, price: true,
      district: true, neighborhood: true, propertyType: true,
      attributes: true,
      images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
    },
  });
  // Sahiplik kontrolü sunucuda: id tahmin edilebilir olmasa da yetkiyi istemciye
  // bırakmıyoruz (deleteUserListing ile aynı desen).
  if (!current || current.userId !== session.userId) return { error: "Bu ilanı düzenleme yetkiniz yok." };

  const parsed = parseListingForm(formData);
  if (!parsed.ok) return parsed.state;
  const v = parsed.value;

  // Kategori değiştirilemez: alan seti ve JSONB nitelikleri kategoriye bağlı,
  // değiştirmek ilanı baştan yazmak demek. Kullanıcı silip yeniden açabilir.
  if (v.categoryKey !== current.category) {
    return { error: "İlanın kategorisi değiştirilemez. Farklı kategori için yeni ilan açın." };
  }

  const diff: ModerationDiff = {};
  const track = (key: string, from: unknown, to: unknown) => {
    if (asText(from) !== asText(to)) {
      diff[key] = { label: DIFF_LABELS[key] ?? key, from: asText(from), to: asText(to) };
    }
  };
  track("title", current.title, v.title);
  track("description", current.description, v.description);
  track("price", current.price, v.price);
  track("district", current.district, v.district);
  track("neighborhood", current.neighborhood, v.neighborhood);
  track("propertyType", current.propertyType, v.subType);

  const currentImages = current.images.map((i) => i.url);
  const imagesChanged = currentImages.join("|") !== v.imageUrls.join("|");
  if (imagesChanged) {
    track("images", `${currentImages.length} görsel`, `${v.imageUrls.length} görsel`);
  }

  // Nitelikler kategoriye özel; her birini kendi anahtarıyla ayrı satır olarak yaz.
  const currentAttrs = (current.attributes ?? {}) as Record<string, unknown>;
  const category = getCategory(current.category as CategoryKey);
  for (const field of category.fields) {
    track(field.key, currentAttrs[field.key], v.attributes[field.key]);
    if (diff[field.key]) diff[field.key].label = field.label;
  }

  if (!Object.keys(diff).length) {
    return { error: "Değişiklik yapılmadı." };
  }

  await prisma.$transaction(async (tx) => {
    if (imagesChanged) {
      await tx.listingImage.deleteMany({ where: { listingId: current.id } });
    }
    await tx.listing.update({
      where: { id: current.id },
      data: {
        title: v.title,
        description: v.description,
        propertyType: v.subType,
        price: v.price,
        district: v.district,
        neighborhood: v.neighborhood,
        attributes: v.attributes,
        ...sortableAttributeColumns(v.attributes),
        moderationStatus: "pending",
        note: null,
        moderationDiff: diff,
        ...(imagesChanged && v.imageUrls.length
          ? { images: { create: v.imageUrls.map((url, index) => ({ url, sortOrder: index })) } }
          : {}),
      },
    });
  });

  await notifyAdmins({
    type: "listing_pending",
    title: "Düzenlenen ilan onay bekliyor",
    body: v.title,
    link: "/admin/onay",
  });

  updateTag("marketplace-stats");
  revalidatePath("/hesabim/ilanlarim");
  revalidatePath(`/ilan/${current.slug}`);
  redirect("/hesabim/ilanlarim?durum=guncellendi");
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
