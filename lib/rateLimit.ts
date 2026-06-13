// Basit, bellek-içi IP rate limiter (tek instance / standalone için yeterli).
// Sliding-window: her anahtar için son `windowMs` içindeki istek zaman damgalarını tutar.

const buckets = new Map<string, number[]>();
let lastSweep = 0;

function sweep(now: number) {
  // Ara sıra eski anahtarları temizle (bellek sızıntısını önle)
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, arr] of buckets) {
    if (arr.length === 0 || now - arr[arr.length - 1] > 600_000) buckets.delete(k);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
  const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    buckets.set(key, arr);
    return false; // limit aşıldı
  }
  arr.push(now);
  buckets.set(key, arr);
  return true;
}

export function getClientIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") || "unknown";
}

// Limit aşıldıysa standart 429 yanıtı üretir; aksi halde null döner.
export function checkRate(
  req: Request,
  name: string,
  limit: number,
  windowMs: number
): Response | null {
  const ip = getClientIp(req);
  if (!rateLimit(`${name}:${ip}`, limit, windowMs)) {
    return new Response(
      JSON.stringify({ ok: false, error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
    );
  }
  return null;
}
