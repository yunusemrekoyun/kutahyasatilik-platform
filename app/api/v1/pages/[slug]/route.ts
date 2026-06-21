import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Tek CMS sayfası (yayınlanmış) — Hakkımızda / KVKK gibi kurumsal sayfalar.
// İçerik HTML olarak döner (mobil sade metne çevirir; web ile aynı kaynak: prisma.page).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const p = await prisma.page.findFirst({
      where: { slug, status: "published" },
      select: {
        slug: true,
        title: true,
        content: true,
        metaTitle: true,
        metaDescription: true,
        updatedAt: true,
      },
    });
    if (!p) return NextResponse.json({ ok: false, error: "Sayfa bulunamadı" }, { status: 404 });
    return NextResponse.json({ ok: true, page: p });
  } catch {
    return NextResponse.json({ ok: false, error: "Sayfa alınamadı" }, { status: 500 });
  }
}
