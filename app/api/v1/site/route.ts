import { NextResponse } from "next/server";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

// Mobil için public site bilgisi (iletişim ekranı vb.). Yalnız genel/iletişim alanları;
// SITE tek kaynaktır (prod env değerleri burada yansır), mobil hardcode etmez.
export async function GET() {
  return NextResponse.json({
    ok: true,
    site: {
      name: SITE.name,
      brand: SITE.brand,
      phone: SITE.phone,
      phoneRaw: SITE.phoneRaw,
      whatsapp: SITE.whatsapp,
      email: SITE.email,
      address: SITE.address,
      url: SITE.url,
    },
  });
}
