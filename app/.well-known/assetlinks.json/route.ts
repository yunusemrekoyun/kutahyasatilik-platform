import { NextResponse } from "next/server";
import { buildAndroidAssetLinks } from "@/lib/appLinks";

export const dynamic = "force-dynamic";

export function GET() {
  const body = buildAndroidAssetLinks(
    process.env.ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS,
    process.env.ANDROID_PACKAGE_NAME,
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
