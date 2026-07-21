import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const fingerprints = (process.env.ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const body = fingerprints.length
    ? [{
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: process.env.ANDROID_PACKAGE_NAME?.trim() || "com.kutahyasatilik.app",
          sha256_cert_fingerprints: fingerprints,
        },
      }]
    : [];

  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, max-age=3600", "Content-Type": "application/json" },
  });
}
