import { NextRequest, NextResponse } from "next/server";
import { getLocalResources } from "@/lib/localResources";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type")?.trim() || undefined;
  const district = request.nextUrl.searchParams.get("district")?.trim() || undefined;

  try {
    const items = await getLocalResources({ type, district });
    return NextResponse.json({
      ok: true,
      items,
      externalLinks: true,
    });
  } catch {
    return NextResponse.json({ ok: true, items: [], externalLinks: true });
  }
}
