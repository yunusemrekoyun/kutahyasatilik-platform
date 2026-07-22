import { NextRequest, NextResponse } from "next/server";
import { adviserProfileForApi } from "@/lib/publicDirectoryApi";
import { getPublicAgent } from "@/lib/publicDirectory";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const adviser = await getPublicAgent(slug);
    if (!adviser) {
      return NextResponse.json(
        { ok: false, error: "Danışman bulunamadı" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      ok: true,
      adviser: adviserProfileForApi(adviser, request),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Danışman alınamadı" },
      { status: 500 }
    );
  }
}
