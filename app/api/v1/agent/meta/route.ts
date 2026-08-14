import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAgent } from "@/lib/apiAgent";
import { PROPERTY_TYPES } from "@/lib/constants";
import { CATEGORY_LIST } from "@/lib/categories";

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
    // Kategori kaydı: alt türler ve nitelik alanları buradan gelir, mobil kopya
    // tutmaz. Yeni kategori eklemek mobil sürüm çıkmayı gerektirmez.
    categories: CATEGORY_LIST,
    // propertyTypes GERİYE UYUMLULUK için duruyor: sahadaki eski mobil sürümler
    // bu alanı okuyor. Yeni istemciler categories[].subTypes kullanmalı.
    propertyTypes: PROPERTY_TYPES,
    listingTypes: [{ value: "sale", label: "Satılık" }],
    currencies: ["TRY", "USD", "EUR"],
    quota: { limit: quota, used, remaining: quota == null ? null : Math.max(0, quota - used) },
  });
}
