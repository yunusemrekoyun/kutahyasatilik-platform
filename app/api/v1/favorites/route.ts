import { NextRequest, NextResponse } from "next/server";
import { checkRate } from "@/lib/rateLimit";
import { resolveApiSession } from "@/lib/apiAuth";
import { favoriteCards, addFavoriteBySlug, removeFavoriteBySlug } from "@/lib/favorites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Favoriler — yalnız standart kullanıcı (role: user). Web cookie akışıyla aynı mantık,
// Bearer destekli (mobil). lib/favorites yeniden kullanılır.

function absolutize(path: string | null, origin: string): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = (process.env.NEXT_PUBLIC_MEDIA_URL?.trim() || origin).replace(/\/+$/, "");
  return base + (path.startsWith("/") ? path : "/" + path);
}

async function readSlug(req: NextRequest): Promise<string> {
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  return typeof body?.slug === "string" ? body.slug : "";
}

export async function GET(req: NextRequest) {
  const session = await resolveApiSession(req);
  if (!session || session.role !== "user") {
    return NextResponse.json({ ok: true, authed: false, items: [] });
  }
  try {
    const origin = req.nextUrl.origin;
    const cards = await favoriteCards(session.id);
    const items = cards.map((c) => ({ ...c, coverImage: absolutize(c.coverImage, origin) }));
    return NextResponse.json({ ok: true, authed: true, items });
  } catch {
    return NextResponse.json({ ok: true, authed: true, items: [] });
  }
}

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "fav-write", 60, 60_000);
  if (limited) return limited;
  const session = await resolveApiSession(req);
  if (!session || session.role !== "user") {
    return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  }
  const slug = await readSlug(req);
  if (!slug) return NextResponse.json({ ok: false, error: "slug gerekli" }, { status: 400 });
  try {
    await addFavoriteBySlug(session.id, slug);
  } catch {
    /* yoksay */
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const limited = await checkRate(req, "fav-write", 60, 60_000);
  if (limited) return limited;
  const session = await resolveApiSession(req);
  if (!session || session.role !== "user") {
    return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  }
  const slug = await readSlug(req);
  if (!slug) return NextResponse.json({ ok: false, error: "slug gerekli" }, { status: 400 });
  try {
    await removeFavoriteBySlug(session.id, slug);
  } catch {
    /* yoksay */
  }
  return NextResponse.json({ ok: true });
}
