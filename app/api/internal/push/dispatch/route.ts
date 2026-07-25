import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { checkPushReceipts, dispatchPendingPushes } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = req.headers.get("authorization");
  const provided = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
  const secretBytes = Buffer.from(secret || "");
  const providedBytes = Buffer.from(provided);
  const authorized =
    Boolean(secret && secret.length >= 32) &&
    secretBytes.length === providedBytes.length &&
    timingSafeEqual(secretBytes, providedBytes);

  if (!authorized) {
    return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  }
  const [dispatch, receipts] = await Promise.all([dispatchPendingPushes(), checkPushReceipts()]);
  return NextResponse.json({ ok: true, dispatch, receipts, enabled: process.env.PUSH_ENABLED === "true" });
}
