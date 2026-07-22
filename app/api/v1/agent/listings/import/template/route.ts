import { NextResponse } from "next/server";
import { csvTemplate } from "@/lib/csv";
import { LISTING_IMPORT_HEADERS } from "@/lib/listingImport";

export async function GET() {
  return new NextResponse(csvTemplate([...LISTING_IMPORT_HEADERS]), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kutahya-ilan-aktarim-sablonu.csv"',
      "Cache-Control": "no-store",
    },
  });
}
