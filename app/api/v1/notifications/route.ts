import { NextRequest, NextResponse } from "next/server";
import { resolveApiSession } from "@/lib/apiAuth";
import { listNotificationsPage, unreadCount } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Bildirimler — her rol (user/agent/admin) kendi bildirimlerini görür. Bearer destekli.
export async function GET(req: NextRequest) {
  const session = await resolveApiSession(req);
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  try {
    const [items, unread] = await Promise.all([
      listNotificationsPage(
        session.role,
        session.id,
        Number(req.nextUrl.searchParams.get("limit")) || 20,
        req.nextUrl.searchParams.get("cursor") || undefined
      ),
      unreadCount(session.role, session.id),
    ]);
    return NextResponse.json({ ok: true, unread, items: items.items, nextCursor: items.nextCursor });
  } catch {
    return NextResponse.json({ ok: true, unread: 0, items: [], nextCursor: null });
  }
}
