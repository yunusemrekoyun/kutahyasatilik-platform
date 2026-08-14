import { NextRequest, NextResponse } from "next/server";
import { Expo } from "expo-server-sdk";
import { z } from "zod";
import { resolveApiSession } from "@/lib/apiAuth";
import { checkRate } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().max(300).refine((value) => Expo.isExpoPushToken(value), "Geçersiz Expo Push tokenı"),
  platform: z.enum(["ios", "android"]),
});

export async function POST(req: NextRequest) {
  const session = await resolveApiSession(req);
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  const limited = await checkRate(req, "push-token", 20, 60_000);
  if (limited) return limited;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message || "Geçersiz istek" }, { status: 400 });

  const { token, platform } = parsed.data;

  // Cihaz el değiştirebilir: aynı telefonda çıkış yapıp başka hesapla girilince Expo
  // token'ı aynı kalır, kaydın yeni sahibe geçmesi DOĞRU davranış. Ancak eski sahibin
  // kuyrukta bekleyen bildirimleri artık başkasının elindeki cihaza gitmemeli —
  // devirde o kayıtları kapat. (Yalnız recipientId'yi üzerine yazmak, kuyruktaki
  // bildirimleri yeni sahibin cihazına teslim ediyordu.)
  const existing = await prisma.pushToken.findUnique({
    where: { token },
    select: { id: true, recipientRole: true, recipientId: true },
  });
  const reassigned =
    existing !== null && (existing.recipientRole !== session.role || existing.recipientId !== session.id);

  await prisma.$transaction(async (tx) => {
    if (existing && reassigned) {
      await tx.pushDelivery.updateMany({
        where: { pushTokenId: existing.id, status: { in: ["pending", "processing"] } },
        data: { status: "failed", claimId: null, error: "TokenReassigned" },
      });
    }
    await tx.pushToken.upsert({
      where: { token },
      create: { token, platform, recipientRole: session.role, recipientId: session.id },
      update: { platform, recipientRole: session.role, recipientId: session.id, active: true, lastSeenAt: new Date(), lastError: null },
    });
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await resolveApiSession(req);
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  const parsed = z.object({ token: z.string().max(300) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Token gerekli" }, { status: 400 });
  await prisma.pushToken.updateMany({
    where: { token: parsed.data.token, recipientRole: session.role, recipientId: session.id },
    data: { active: false, lastSeenAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
