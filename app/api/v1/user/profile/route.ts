import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRate } from "@/lib/rateLimit";
import { resolveApiSession, signSessionToken } from "@/lib/apiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mobil kullanıcı profili — web /api/user/update-profile + hesabim server-query'nin Bearer twin'i.
// GET: form için ad+telefon+e-posta (DB'den). PUT: ad+telefon güncelle → YENİ token döndür
// (isim token claim'inde tutulduğundan; app token'ı değiştirir → /auth/me yeni adı gösterir).

const schema = z.object({
  name: z.string().trim().min(2, "Ad en az 2 karakter olmalı").max(80),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  const session = await resolveApiSession(req);
  if (!session || session.role !== "user") {
    return NextResponse.json({ ok: false, error: "Yetkisiz", needAuth: true }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { name: true, phone: true, email: true },
  });
  if (!user) return NextResponse.json({ ok: false, error: "Kullanıcı bulunamadı" }, { status: 404 });
  return NextResponse.json({ ok: true, name: user.name, phone: user.phone ?? "", email: user.email });
}

export async function PUT(req: NextRequest) {
  const session = await resolveApiSession(req);
  if (!session || session.role !== "user") {
    return NextResponse.json({ ok: false, error: "Yetkisiz", needAuth: true }, { status: 401 });
  }
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
  await prisma.user.update({ where: { id: session.id }, data: { name: data.name, phone } });

  // İsim token claim'inde → yeni adla token'ı yeniden imzala (kullanıcı silosu, 30 gün).
  const token = await signSessionToken({ userId: session.id, email: session.email, name: data.name }, "30d");

  return NextResponse.json({ ok: true, message: "Profiliniz güncellendi.", name: data.name, token });
}
