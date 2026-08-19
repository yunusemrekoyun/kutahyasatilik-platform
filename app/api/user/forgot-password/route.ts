import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRate } from "@/lib/rateLimit";
import { findResetTarget, issueResetToken } from "@/lib/passwordReset";
import { sendEmail, notificationEmail, emailEnabled } from "@/lib/email";

export const runtime = "nodejs";

// "Şifremi unuttum": e-posta al → tek kullanımlık token üret → DB'de SHA-256 hash sakla →
// e-posta ile /sifre-sifirla?token=... linki gönder. GÜVENLİK: enumeration önlemek için
// e-posta kayıtlı olsun olmasın TEK TİP yanıt (link yalnız gerçek kullanıcıya gider).
//
// Giriş BİRLEŞİK (kullanıcı/danışman/yönetici tek formdan), sıfırlama da öyle:
// e-posta önce User'da, bulunamazsa Agent'ta aranıyor. Danışman tarafı daha önce
// hiç yoktu — şifresini unutan danışman için tek çözüm veritabanına elle
// müdahaleydi. Ayrı bir danışman sayfası açmak, birleşik girişle çelişirdi.

const schema = z.object({ email: z.string().email("Geçerli bir e-posta girin").max(160) });

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

  // Arama mantığı v1 ikiziyle ORTAK (bkz. lib/passwordReset.findResetTarget).
  const target = await findResetTarget(data.email);
  if (!target) return generic;

  const token = await issueResetToken(target.audience, target.id);

  const path = `/sifre-sifirla?token=${token}`;
  // Sıfırlama bağlantısı ve kullanıcı bilgisi hiçbir ortamda loglanmaz.
  if (!emailEnabled()) {
    console.error(
      "[sifre-sifirla] E-posta yapılandırılmamış; bağlantı gönderilemedi. " +
        "EMAIL_FROM ve bir e-posta sağlayıcısı yapılandırın."
    );
  }
  await sendEmail({
    to: target.email,
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
