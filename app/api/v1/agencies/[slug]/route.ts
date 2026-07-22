import { NextRequest, NextResponse } from "next/server";
import { agencyProfileForApi } from "@/lib/publicDirectoryApi";
import { getPublicAgency } from "@/lib/publicDirectory";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const agency = await getPublicAgency(slug);
    if (!agency) {
      return NextResponse.json(
        { ok: false, error: "Emlak ofisi bulunamadı" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, agency: agencyProfileForApi(agency, request) });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Emlak ofisi alınamadı" },
      { status: 500 }
    );
  }
}
