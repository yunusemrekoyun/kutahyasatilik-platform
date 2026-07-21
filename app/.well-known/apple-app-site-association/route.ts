import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const bundleId = process.env.IOS_BUNDLE_ID?.trim() || "com.kutahyasatilik.app";
  const details = teamId
    ? [{ appID: `${teamId}.${bundleId}`, components: [{ "/": "/ilan/*" }, { "/": "/bildirimler*" }] }]
    : [];

  return NextResponse.json(
    { applinks: { apps: [], details } },
    { headers: { "Cache-Control": "public, max-age=3600", "Content-Type": "application/json" } },
  );
}
