import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRate } from "@/lib/rateLimit";
import { trPhoneSchema } from "@/lib/validation";
import { notifyAdmins, notifyAgent } from "@/lib/notify";
import { getUserSession } from "@/lib/userAuth";

const schema = z.object({
  type: z.enum(["seller", "appointment", "expertise", "price_offer", "contact"]),
  name: z.string().min(2, "Ad soyad gerekli").max(120),
  phone: trPhoneSchema,
  email: z.string().email().optional().or(z.literal("")),
  message: z.string().max(2000).optional(),
  district: z.string().max(60).optional(),
  neighborhood: z.string().max(120).optional(),
  propertyType: z.string().max(40).optional(),
  estimatedPrice: z.string().max(60).optional(),
  preferredDate: z.string().max(60).optional(),
  photos: z.array(z.string()).max(15).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  listingId: z.string().max(40).optional(),
  // takip
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
  referrer: z.string().max(300).optional(),
  pagePath: z.string().max(300).optional(),
});

const EVENT_BY_TYPE: Record<string, string> = {
  seller: "seller_lead",
  appointment: "appointment",
  expertise: "expertise",
  price_offer: "price_offer",
  contact: "conversion",
};

const LEAD_LABELS: Record<string, string> = {
  seller: "Yeni satıcı talebi",
  appointment: "Yeni randevu talebi",
  expertise: "Yeni ekspertiz talebi",
  price_offer: "Yeni fiyat teklifi",
  contact: "Yeni iletişim mesajı",
};

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "leads", 8, 60_000);
  if (limited) return limited;

  // Talep bırakmak için giriş zorunlu — böylece talep hesaba bağlanır ve kullanıcı süreci takip edebilir.
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Talep bırakmak için giriş yapmalısınız.", needAuth: true },
      { status: 401 }
    );
  }

  let data;
  try {
    data = schema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: err.issues[0]?.message || "Form hatalı" },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
  }

  // İlan gerçekten var mı? (yoksa ilişkiyi boş bırak)
  let listingId: string | null = null;
  let listingAgentId: string | null = null;
  let listingTitle: string | null = null;
  if (data.listingId) {
    const exists = await prisma.listing.findUnique({
      where: { id: data.listingId },
      select: { id: true, agentId: true, title: true },
    });
    listingId = exists?.id ?? null;
    listingAgentId = exists?.agentId ?? null;
    listingTitle = exists?.title ?? null;
  }

  const lead = await prisma.lead.create({
    data: {
      type: data.type,
      userId: session.userId,
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email || null,
      message: data.message || null,
      district: data.district || null,
      neighborhood: data.neighborhood || null,
      propertyType: data.propertyType || null,
      estimatedPrice: data.estimatedPrice || null,
      preferredDate: data.preferredDate || null,
      photos: data.photos && data.photos.length ? JSON.stringify(data.photos) : null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      listingId,
      utmSource: data.utmSource || null,
      utmMedium: data.utmMedium || null,
      utmCampaign: data.utmCampaign || null,
      referrer: data.referrer || null,
      pagePath: data.pagePath || null,
    },
  });

  // Dönüşüm olayı kaydet
  await prisma.analyticsEvent.create({
    data: {
      type: EVENT_BY_TYPE[data.type] || "conversion",
      listingId,
      district: data.district || null,
      pagePath: data.pagePath || null,
      referrer: data.referrer || null,
      utmSource: data.utmSource || null,
    },
  });

  // Bildirim: admin'e her zaman; talep bir emlakçının ilanına aitse ona da.
  const label = LEAD_LABELS[data.type] || "Yeni talep";
  await notifyAdmins({
    type: "new_lead",
    title: label,
    body: `${data.name.trim()} · ${data.phone.trim()}`,
    link: "/admin/talepler",
  });
  if (listingAgentId) {
    await notifyAgent(listingAgentId, {
      type: "new_lead",
      title: "İlanınıza yeni talep",
      body: listingTitle ? `${listingTitle} — ${data.name.trim()}` : data.name.trim(),
      link: "/emlakci/panel",
    });
  }

  return NextResponse.json({ ok: true, id: lead.id });
}
