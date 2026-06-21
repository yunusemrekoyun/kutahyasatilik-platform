import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAgent } from "@/lib/apiAgent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Açık portföy fırsatları + emlakçının KENDİ teklifi (rakip teklifleri sızdırılmaz).
export async function GET(req: NextRequest) {
  const a = await resolveApiAgent(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const take = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("take")) || 50));
  try {
    const rows = await prisma.portfolioOpportunity.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "desc" },
      take,
      include: { bids: { where: { agentId: a.agent.id }, select: { commissionPct: true, note: true } } },
    });
    const items = rows.map((o) => ({
      id: o.id, title: o.title, description: o.description, district: o.district,
      propertyType: o.propertyType, estimatedPrice: o.estimatedPrice, areaGross: o.areaGross,
      rooms: o.rooms, biddingEndsAt: o.biddingEndsAt,
      myBid: o.bids[0] ? { commissionPct: o.bids[0].commissionPct, note: o.bids[0].note } : null,
    }));
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: true, items: [] }); // tablo migrate edilmemiş olabilir
  }
}
