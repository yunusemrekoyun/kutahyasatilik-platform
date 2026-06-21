import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAdmin } from "@/lib/apiAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tüm emlakçılar + ilan sayısı (admin yönetim ekranı).
export async function GET(req: NextRequest) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const rows = await prisma.agent.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true, name: true, email: true, phone: true, title: true, agency: true,
      status: true, note: true, approvedAt: true, createdAt: true,
      _count: { select: { listings: true } },
    },
  });
  const items = rows.map((g) => ({
    id: g.id, name: g.name, email: g.email, phone: g.phone, title: g.title, agency: g.agency,
    status: g.status, note: g.note, approvedAt: g.approvedAt, createdAt: g.createdAt,
    listingsCount: g._count.listings,
  }));
  return NextResponse.json({ ok: true, items });
}
