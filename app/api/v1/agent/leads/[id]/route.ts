import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAgent } from "@/lib/apiAgent";
import { parseJsonArray } from "@/lib/format";
import { LEAD_STATUS_FLOW } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 4-aşama akış (web ile parite). Eski app/istemci new/closed gönderse de normalize edilir.
const LEGACY_STATUS: Record<string, string> = { new: "received", closed: "resolved" };

// Tek talep detayı (sahiplik: lead.listing.agentId === agent) + durum güncelle.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await resolveApiAgent(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const { id } = await params;
  const l = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true, type: true, name: true, phone: true, email: true, message: true, status: true,
      district: true, neighborhood: true, propertyType: true, estimatedPrice: true, preferredDate: true,
      photos: true, createdAt: true,
      utmSource: true, referrer: true, pagePath: true,
      listing: { select: { id: true, title: true, slug: true, agentId: true } },
    },
  });
  if (!l || l.listing?.agentId !== a.agent.id) {
    return NextResponse.json({ ok: false, error: "Bulunamadı" }, { status: 404 });
  }
  const { listing, ...rest } = l;
  return NextResponse.json({
    ok: true,
    lead: {
      ...rest,
      photos: parseJsonArray(l.photos),
      listing: listing ? { id: listing.id, title: listing.title, slug: listing.slug } : null,
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await resolveApiAgent(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const raw = body?.status ? String(body.status) : "";
  const status = LEGACY_STATUS[raw] ?? raw;
  if (!LEAD_STATUS_FLOW.includes(status as (typeof LEAD_STATUS_FLOW)[number])) {
    return NextResponse.json({ ok: false, error: "Geçersiz durum" }, { status: 400 });
  }
  // Sahiplik filtresiyle birlikte güncelle (başkasının lead'i değişmesin).
  const res = await prisma.lead.updateMany({
    where: { id, listing: { is: { agentId: a.agent.id } } },
    data: { status },
  });
  if (res.count === 0) return NextResponse.json({ ok: false, error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
