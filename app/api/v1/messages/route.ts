import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRate } from "@/lib/rateLimit";
import { getApiMessagingParticipant } from "@/lib/messaging";
import { absolutizeUrl } from "@/lib/apiMedia";
import { notifyAgent, notifyUser } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mobil mesajlaşma — web /api/messages'ın Bearer twin'i. Katılımcı Bearer'dan çözülür.
// Görsel/logo URL'leri mobil için mutlaklaştırılır.

const imgSel = { images: { take: 1, orderBy: { sortOrder: "asc" as const }, select: { url: true } } };

// GET ?conversationId=X → o sohbetin mesajları (+ okundu işaretle)
// GET (parametresiz)     → benim sohbet listem (kullanıcı VEYA emlakçı)
export async function GET(req: NextRequest) {
  const me = await getApiMessagingParticipant(req);
  if (!me) return NextResponse.json({ ok: false, error: "Giriş gerekli" }, { status: 401 });
  const convId = req.nextUrl.searchParams.get("conversationId");

  if (convId) {
    const conv = await prisma.conversation.findUnique({
      where: { id: convId },
      include: {
        listing: { select: { slug: true, title: true, price: true, currency: true, ...imgSel } },
        user: { select: { name: true } },
        agent: { select: { name: true, logo: true } },
      },
    });
    if (!conv || (me.role === "user" ? conv.userId !== me.id : conv.agentId !== me.id)) {
      return NextResponse.json({ ok: false, error: "Sohbet bulunamadı" }, { status: 404 });
    }
    const messages = await prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
    });
    await prisma.conversation.update({
      where: { id: convId },
      data: me.role === "user" ? { userReadAt: new Date() } : { agentReadAt: new Date() },
    });
    return NextResponse.json({
      ok: true,
      myRole: me.role,
      conversation: {
        id: conv.id,
        listing: conv.listing
          ? {
              slug: conv.listing.slug,
              title: conv.listing.title,
              price: conv.listing.price,
              currency: conv.listing.currency,
              image: absolutizeUrl(conv.listing.images[0]?.url ?? null, req),
            }
          : null,
        otherName: me.role === "user" ? conv.agent.name : conv.user.name,
        otherLogo: me.role === "user" ? absolutizeUrl(conv.agent.logo, req) : null,
      },
      messages,
    });
  }

  const convs = await prisma.conversation.findMany({
    where: me.role === "user" ? { userId: me.id } : { agentId: me.id },
    orderBy: { lastMessageAt: "desc" },
    include: {
      listing: { select: { slug: true, title: true, ...imgSel } },
      user: { select: { name: true } },
      agent: { select: { name: true, logo: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    take: 100,
  });

  const items = convs.map((c) => {
    const readAt = me.role === "user" ? c.userReadAt : c.agentReadAt;
    const last = c.messages[0];
    const unread = !!last && last.senderRole !== me.role && (!readAt || last.createdAt > readAt);
    return {
      id: c.id,
      listingSlug: c.listing?.slug ?? null,
      listingTitle: c.listing?.title ?? "İlan",
      listingImage: absolutizeUrl(c.listing?.images[0]?.url ?? null, req),
      otherName: me.role === "user" ? c.agent.name : c.user.name,
      otherLogo: me.role === "user" ? absolutizeUrl(c.agent.logo, req) : null,
      lastType: last?.type ?? "text",
      lastBody: last?.type === "offer" ? `Teklif: ${last.offerAmount} ${last.offerCurrency}` : last?.body ?? "",
      lastAt: c.lastMessageAt,
      unread,
    };
  });
  return NextResponse.json({ ok: true, myRole: me.role, items });
}

const sendSchema = z.object({
  conversationId: z.string().max(40).optional(),
  listingId: z.string().max(40).optional(),
  body: z.string().max(2000).optional(),
  offerAmount: z.number().int().positive().max(2_000_000_000).optional(),
  offerCurrency: z.enum(["TRY", "USD", "EUR"]).optional(),
});

// POST → mesaj/teklif gönder (mevcut sohbete) veya yeni sohbet başlat (kullanıcı, ilan üzerinden)
export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "messages", 40, 60_000);
  if (limited) return limited;
  const me = await getApiMessagingParticipant(req);
  if (!me) return NextResponse.json({ ok: false, error: "Giriş gerekli" }, { status: 401 });

  let data: z.infer<typeof sendSchema>;
  try {
    data = sendSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ ok: false, error: err.issues[0]?.message || "Form hatalı" }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
  }
  const isOffer = data.offerAmount != null;
  if (!isOffer && !data.body?.trim()) return NextResponse.json({ ok: false, error: "Boş mesaj gönderilemez" }, { status: 400 });

  let conv: { id: string; userId: string; agentId: string } | null = null;
  if (data.conversationId) {
    const c = await prisma.conversation.findUnique({ where: { id: data.conversationId }, select: { id: true, userId: true, agentId: true } });
    if (!c || (me.role === "user" ? c.userId !== me.id : c.agentId !== me.id)) {
      return NextResponse.json({ ok: false, error: "Sohbet bulunamadı" }, { status: 404 });
    }
    conv = c;
  } else {
    if (me.role !== "user") return NextResponse.json({ ok: false, error: "Sohbeti kullanıcı başlatır" }, { status: 400 });
    if (!data.listingId) return NextResponse.json({ ok: false, error: "İlan gerekli" }, { status: 400 });
    const listing = await prisma.listing.findUnique({ where: { id: data.listingId }, select: { id: true, agentId: true } });
    if (!listing?.agentId) return NextResponse.json({ ok: false, error: "Bu ilan için mesajlaşma yok." }, { status: 400 });
    conv = await prisma.conversation.upsert({
      where: { userId_listingId: { userId: me.id, listingId: listing.id } },
      update: {},
      create: { userId: me.id, agentId: listing.agentId, listingId: listing.id },
      select: { id: true, userId: true, agentId: true },
    });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderRole: me.role,
      type: isOffer ? "offer" : "text",
      body: data.body?.trim() || null,
      offerAmount: isOffer ? data.offerAmount : null,
      offerCurrency: isOffer ? data.offerCurrency || "TRY" : null,
      offerStatus: isOffer ? "pending" : null,
    },
  });
  await prisma.conversation.update({
    where: { id: conv.id },
    data: { lastMessageAt: new Date(), ...(me.role === "user" ? { userReadAt: new Date() } : { agentReadAt: new Date() }) },
  });

  const preview = isOffer ? "Yeni teklif aldınız" : "Yeni mesajınız var";
  if (me.role === "user") {
    notifyAgent(conv.agentId, { type: "message", title: preview, body: null, link: "/emlakci/panel/mesajlar" });
  } else {
    notifyUser(conv.userId, { type: "message", title: preview, body: null, link: "/hesabim/mesajlar" });
  }

  return NextResponse.json({ ok: true, conversationId: conv.id, message });
}
