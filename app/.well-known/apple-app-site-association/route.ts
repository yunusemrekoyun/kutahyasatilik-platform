import { NextResponse } from "next/server";
import { buildAppleAppSiteAssociation } from "@/lib/appLinks";

export const dynamic = "force-dynamic";

export function GET() {
  const body = buildAppleAppSiteAssociation(
    process.env.APPLE_TEAM_ID,
    process.env.IOS_BUNDLE_ID,
  );

  if (!body) {
    return new NextResponse(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/json",
    },
  });
}
