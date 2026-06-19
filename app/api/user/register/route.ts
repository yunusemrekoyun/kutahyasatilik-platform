import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRate } from "@/lib/rateLimit";
import { trPhoneSchema } from "@/lib/validation";
import { hashPassword, createUserSession } from "@/lib/userAuth";

const schema = z.object({
  name: z.string().min(2, "Ad soyad gerekli").max(120),
  email: z.string().email("Geçerli bir e-posta girin").max(160),
  phone: trPhoneSchema,
  password: z.string().min(6, "Şifre en az 6 karakter olmalı").max(100),
});

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "user-register", 10, 3_600_000);
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

  const email = data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) {
    return NextResponse.json({ ok: false, error: "Bu e-posta ile zaten bir hesap var." }, { status: 409 });
  }

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: data.name.trim(), phone: data.phone.trim() },
    select: { id: true, email: true, name: true },
  });

  // Kayıt sonrası otomatik giriş
  await createUserSession({ userId: user.id, email: user.email, name: user.name });

  return NextResponse.json({ ok: true });
}
