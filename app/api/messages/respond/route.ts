import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRate } from "@/lib/rateLimit";
import { getMessagingParticipant } from "@/lib/messaging";
import { notifyAgent, notifyUser } from "@/lib/notify";

export const runtime = "nodejs";

// Bekleyen bir teklife yanıt: kabul / reddet / karşı-teklif. Yalnız KARŞI taraf yanıtlar.
const schema = z.object({
  messageId: z.string().max(40),
  action: z.enum(["accept", "reject", "counter"]),
  counterAmount: z.number().int().positive().max(2_000_000_000).optional(),
  counterCurrency: z.enum(["TRY", "USD", "EUR"]).optional(),
});

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "messages", 40, 60_000);
  if (limited) return limited;
  const me = await getMessagingParticipant();
  if (!me) return NextResponse.json({ ok: false, error: "Giriş gerekli" }, { status: 401 });

  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ ok: false, error: err.issues[0]?.message || "Form hatalı" }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
  }

  const msg = await prisma.message.findUnique({
    where: { id: data.messageId },
    include: { conversation: { select: { id: true, userId: true, agentId: true } } },
  });
  if (!msg || msg.type !== "offer") return NextResponse.json({ ok: false, error: "Teklif bulunamadı" }, { status: 404 });
  const conv = msg.conversation;
  const isParticipant = me.role === "user" ? conv.userId === me.id : conv.agentId === me.id;
  if (!isParticipant) return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 403 });
  if (msg.senderRole === me.role) return NextResponse.json({ ok: false, error: "Kendi teklifinize yanıt veremezsiniz." }, { status: 400 });
  if (msg.offerStatus !== "pending") return NextResponse.json({ ok: false, error: "Bu teklif zaten yanıtlanmış." }, { status: 400 });

  if (data.action === "counter") {
    if (!data.counterAmount) return NextResponse.json({ ok: false, error: "Karşı teklif tutarı gerekli" }, { status: 400 });
    await prisma.$transaction([
      prisma.message.update({ where: { id: msg.id }, data: { offerStatus: "countered" } }),
      prisma.message.create({
        data: {
          conversationId: conv.id,
          senderRole: me.role,
          type: "offer",
          offerAmount: data.counterAmount,
          offerCurrency: data.counterCurrency || msg.offerCurrency || "TRY",
          offerStatus: "pending",
        },
      }),
    ]);
  } else {
    await prisma.message.update({
      where: { id: msg.id },
      data: { offerStatus: data.action === "accept" ? "accepted" : "rejected" },
    });
  }
  await prisma.conversation.update({ where: { id: conv.id }, data: { lastMessageAt: new Date() } });

  const label = data.action === "accept" ? "Teklifiniz kabul edildi" : data.action === "reject" ? "Teklifiniz reddedildi" : "Size karşı teklif geldi";
  // Bildirim teklifi VEREN tarafa gider
  if (msg.senderRole === "user") notifyUser(conv.userId, { type: "offer", title: label, body: null, link: "/hesabim/mesajlar" });
  else notifyAgent(conv.agentId, { type: "offer", title: label, body: null, link: "/emlakci/panel/mesajlar" });

  return NextResponse.json({ ok: true });
}
