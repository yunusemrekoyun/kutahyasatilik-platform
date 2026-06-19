import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/userAuth";
import { mergeFavoriteSlugs, favoriteCards } from "@/lib/favorites";

export const runtime = "nodejs";

// Giriş anında localStorage favorilerini hesaba birleştirir, güncel listeyi döner.
export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const slugs: string[] = Array.isArray(body?.slugs) ? body.slugs : [];
  try {
    await mergeFavoriteSlugs(session.userId, slugs);
    const items = await favoriteCards(session.userId);
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: true, items: [] });
  }
}
