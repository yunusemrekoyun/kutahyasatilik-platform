import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { findListingsForAlert } from "@/lib/matching";
import { sanitizeAlertAttributes } from "@/lib/categories";
import { checkRate } from "@/lib/rateLimit";
import { trPhoneSchema } from "@/lib/validation";
import { notifyAdmins } from "@/lib/notify";
import { resolveApiSession } from "@/lib/apiAuth";
import { requestOrigin } from "@/lib/apiMedia";

// Mobil alıcı talebi — web /api/buyer-alert ile aynı; girişli kullanıcıda Bearer'dan userId
// bağlanır (kayıtlı aramalarda görünür). Anında eşleşen ilanları döner.

const schema = z.object({
  name: z.string().min(2, "Ad soyad gerekli").max(120),
  phone: trPhoneSchema,
  email: z.string().email().optional().or(z.literal("")),
  // Kayıtlı arama her kategoride; kategori gelmezse emlak (geriye uyumluluk).
  category: z.enum(["emlak", "vasita", "teknoloji"]).optional(),
  // Kategoriye özel kriterler: ilan filtreleriyle AYNI sözleşme
  // (yil_min, kilometre_max, yakit ...). Kayıtta olmayan anahtarlar elenir.
  attributes: z.record(z.string(), z.string().max(40)).optional(),
  propertyType: z.string().max(40).optional().or(z.literal("")),
  listingType: z.string().max(20).optional().or(z.literal("")),
  district: z.string().max(60).optional().or(z.literal("")),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  minArea: z.coerce.number().int().nonnegative().optional(),
  rooms: z.string().max(20).optional().or(z.literal("")),
  note: z.string().max(1000).optional(),
});

function absolutize(path: string | null, origin: string): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = (process.env.NEXT_PUBLIC_MEDIA_URL?.trim() || origin).replace(/\/+$/, "");
  return base + (path.startsWith("/") ? path : "/" + path);
}

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "buyer-alert", 8, 60_000);
  if (limited) return limited;

  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: err.issues[0]?.message || "Form hatalı" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
  }

  const category = data.category ?? "emlak";
  // Nitelikler kayıttan süzülüyor: istemciden gelen serbest anahtar sorguya
  // sızmasın ve saklanan talep gerçekten eşleşebilir olsun.
  const attributes = sanitizeAlertAttributes(category, data.attributes);
  const criteria = {
    category,
    propertyType: data.propertyType || null,
    listingType: data.listingType || "sale",
    district: data.district || null,
    minPrice: data.minPrice || null,
    maxPrice: data.maxPrice || null,
    // Oda ve alan yalnız emlakta anlamlı.
    minArea: category === "emlak" ? data.minArea || null : null,
    rooms: category === "emlak" ? data.rooms || null : null,
    attributes: Object.keys(attributes).length ? attributes : null,
  };

  const session = await resolveApiSession(req);
  const userId = session?.role === "user" ? session.id : null;

  const alert = await prisma.buyerAlert.create({
    data: {
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email || null,
      note: data.note || null,
      status: "active",
      userId,
      ...criteria,
      // Prisma JSON alanında SQL NULL için DbNull gerekiyor; düz null tip
      // hatası veriyor. criteria eşleştirmeye düz haliyle gidiyor.
      attributes: criteria.attributes ?? Prisma.DbNull,
    },
  });

  await prisma.analyticsEvent
    .create({ data: { type: "conversion", district: data.district || null } })
    .catch(() => {});

  await notifyAdmins({
    type: "new_alert",
    title: "Yeni alıcı talebi",
    body: `${data.name.trim()} · ${data.phone.trim()}`,
    link: "/admin/alici-talepleri",
  });

  const origin = requestOrigin(req);
  const matches = await findListingsForAlert(criteria, 12);
  const items = matches.map((m) => ({
    id: m.id,
    slug: m.slug,
    title: m.title,
    price: m.price,
    currency: m.currency,
    propertyType: m.propertyType,
    district: m.district,
    neighborhood: m.neighborhood,
    rooms: m.rooms,
    areaGross: m.areaGross,
    status: m.status,
    featured: m.featured,
    verified: m.verified,
    coverImage: absolutize(m.images[0]?.url ?? null, origin),
    agentName: m.agent?.name ?? null,
  }));

  return NextResponse.json({ ok: true, id: alert.id, matches: items });
}
