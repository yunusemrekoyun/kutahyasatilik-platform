// IP rate limiter.
// REDIS_URL tanımlıysa Redis kullanır (çok-instance / restart'a dayanıklı, paylaşımlı);
// yoksa veya Redis erişilemezse bellek-içi fallback'e düşer (tek instance için yeterli).

import type { Redis } from "ioredis";

// --- Bellek-içi fallback (sliding window) ---
const buckets = new Map<string, number[]>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, arr] of buckets) {
    if (arr.length === 0 || now - arr[arr.length - 1] > 600_000) buckets.delete(k);
  }
}

function memoryAllow(key: string, limit: number, windowMs: number): boolean {
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

// --- Redis (varsa) ---
let redisPromise: Promise<Redis | null> | null = null;

function getRedis(): Promise<Redis | null> {
  if (redisPromise) return redisPromise;
  redisPromise = (async () => {
    const url = process.env.REDIS_URL;
    if (!url) return null;
    try {
      const { default: IORedis } = await import("ioredis");
      const client = new IORedis(url, {
        maxRetriesPerRequest: 2,
        enableOfflineQueue: false,
      });
      // Bağlantı hatasında uygulama çökmesin; sessizce memory fallback devreye girer.
      client.on("error", () => {});
      return client;
    } catch {
      return null;
    }
  })();
  return redisPromise;
}

// Fixed-window sayaç (INCR + PEXPIRE). Redis erişilemezse bellek-içine düşer.
async function allow(key: string, limit: number, windowMs: number): Promise<boolean> {
  const r = await getRedis();
  if (r) {
    try {
      const count = await r.incr(key);
      if (count === 1) await r.pexpire(key, windowMs);
      return count <= limit;
    } catch {
      // Redis anlık erişilemiyorsa bellek-içi fallback
    }
  }
  return memoryAllow(key, limit, windowMs);
}

// Gerçek ziyaretçi IP'si — rate-limit anahtarı.
// GÜVENLİK: İstemci-kontrollü başlıklara (cf-connecting-ip, x-forwarded-for) GÜVENİLMEZ.
// Önde güvenilen bir proxy (Cloudflare) YOKKEN istemci bu başlıkları forge edip her isteğe
// farklı IP yazarak rate-limit'i tamamen bypass edebilir. Bu yüzden:
//   • Varsayılan tek güvenilir kaynak: nginx'in $remote_addr ile YAZDIĞI x-real-ip
//     (nginx istemcinin gönderdiği değeri ezer → forge edilemez).
//   • Cloudflare devreye alınınca TRUST_CLOUDFLARE=1 set edilir; ancak o zaman CF'in her
//     istekte kendi yazdığı cf-connecting-ip okunur (ve nginx CF-dışı trafiği elemeli).
// x-forwarded-for yalnızca proxy'siz lokal geliştirmede son çaredir (üretimde buraya düşülmez).
export function getClientIp(req: Request): string {
  const h = req.headers;
  if (process.env.TRUST_CLOUDFLARE === "1") {
    const cf = h.get("cf-connecting-ip")?.trim();
    if (cf) return cf;
  }
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || "noip";
}

// Limit aşıldıysa standart 429 yanıtı üretir; aksi halde null döner.
export async function checkRate(
  req: Request,
  name: string,
  limit: number,
  windowMs: number
): Promise<Response | null> {
  const ip = getClientIp(req);
  const ok = await allow(`rl:${name}:${ip}`, limit, windowMs);
  if (!ok) {
    return new Response(
      JSON.stringify({ ok: false, error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
    );
  }
  return null;
}

// IP yerine verilen bir anahtara (örn. başvuru id'si) göre rate-limit.
// IP'den BAĞIMSIZ olduğu için forge edilemez; OTP üretimi gibi kaynak-başına limitlerde kullan.
// Limit aşılmadıysa true, aşıldıysa false döner.
export async function checkRateByKey(
  key: string,
  name: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  return allow(`rl:${name}:${key}`, limit, windowMs);
}
