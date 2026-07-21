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
  await prisma.pushToken.upsert({
    where: { token: parsed.data.token },
    create: { token: parsed.data.token, platform: parsed.data.platform, recipientRole: session.role, recipientId: session.id },
    update: { platform: parsed.data.platform, recipientRole: session.role, recipientId: session.id, active: true, lastSeenAt: new Date(), lastError: null },
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
