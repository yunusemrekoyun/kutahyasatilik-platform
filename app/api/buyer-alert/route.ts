import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findListingsForAlert } from "@/lib/matching";
import { checkRate } from "@/lib/rateLimit";
import { trPhoneSchema } from "@/lib/validation";

const schema = z.object({
  name: z.string().min(2, "Ad soyad gerekli").max(120),
  phone: trPhoneSchema,
  email: z.string().email().optional().or(z.literal("")),
  propertyType: z.string().max(40).optional().or(z.literal("")),
  listingType: z.string().max(20).optional().or(z.literal("")),
  district: z.string().max(60).optional().or(z.literal("")),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  minArea: z.coerce.number().int().nonnegative().optional(),
  rooms: z.string().max(20).optional().or(z.literal("")),
  note: z.string().max(1000).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
});

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "buyer-alert", 8, 60_000);
  if (limited) return limited;
  let data;
  try {
    data = schema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: err.issues[0]?.message || "Form hatalı" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
  }

  const criteria = {
    propertyType: data.propertyType || null,
    listingType: data.listingType || "sale",
    district: data.district || null,
    minPrice: data.minPrice || null,
    maxPrice: data.maxPrice || null,
    minArea: data.minArea || null,
    rooms: data.rooms || null,
  };

  const alert = await prisma.buyerAlert.create({
    data: {
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email || null,
      note: data.note || null,
      status: "active",
      utmSource: data.utmSource || null,
      utmMedium: data.utmMedium || null,
      utmCampaign: data.utmCampaign || null,
      ...criteria,
    },
  });

  // Dönüşüm olayı (analitik)
  await prisma.analyticsEvent
    .create({ data: { type: "conversion", district: data.district || null, utmSource: data.utmSource || null } })
    .catch(() => {});

  // Anında uygun ilanları döndür (anlık tatmin)
  const matches = await findListingsForAlert(criteria, 12);
  const items = matches.map((m) => ({
    slug: m.slug, title: m.title, price: m.price, currency: m.currency,
    propertyType: m.propertyType, district: m.district, neighborhood: m.neighborhood,
    rooms: m.rooms, areaGross: m.areaGross, status: m.status, featured: m.featured,
    verified: m.verified, coverImage: m.images[0]?.url ?? null,
  }));

  return NextResponse.json({ ok: true, id: alert.id, matches: items });
}
