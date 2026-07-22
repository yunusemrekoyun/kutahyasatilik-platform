import { NextRequest, NextResponse } from "next/server";
import { adviserCardForApi } from "@/lib/publicDirectoryApi";
import { getPublicAgents } from "@/lib/publicDirectory";

export const dynamic = "force-dynamic";

function boundedInteger(value: string | null, fallback: number, maximum: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

export async function GET(request: NextRequest) {
  const page = boundedInteger(request.nextUrl.searchParams.get("page"), 1, 10_000);
  const perPage = boundedInteger(request.nextUrl.searchParams.get("perPage"), 12, 30);
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 80) || undefined;

  try {
    const result = await getPublicAgents(page, perPage, query);
    return NextResponse.json({
      ok: true,
      ...result,
      items: result.items.map((adviser) => adviserCardForApi(adviser, request)),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Danışmanlar alınamadı" },
      { status: 500 }
    );
  }
}
