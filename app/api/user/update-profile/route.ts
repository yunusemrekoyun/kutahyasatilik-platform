import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRate } from "@/lib/rateLimit";
import { getUserSession, createUserSession } from "@/lib/userAuth";

export const runtime = "nodejs";

// Profil güncelleme (ad + telefon). E-posta değiştirme burada YOK (doğrulama gerektirir).
// Ad değişince oturum çerezi yenilenir (Header selamlaması adı kullanır).
const schema = z.object({
  name: z.string().trim().min(2, "Ad en az 2 karakter olmalı").max(80),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ ok: false, error: "Oturum bulunamadı." }, { status: 401 });

  const limited = await checkRate(req, "update-profile", 12, 15 * 60_000);
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

  const phone = data.phone ? data.phone : null;
  await prisma.user.update({ where: { id: session.userId }, data: { name: data.name, phone } });

  // Selamlama adı oturum token'ında tutuluyor → yeni adla yeniden imzala.
  await createUserSession({ userId: session.userId, email: session.email, name: data.name });

  return NextResponse.json({ ok: true, message: "Profiliniz güncellendi." });
}
