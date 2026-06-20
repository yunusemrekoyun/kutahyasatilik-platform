import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRate } from "@/lib/rateLimit";
import { findApplicationForOffer, verifyOtp, activeOfferFor } from "@/lib/offerOtp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "offer-view", 10, 10 * 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email : "";
  const phone4 = typeof body?.phone4 === "string" ? body.phone4 : "";
  const code = typeof body?.code === "string" ? body.code : "";

  // Kimlik tek faktöre (e-posta+kod) inmesin: e-posta + telefon son-4 tekrar doğrulanır.
  const app = await findApplicationForOffer(email, phone4);
  if (!app) return NextResponse.json({ ok: false, error: "Bilgiler hatalı veya başvuru bulunamadı." }, { status: 404 });
  if (!(await verifyOtp(app.id, code))) {
    return NextResponse.json({ ok: false, error: "Kod hatalı veya süresi doldu." }, { status: 401 });
  }
  const offer = await activeOfferFor(app.id);
  if (!offer) return NextResponse.json({ ok: false, error: "Aktif teklif yok." }, { status: 404 });

  await prisma.offer.update({
    where: { id: offer.id },
    data: { viewedAt: offer.viewedAt ?? new Date(), viewCount: { increment: 1 } },
  });

  let features: string[] = [];
  if (offer.snapshotFeatures) {
    try {
      const arr = JSON.parse(offer.snapshotFeatures);
      if (Array.isArray(arr)) features = arr;
    } catch {
      /* yoksay */
    }
  }

  return NextResponse.json({
    ok: true,
    offer: {
      version: offer.version,
      name: offer.snapshotName,
      price: offer.snapshotPrice,
      interval: offer.interval,
      features,
      validUntil: offer.validUntil,
      accepted: offer.status === "accepted" || Boolean(offer.acceptedAt),
    },
  });
}
