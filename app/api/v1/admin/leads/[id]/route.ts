import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAdmin } from "@/lib/apiAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lead durum güncelle.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const status = String(body?.status ?? "");
  if (!["new", "contacted", "closed"].includes(status)) {
    return NextResponse.json({ ok: false, error: "Geçersiz durum" }, { status: 400 });
  }
  await prisma.lead.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true });
}

// Lead sil.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const { id } = await params;
  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// Satıcı talebini portföy fırsatına dönüştür (web promoteLeadToOpportunity parity).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (String(body?.action ?? "") !== "promote") {
    return NextResponse.json({ ok: false, error: "Geçersiz işlem" }, { status: 400 });
  }
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ ok: false, error: "Talep bulunamadı" }, { status: 404 });
  const rawPrice = lead.estimatedPrice ? Number(lead.estimatedPrice.replace(/[^\d]/g, "")) : NaN;
  const price = Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : null;
  const title = `${lead.propertyType || "Mülk"}${lead.district ? ` · ${lead.district}` : ""} — ${lead.name}`;
  const opp = await prisma.portfolioOpportunity.create({
    data: {
      leadId: lead.id, title, description: lead.message || null, district: lead.district,
      propertyType: lead.propertyType, estimatedPrice: price,
      biddingEndsAt: new Date(Date.now() + 7 * 24 * 3600_000),
    },
  });
  await prisma.lead.update({ where: { id }, data: { status: "closed" } });
  return NextResponse.json({ ok: true, opportunityId: opp.id });
}
