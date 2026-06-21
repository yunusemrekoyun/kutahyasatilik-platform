import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRate } from "@/lib/rateLimit";
import { estimateValue } from "@/lib/valuation";
import { getDistrictStatsObject } from "@/lib/districtStats";

// "Evimin değeri" — web ValuationTool ile aynı motor (lib/valuation.estimateValue),
// ilçe ortalamalarından deterministik aralık (Merkez fallback).
const schema = z.object({
  propertyType: z.string().min(1).max(40),
  district: z.string().min(1).max(80),
  area: z.number().positive().max(10_000_000),
  rooms: z.string().max(20).optional(),
});

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "v1-valuation", 30, 60_000);
  if (limited) return limited;

  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: err.issues[0]?.message || "Form hatalı" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
  }

  let stats: Awaited<ReturnType<typeof getDistrictStatsObject>> = {};
  try {
    stats = await getDistrictStatsObject();
  } catch {
    /* boş */
  }

  const result = estimateValue(
    { propertyType: data.propertyType, district: data.district, area: data.area, rooms: data.rooms },
    stats[data.district] ?? null,
    stats["Merkez"],
  );

  if (!result) {
    return NextResponse.json({ ok: false, error: "Bu seçim için tahmin üretilemedi." }, { status: 422 });
  }
  return NextResponse.json({ ok: true, result });
}
