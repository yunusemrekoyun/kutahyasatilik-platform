import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRate } from "@/lib/rateLimit";

const schema = z.object({
  type: z.enum([
    "view",
    "phone_click",
    "whatsapp_click",
    "appointment",
    "expertise",
    "price_offer",
    "seller_lead",
    "conversion",
  ]),
  listingId: z.string().max(40).optional().nullable(),
  district: z.string().max(60).optional().nullable(),
  pagePath: z.string().max(300).optional().nullable(),
  referrer: z.string().max(300).optional().nullable(),
  utmSource: z.string().max(120).optional().nullable(),
  sessionId: z.string().max(80).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "track", 120, 60_000);
  if (limited) return limited;

  let data;
  try {
    data = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "geçersiz olay" }, { status: 400 });
  }

  // İlan gerçekten var mı? Yoksa ilişkiyi null bırak (FK hatası / metrik şişirme önlenir).
  let listingId: string | null = null;
  if (data.listingId) {
    const exists = await prisma.listing.findUnique({
      where: { id: data.listingId },
      select: { id: true },
    });
    listingId = exists?.id ?? null;
  }

  try {
    await prisma.analyticsEvent.create({
      data: {
        type: data.type,
        listingId,
        district: data.district || null,
        pagePath: data.pagePath || null,
        referrer: data.referrer || null,
        utmSource: data.utmSource || null,
        sessionId: data.sessionId || null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
