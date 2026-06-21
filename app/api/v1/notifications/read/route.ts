import { NextRequest, NextResponse } from "next/server";
import { resolveApiSession } from "@/lib/apiAuth";
import { markRead, markAllRead } from "@/lib/notify";
import { checkRate } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Bildirim okundu işaretle — { id } tek, { all: true } hepsi.
export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "notif-read", 60, 60_000);
  if (limited) return limited;
  const session = await resolveApiSession(req);
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  try {
    if (body?.all) {
      await markAllRead(session.role, session.id);
    } else if (body?.id) {
      await markRead(String(body.id), session.role, session.id);
    } else {
      return NextResponse.json({ ok: false, error: "id veya all gerekli" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
