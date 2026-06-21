import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAdmin } from "@/lib/apiAdmin";
import { parseJsonArray } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tüm talepler (admin) — tip/durum filtreli.
export async function GET(req: NextRequest) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const sp = req.nextUrl.searchParams;
  const tip = sp.get("tip")?.trim();
  const durum = sp.get("durum")?.trim();
  const rows = await prisma.lead.findMany({
    where: { ...(tip ? { type: tip } : {}), ...(durum ? { status: durum } : {}) },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, type: true, name: true, phone: true, email: true, message: true, status: true,
      district: true, neighborhood: true, propertyType: true, estimatedPrice: true, preferredDate: true,
      photos: true, createdAt: true,
      listing: { select: { id: true, title: true, slug: true } },
    },
  });
  const items = rows.map((l) => ({ ...l, photos: parseJsonArray(l.photos) }));
  return NextResponse.json({ ok: true, items });
}
