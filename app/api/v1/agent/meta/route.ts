import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAgent } from "@/lib/apiAgent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// İlan formu için sabit seçenekler + emlakçının kalan ilan kotası (mobil hard-code etmesin).
export async function GET(req: NextRequest) {
  const a = await resolveApiAgent(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });

  let quota: number | null = null;
  try {
    const pkg = await prisma.package.findFirst({ orderBy: { createdAt: "asc" }, select: { listingQuota: true } });
    quota = pkg?.listingQuota ?? null;
  } catch {
    quota = null;
  }
  const used = await prisma.listing.count({ where: { agentId: a.agent.id } });

  return NextResponse.json({
    ok: true,
    propertyTypes: [
      { value: "daire", label: "Daire" },
      { value: "villa", label: "Villa" },
      { value: "mustakil", label: "Müstakil Ev" },
      { value: "isyeri", label: "İşyeri / Dükkan" },
      { value: "arsa", label: "Arsa" },
      { value: "tarla", label: "Tarla" },
    ],
    listingTypes: [
      { value: "sale", label: "Satılık" },
      { value: "rent", label: "Kiralık" },
    ],
    currencies: ["TRY", "USD", "EUR"],
    quota: { limit: quota, used, remaining: quota == null ? null : Math.max(0, quota - used) },
  });
}
