import type { NextRequest } from "next/server";

// Mobil için görsel URL'lerini mutlaklaştırır.
// ÖNEMLİ: req.nextUrl.origin Next dev'de DAİMA "localhost" döner; telefon LAN IP'den
// (192.168.x.x) istediğinde localhost telefonun kendisi olur → görsel gelmez.
// O yüzden isteğin **Host başlığını** kullanırız (istemcinin gerçekten konuştuğu host).
// Üretimde NEXT_PUBLIC_MEDIA_URL (public media origin) öncelikli.
export function requestOrigin(req: NextRequest): string {
  const media = process.env.NEXT_PUBLIC_MEDIA_URL?.trim();
  if (media) return media.replace(/\/+$/, "");
  const host = req.headers.get("host");
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") || "http";
    return `${proto}://${host}`;
  }
  return req.nextUrl.origin;
}

export function absolutizeUrl(path: string | null, req: NextRequest): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = requestOrigin(req);
  return base + (path.startsWith("/") ? path : "/" + path);
}
