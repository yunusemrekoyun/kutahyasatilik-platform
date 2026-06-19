import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRate } from "@/lib/rateLimit";
import { findApplicationByEmail, verifyOtp, activeOfferFor } from "@/lib/offerOtp";
import { notifyAdmins } from "@/lib/notify";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "offer-accept", 10, 10 * 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email : "";
  const code = typeof body?.code === "string" ? body.code : "";

  const app = await findApplicationByEmail(email);
  if (!app) return NextResponse.json({ ok: false, error: "Başvuru bulunamadı." }, { status: 404 });
  if (!(await verifyOtp(app.id, code))) {
    return NextResponse.json({ ok: false, error: "Kod hatalı veya süresi doldu." }, { status: 401 });
  }
  const offer = await activeOfferFor(app.id);
  if (!offer) return NextResponse.json({ ok: false, error: "Aktif teklif yok." }, { status: 404 });

  await prisma.offer.update({ where: { id: offer.id }, data: { status: "accepted", acceptedAt: new Date() } });
  await prisma.agentApplication.update({ where: { id: app.id }, data: { status: "awaiting_payment" } });

  await notifyAdmins({
    type: "system",
    title: "Teklif kabul edildi",
    body: `${app.name} teklifi kabul etti — ödeme bekleniyor.`,
    link: "/admin/basvurular",
  });

  return NextResponse.json({ ok: true });
}
