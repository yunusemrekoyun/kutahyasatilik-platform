import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRate } from "@/lib/rateLimit";
import { trPhoneSchema } from "@/lib/validation";
import { notifyAdmins, notifyAgent } from "@/lib/notify";

// Mobil lead/talep — web /api/leads ile AYNI mantık (iletişim/randevu/ekspertiz/teklif/satıcı).
// Public (giriş gerekmez). İlana bağlıysa emlakçıya da bildirim gider.

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
  listingId: z.string().max(40).optional(),
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

  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: err.issues[0]?.message || "Form hatalı" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
  }

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
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email || null,
      message: data.message || null,
      district: data.district || null,
      neighborhood: data.neighborhood || null,
      propertyType: data.propertyType || null,
      estimatedPrice: data.estimatedPrice || null,
      preferredDate: data.preferredDate || null,
      listingId,
    },
  });

  await prisma.analyticsEvent
    .create({
      data: { type: EVENT_BY_TYPE[data.type] || "conversion", listingId, district: data.district || null },
    })
    .catch(() => {});

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
