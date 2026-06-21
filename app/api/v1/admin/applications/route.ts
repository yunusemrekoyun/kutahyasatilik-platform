import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAdmin } from "@/lib/apiAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Danışman başvuruları + teklifleri (admin).
export async function GET(req: NextRequest) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const rows = await prisma.agentApplication.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      offers: {
        orderBy: { version: "desc" },
        select: { version: true, snapshotName: true, snapshotPrice: true, interval: true, status: true, viewedAt: true, acceptedAt: true, validUntil: true },
      },
    },
  });
  return NextResponse.json({ ok: true, items: rows });
}
