import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/userAuth";
import { favoriteCards, addFavoriteBySlug, removeFavoriteBySlug } from "@/lib/favorites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: giriş yoksa authed:false döner (401 yerine) — store anonim/sunucu ayrımını buradan yapar.
export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ ok: true, authed: false, items: [] });
  try {
    const items = await favoriteCards(session.userId);
    return NextResponse.json({ ok: true, authed: true, items });
  } catch {
    return NextResponse.json({ ok: true, authed: true, items: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const slug = typeof body?.slug === "string" ? body.slug : "";
  if (!slug) return NextResponse.json({ ok: false, error: "slug gerekli" }, { status: 400 });
  try {
    await addFavoriteBySlug(session.userId, slug);
  } catch {
    /* yoksay */
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const slug = typeof body?.slug === "string" ? body.slug : "";
  if (!slug) return NextResponse.json({ ok: false, error: "slug gerekli" }, { status: 400 });
  try {
    await removeFavoriteBySlug(session.userId, slug);
  } catch {
    /* yoksay */
  }
  return NextResponse.json({ ok: true });
}
