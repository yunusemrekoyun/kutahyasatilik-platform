import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAgent } from "@/lib/apiAgent";
import { parseJsonArray } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Emlakçının KENDİ ilanlarına gelen talepler (lead). Aitlik DOLAYLI: Lead.listing.agentId.
// Web panelinde yalnız sayaç vardı; bu gerçek liste mobil için additive.
export async function GET(req: NextRequest) {
  const a = await resolveApiAgent(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });

  const sp = req.nextUrl.searchParams;
  const type = sp.get("type");
  const status = sp.get("status");
  const listingId = sp.get("listingId");
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 50));

  try {
    const rows = await prisma.lead.findMany({
      where: {
        listing: { is: { agentId: a.agent.id } },
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        ...(listingId ? { listingId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true, type: true, name: true, phone: true, email: true, message: true, status: true,
        district: true, neighborhood: true, propertyType: true, estimatedPrice: true, preferredDate: true,
        photos: true, createdAt: true,
        listing: { select: { id: true, title: true, slug: true } },
      },
    });
    const items = rows.map((l) => ({ ...l, photos: parseJsonArray(l.photos) }));
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: true, items: [] });
  }
}
