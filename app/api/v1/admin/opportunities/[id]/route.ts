import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAdmin } from "@/lib/apiAdmin";
import { slugify, parseJsonArray } from "@/lib/format";
import { notifyAgent, notifyUser } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fırsat aksiyonları: action = select-winner (kazanan→atanmış ilan) | close.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const { id: opportunityId } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "");

  if (action === "close") {
    await prisma.portfolioOpportunity.update({ where: { id: opportunityId }, data: { status: "closed" } });
    return NextResponse.json({ ok: true });
  }

  if (action === "select-winner") {
    const bidId = String(body?.bidId ?? "");
    if (!bidId) return NextResponse.json({ ok: false, error: "Teklif seçilmeli" }, { status: 400 });

    const opp = await prisma.portfolioOpportunity.findUnique({ where: { id: opportunityId } });
    if (!opp) return NextResponse.json({ ok: false, error: "Fırsat bulunamadı" }, { status: 404 });
    if (opp.listingId) return NextResponse.json({ ok: false, error: "Bu fırsat zaten ilana dönüştürülmüş" }, { status: 400 });
    const bid = await prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid || bid.opportunityId !== opportunityId) return NextResponse.json({ ok: false, error: "Teklif bulunamadı" }, { status: 404 });

    const base = slugify(opp.title) || "ilan";
    let slug = base;
    let i = 1;
    while (await prisma.listing.findUnique({ where: { slug }, select: { id: true } })) slug = `${base}-${i++}`;
    const price = opp.estimatedPrice ?? 0;

    const created = await prisma.$transaction(async (tx) => {
      const claim = await tx.portfolioOpportunity.updateMany({
        where: { id: opportunityId, listingId: null },
        data: { status: "awarded" },
      });
      if (claim.count !== 1) return null;
      await tx.bid.updateMany({ where: { opportunityId }, data: { status: "lost" } });
      await tx.bid.update({ where: { id: bidId }, data: { status: "won" } });
      const listing = await tx.listing.create({
        data: {
          slug, title: opp.title, description: opp.description || opp.title,
          propertyType: opp.propertyType || "daire", listingType: "sale",
          status: "active", moderationStatus: "pending", agentId: bid.agentId,
          price, district: opp.district || "Merkez", areaGross: opp.areaGross, rooms: opp.rooms,
        },
      });
      // Kaynak satıcı talebindeki (Lead) fotoğrafları ilana taşı — yoksa ilan görselsiz doğar → placeholder.
      if (opp.leadId) {
        const lead = await tx.lead.findUnique({ where: { id: opp.leadId }, select: { photos: true } });
        const urls = parseJsonArray(lead?.photos).filter((u) => typeof u === "string" && u.length > 0);
        if (urls.length) {
          await tx.listingImage.createMany({ data: urls.map((url, i) => ({ listingId: listing.id, url, sortOrder: i })) });
        }
      }
      if (price > 0) await tx.priceHistory.create({ data: { listingId: listing.id, price } });
      await tx.portfolioOpportunity.update({ where: { id: opportunityId }, data: { status: "listed", listingId: listing.id } });
      return listing;
    });
    if (!created) return NextResponse.json({ ok: false, error: "Bu fırsat için kazanan zaten seçilmiş" }, { status: 400 });

    await notifyAgent(bid.agentId, {
      type: "system",
      title: "Portföy fırsatını kazandınız",
      body: `${opp.title} — size atanmış ilan oluşturuldu (onay bekliyor, düzenleyebilirsiniz).`,
      link: "/emlakci/panel",
    });
    const losers = await prisma.bid.findMany({ where: { opportunityId, status: "lost" }, select: { agentId: true } });
    for (const l of losers) {
      if (l.agentId !== bid.agentId) {
        await notifyAgent(l.agentId, { type: "system", title: "Portföy teklifi sonuçlandı", body: `${opp.title} fırsatında başka bir teklif kazandı.`, link: "/emlakci/panel/firsatlar" });
      }
    }
    if (opp.userId) {
      await notifyUser(opp.userId, { type: "system", title: "Talebiniz ilana dönüştü", body: `${opp.title} için bir danışman atandı; ilanınız hazırlanıyor.`, link: "/hesabim" });
    }
    return NextResponse.json({ ok: true, listingId: created.id });
  }

  return NextResponse.json({ ok: false, error: "Geçersiz işlem" }, { status: 400 });
}
