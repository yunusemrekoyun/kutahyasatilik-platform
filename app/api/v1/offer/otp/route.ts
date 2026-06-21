import { NextRequest, NextResponse } from "next/server";
import { checkRate, checkRateByKey } from "@/lib/rateLimit";
import { findApplicationForOffer, issueOtp, activeOfferFor } from "@/lib/offerOtp";
import { sendEmail, notificationEmail, emailEnabled } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mobil onboarding — web /api/emlakci/teklif/otp birebir port. PUBLIC (Bearer YOK):
// kişi henüz Agent değil; kimlik e-posta + telefon son-4 + e-posta OTP üçlüsü.
export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "offer-otp", 5, 10 * 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email : "";
  const phone4 = typeof body?.phone4 === "string" ? body.phone4 : "";

  // GÜVENLİK: enumeration önleme — başvuru/teklif olsun olmasın TEK TİP yanıt.
  const generic = NextResponse.json({
    ok: true,
    message: "Eşleşen bir başvuru varsa doğrulama kodu e-postanıza gönderildi.",
  });

  const app = await findApplicationForOffer(email, phone4);
  if (!app) return generic;
  const offer = await activeOfferFor(app.id);
  if (!offer) return generic;

  const allowed = await checkRateByKey(app.id, "offer-otp-app", 5, 60 * 60_000);
  if (!allowed) return generic;

  const code = await issueOtp(app.id);
  if (!emailEnabled() && process.env.NODE_ENV !== "production") {
    console.log(`[teklif-otp][dev] ${app.email}: ${code}`);
  }
  await sendEmail({
    to: app.email,
    subject: "Teklif doğrulama kodunuz",
    html: notificationEmail({ title: "Doğrulama kodunuz", body: `Teklif görüntüleme kodunuz: ${code} (10 dakika geçerli).` }),
  });

  return generic;
}
