import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAgent } from "@/lib/apiAgent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = ["appointment", "expertise", "price_offer", "contact", "seller"] as const;

// Emlakçı dashboard sayaçları — kendi ilanlarına gelen talepler (tip dağılımı + yeni sayısı).
export async function GET(req: NextRequest) {
  const a = await resolveApiAgent(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });

  const owner = { listing: { is: { agentId: a.agent.id } } };
  try {
    const [total, fresh, ...perType] = await Promise.all([
      prisma.lead.count({ where: owner }),
      // "yeni/işlenmemiş" = ilk aşama (received); eski "new" satırları da dahil.
      prisma.lead.count({ where: { ...owner, status: { in: ["received", "new"] } } }),
      ...TYPES.map((t) => prisma.lead.count({ where: { ...owner, type: t } })),
    ]);
    const byType: Record<string, number> = {};
    TYPES.forEach((t, i) => (byType[t] = perType[i]));
    return NextResponse.json({ ok: true, total, new: fresh, byType });
  } catch {
    return NextResponse.json({ ok: true, total: 0, new: 0, byType: {} });
  }
}
