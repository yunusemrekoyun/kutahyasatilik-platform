import { NextRequest, NextResponse } from "next/server";
import { checkRate } from "@/lib/rateLimit";
import { findApplicationForOffer, issueOtp, activeOfferFor } from "@/lib/offerOtp";
import { sendEmail, notificationEmail, emailEnabled } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "offer-otp", 5, 10 * 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email : "";
  const phone4 = typeof body?.phone4 === "string" ? body.phone4 : "";

  const app = await findApplicationForOffer(email, phone4);
  if (!app) {
    return NextResponse.json(
      { ok: false, error: "Eşleşen başvuru bulunamadı. E-posta ve telefonun son 4 hanesini kontrol edin." },
      { status: 404 }
    );
  }
  const offer = await activeOfferFor(app.id);
  if (!offer) {
    return NextResponse.json({ ok: false, error: "Görüntülenecek aktif teklif yok." }, { status: 404 });
  }

  const code = await issueOtp(app.id);
  if (!emailEnabled() && process.env.NODE_ENV !== "production") {
    // Dev kolaylığı: e-posta yapılandırılmadıysa kodu sunucu log'una düşür.
    console.log(`[teklif-otp][dev] ${app.email}: ${code}`);
  }
  await sendEmail({
    to: app.email,
    subject: "Teklif doğrulama kodunuz",
    html: notificationEmail({ title: "Doğrulama kodunuz", body: `Teklif görüntüleme kodunuz: ${code} (10 dakika geçerli).` }),
  });

  return NextResponse.json({ ok: true });
}
