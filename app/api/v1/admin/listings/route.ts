import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAdmin } from "@/lib/apiAdmin";
import { absolutizeUrl } from "@/lib/apiMedia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tüm ilanlar (admin) — arama (q) + sayfa + moderasyon filtresi. Onay ekranı için ?moderation=pending.
export async function GET(req: NextRequest) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const moderation = sp.get("moderation")?.trim();
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const perPage = 30;

  const where = {
    ...(moderation ? { moderationStatus: moderation } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { district: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  try {
    const [rows, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true, slug: true, title: true, price: true, currency: true, district: true,
          propertyType: true, listingType: true, status: true, moderationStatus: true, note: true,
          featured: true, verified: true, viewCount: true, createdAt: true,
          images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
          agent: { select: { name: true } },
          _count: { select: { leads: true } },
        },
      }),
      prisma.listing.count({ where }),
    ]);
    const items = rows.map((l) => ({
      id: l.id, slug: l.slug, title: l.title, price: l.price, currency: l.currency, district: l.district,
      propertyType: l.propertyType, listingType: l.listingType, status: l.status,
      moderationStatus: l.moderationStatus, note: l.note, featured: l.featured, verified: l.verified,
      viewCount: l.viewCount, coverImage: absolutizeUrl(l.images[0]?.url ?? null, req),
      agentName: l.agent?.name ?? null, leadsCount: l._count.leads, createdAt: l.createdAt,
    }));
    return NextResponse.json({ ok: true, items, total, page, perPage });
  } catch {
    return NextResponse.json({ ok: false, error: "İlanlar alınamadı" }, { status: 500 });
  }
}
