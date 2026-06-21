import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAgent } from "@/lib/apiAgent";
import { notifyAdmins } from "@/lib/notify";

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

// Portföy fırsatına komisyon teklifi ver/güncelle (web submitBid parity, upsert).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await resolveApiAgent(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const commissionPct = num(body?.commissionPct);
  if (commissionPct === null || commissionPct < 0 || commissionPct > 100) {
    return NextResponse.json({ ok: false, error: "Geçerli bir komisyon yüzdesi girin (0–100)" }, { status: 400 });
  }
  const opp = await prisma.portfolioOpportunity.findUnique({
    where: { id },
    select: { status: true, biddingEndsAt: true, title: true },
  });
  if (!opp || opp.status !== "open") return NextResponse.json({ ok: false, error: "Bu fırsat tekliflere kapalı" }, { status: 400 });
  if (opp.biddingEndsAt && opp.biddingEndsAt < new Date()) {
    return NextResponse.json({ ok: false, error: "Teklif süresi doldu" }, { status: 400 });
  }
  const note = str(body?.note);
  await prisma.bid.upsert({
    where: { opportunityId_agentId: { opportunityId: id, agentId: a.agent.id } },
    create: { opportunityId: id, agentId: a.agent.id, commissionPct, note },
    update: { commissionPct, note, status: "active" },
  });
  await notifyAdmins({
    type: "system",
    title: "Portföy fırsatına yeni teklif",
    body: `${a.agent.name} · %${commissionPct} — ${opp.title}`,
    link: "/admin/firsatlar",
  }).catch(() => {});
  return NextResponse.json({ ok: true });
}
