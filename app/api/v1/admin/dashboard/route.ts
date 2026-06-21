import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAdmin } from "@/lib/apiAdmin";
import { getAnalyticsStats } from "@/lib/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin dashboard özeti — analitik (5dk cache) + aksiyon gerektiren sayaçlar.
export async function GET(req: NextRequest) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });

  const [
    analytics,
    totalLeads,
    newLeads,
    activeListings,
    soldListings,
    pendingListings,
    pendingApplications,
    pendingAgents,
    totalAgents,
    openOpportunities,
  ] = await Promise.all([
    getAnalyticsStats().catch(() => null),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "new" } }),
    prisma.listing.count({ where: { status: "active" } }),
    prisma.listing.count({ where: { status: "sold" } }),
    prisma.listing.count({ where: { moderationStatus: "pending" } }),
    prisma.agentApplication.count({ where: { status: { notIn: ["activated", "rejected"] } } }),
    prisma.agent.count({ where: { status: "pending" } }),
    prisma.agent.count(),
    prisma.portfolioOpportunity.count({ where: { status: "open" } }).catch(() => 0),
  ]);

  return NextResponse.json({
    ok: true,
    counts: {
      totalLeads,
      newLeads,
      activeListings,
      soldListings,
      pendingListings,
      pendingApplications,
      pendingAgents,
      totalAgents,
      openOpportunities,
    },
    analytics,
  });
}
