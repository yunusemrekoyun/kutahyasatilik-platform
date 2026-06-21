import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAdmin } from "@/lib/apiAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function str(v: unknown): string | null {
  const s = v === null || v === undefined ? "" : String(v).trim();
  return s === "" ? null : s;
}

// Portföy fırsatları + teklifler (admin) — düşük komisyon üstte.
export async function GET(req: NextRequest) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  try {
    const rows = await prisma.portfolioOpportunity.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        bids: {
          orderBy: { commissionPct: "asc" },
          select: { id: true, commissionPct: true, note: true, status: true, agent: { select: { name: true } } },
        },
      },
    });
    const items = rows.map((o) => ({
      id: o.id, title: o.title, description: o.description, district: o.district, propertyType: o.propertyType,
      estimatedPrice: o.estimatedPrice, areaGross: o.areaGross, rooms: o.rooms,
      status: o.status, biddingEndsAt: o.biddingEndsAt, listingId: o.listingId, createdAt: o.createdAt,
      bids: o.bids.map((b) => ({ id: b.id, commissionPct: b.commissionPct, note: b.note, status: b.status, agentName: b.agent?.name ?? null })),
    }));
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: true, items: [] });
  }
}

// Yeni fırsat oluştur (web createOpportunity parity).
export async function POST(req: NextRequest) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const title = String(body?.title ?? "").trim();
  if (!title) return NextResponse.json({ ok: false, error: "Başlık gerekli" }, { status: 400 });
  const days = num(body?.biddingDays) ?? 7;
  const opp = await prisma.portfolioOpportunity.create({
    data: {
      title,
      description: str(body?.description),
      district: str(body?.district),
      propertyType: str(body?.propertyType),
      estimatedPrice: num(body?.estimatedPrice),
      areaGross: num(body?.areaGross),
      rooms: str(body?.rooms),
      biddingEndsAt: new Date(Date.now() + days * 24 * 3600_000),
    },
  });
  return NextResponse.json({ ok: true, id: opp.id });
}
