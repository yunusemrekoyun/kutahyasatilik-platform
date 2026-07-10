import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAgent } from "@/lib/apiAgent";
import { absolutizeUrl } from "@/lib/apiMedia";
import { upsertAgentListing, AgentListingError } from "@/lib/apiAgentListing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Emlakçının KENDİ ilanları (dashboard listesi + istatistik) + yeni ilan oluştur.
export async function GET(req: NextRequest) {
  const a = await resolveApiAgent(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const perPage = Math.min(50, Math.max(1, Number(sp.get("perPage")) || 20));
  const statusFilter = sp.get("status");

  try {
    const [rows, total, all] = await Promise.all([
      prisma.listing.findMany({
        where: { agentId: a.agent.id, ...(statusFilter ? { status: statusFilter } : {}) },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true, slug: true, title: true, price: true, currency: true, district: true,
          propertyType: true, listingType: true, status: true, moderationStatus: true, note: true, createdAt: true,
          viewCount: true,
          images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
          _count: { select: { leads: true, favorites: true } },
        },
      }),
      prisma.listing.count({ where: { agentId: a.agent.id, ...(statusFilter ? { status: statusFilter } : {}) } }),
      prisma.listing.findMany({ where: { agentId: a.agent.id }, select: { moderationStatus: true } }),
    ]);

    const counts = {
      total: all.length,
      pending: all.filter((l) => l.moderationStatus === "pending").length,
      approved: all.filter((l) => l.moderationStatus === "approved").length,
      rejected: all.filter((l) => l.moderationStatus === "rejected").length,
    };
    const items = rows.map((l) => ({
      id: l.id, slug: l.slug, title: l.title, price: l.price, currency: l.currency,
      district: l.district, propertyType: l.propertyType, listingType: l.listingType,
      status: l.status, moderationStatus: l.moderationStatus, note: l.note,
      coverImage: absolutizeUrl(l.images[0]?.url ?? null, req),
      leadsCount: l._count.leads, favoritesCount: l._count.favorites, viewCount: l.viewCount,
      createdAt: l.createdAt,
    }));
    return NextResponse.json({ ok: true, items, total, page, perPage, counts });
  } catch {
    return NextResponse.json({ ok: false, error: "İlanlar alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const a = await resolveApiAgent(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
  try {
    const r = await upsertAgentListing(a.agent.id, null, body);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    if (e instanceof AgentListingError) return NextResponse.json({ ok: false, error: e.message }, { status: e.status });
    return NextResponse.json({ ok: false, error: "İlan kaydedilemedi" }, { status: 500 });
  }
}
