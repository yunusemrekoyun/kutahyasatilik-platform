import { NextResponse } from "next/server";
import { SITE } from "@/lib/site";
import { getSiteContact } from "@/lib/contact";

export const dynamic = "force-dynamic";

// Mobil için public site bilgisi (iletişim ekranı vb.). İletişim alanları admin > Ayarlar
// (Setting) kaynaklıdır (getSiteContact); mobil hardcode etmez.
export async function GET() {
  const c = await getSiteContact();
  return NextResponse.json({
    ok: true,
    site: {
      name: SITE.name,
      brand: SITE.brand,
      phone: c.phone,
      phoneRaw: c.phoneRaw,
      whatsapp: c.whatsapp,
      email: c.email,
      address: c.address,
      url: SITE.url,
    },
  });
}
