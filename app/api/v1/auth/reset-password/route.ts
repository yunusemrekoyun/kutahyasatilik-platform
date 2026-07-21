import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRate } from "@/lib/rateLimit";
import { hashPassword } from "@/lib/userAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mobil şifre sıfırlama tamamlama — web /api/user/reset-password birebir port. PUBLIC.
// (Ana akış e-postadaki WEB linkiyle tamamlanır; bu twin ileride native/webview reset için hazır.)
const schema = z.object({
  token: z.string().min(16, "Geçersiz bağlantı").max(200),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı").max(100),
});

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "reset-password", 10, 15 * 60_000);
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

  const tokenHash = crypto.createHash("sha256").update(data.token).digest("hex");
  const rec = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!rec || rec.usedAt || rec.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { ok: false, error: "Bağlantı geçersiz veya süresi dolmuş. Yeniden şifre sıfırlama isteyin." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(data.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: rec.userId }, data: { passwordHash, authVersion: { increment: 1 } } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: rec.userId } }),
  ]);

  return NextResponse.json({ ok: true });
}
