import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function absolutize(path: string | null, origin: string): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = (process.env.NEXT_PUBLIC_MEDIA_URL?.trim() || origin).replace(/\/+$/, "");
  return base + (path.startsWith("/") ? path : "/" + path);
}

// Tek blog yazısı (yayınlanmış) — içerik HTML olarak döner (mobil sade metne çevirir).
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await prisma.post.findFirst({
    where: { slug, status: "published" },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      coverImage: true,
      author: true,
      tags: true,
      publishedAt: true,
      createdAt: true,
    },
  });
  if (!p) return NextResponse.json({ ok: false, error: "Yazı bulunamadı" }, { status: 404 });
  return NextResponse.json({
    ok: true,
    post: { ...p, coverImage: absolutize(p.coverImage, req.nextUrl.origin) },
  });
}
