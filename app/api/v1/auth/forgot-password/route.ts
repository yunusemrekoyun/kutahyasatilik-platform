import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRate } from "@/lib/rateLimit";
import { sendEmail, notificationEmail, emailEnabled } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mobil "Şifremi unuttum" — web /api/user/forgot-password birebir port. PUBLIC.
// E-posta al → tek kullanımlık token (SHA-256 hash DB'de) → e-posta ile WEB reset linki gönder.
// Sıfırlama WEB sayfasında tamamlanır (/sifre-sifirla?token=...). Enumeration önlemek için tek tip yanıt.

const schema = z.object({ email: z.string().email("Geçerli bir e-posta girin").max(160) });
const TTL_MS = 60 * 60 * 1000; // 1 saat

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "forgot-password", 5, 15 * 60_000);
  if (limited) return limited;

  let data;
  try {
    data = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Geçerli bir e-posta girin." }, { status: 400 });
  }

  const generic = NextResponse.json({
    ok: true,
    message: "E-posta adresi kayıtlıysa şifre sıfırlama bağlantısı gönderildi.",
  });

  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
    select: { id: true, email: true },
  });
  if (!user) return generic;

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + TTL_MS) },
  });

  const path = `/sifre-sifirla?token=${token}`;
  if (!emailEnabled()) {
    console.error("[sifre-sifirla][v1] E-posta yapılandırılmamış; bağlantı gönderilemedi.");
  }
  await sendEmail({
    to: user.email,
    subject: "Şifre sıfırlama bağlantınız",
    html: notificationEmail({
      title: "Şifre sıfırlama",
      body: "Şifreni sıfırlamak için aşağıdaki bağlantıya tıkla (1 saat geçerlidir). Bu isteği sen yapmadıysan e-postayı yok sayabilirsin.",
      link: path,
      ctaLabel: "Şifreyi Sıfırla",
    }),
  });

  return generic;
}
