import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRate } from "@/lib/rateLimit";
import { getUserSession, verifyUserCredentials, hashPassword } from "@/lib/userAuth";

export const runtime = "nodejs";

// Oturum-içi şifre değiştirme: mevcut şifre doğrulanır → yeni şifre hash'lenip yazılır →
// varsa açık reset token'ları temizlenir. (Şifre değiştirmek için e-posta akışına gerek kalmaz.)
const schema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifrenizi girin").max(100),
  newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalı").max(100),
});

export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ ok: false, error: "Oturum bulunamadı." }, { status: 401 });

  const limited = await checkRate(req, "change-password", 8, 15 * 60_000);
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

  const user = await verifyUserCredentials(session.email, data.currentPassword);
  if (!user) return NextResponse.json({ ok: false, error: "Mevcut şifreniz hatalı." }, { status: 400 });

  if (data.newPassword === data.currentPassword) {
    return NextResponse.json({ ok: false, error: "Yeni şifre eskisinden farklı olmalı." }, { status: 400 });
  }

  const passwordHash = await hashPassword(data.newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash, authVersion: { increment: 1 } } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({ ok: true, message: "Şifreniz güncellendi." });
}
