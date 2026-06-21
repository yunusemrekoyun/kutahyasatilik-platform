import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requestOrigin } from "@/lib/apiMedia";

export const dynamic = "force-dynamic";

// Blog yazıları (yayınlanmış) — mobil liste.
function absolutize(path: string | null, origin: string): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = (process.env.NEXT_PUBLIC_MEDIA_URL?.trim() || origin).replace(/\/+$/, "");
  return base + (path.startsWith("/") ? path : "/" + path);
}

export async function GET(req: NextRequest) {
  try {
    const rows = await prisma.post.findMany({
      where: { status: "published" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        author: true,
        publishedAt: true,
        createdAt: true,
      },
    });
    const origin = requestOrigin(req);
    const items = rows.map((p) => ({ ...p, coverImage: absolutize(p.coverImage, origin) }));
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: true, items: [] });
  }
}
