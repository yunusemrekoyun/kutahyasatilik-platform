import type { NextConfig } from "next";
import path from "path";

const isProd = process.env.NODE_ENV === "production";

// ---------------------------------------------------------------------------
// Content-Security-Policy
// İçeriği kırmamak için bilinen origin'lere izin verilir:
//  - gtag (Google Analytics / Ads)
//  - harita tile'ları (OpenStreetMap, img olarak) + uzak görseller (picsum/unsplash)
//  - ilan video/sanal tur iframe'leri (YouTube/Vimeo/Matterport + https tur sağlayıcıları)
// Geliştirmede HMR için 'unsafe-eval' ve ws: gerekir; üretimde kaldırılır.
// Not: 'unsafe-inline' (Next hydration + gtag inline) ileride nonce ile sıkılaştırılabilir.
// ---------------------------------------------------------------------------
const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'self'`,
  `form-action 'self'`,
  `img-src 'self' data: blob: https:`,
  `font-src 'self' data:`,
  `style-src 'self' 'unsafe-inline'`,
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net`,
  `connect-src 'self'${isProd ? "" : " ws: wss:"} https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://stats.g.doubleclick.net https://googleads.g.doubleclick.net https://www.googleadservices.com`,
  `frame-src 'self' https:`,
  `media-src 'self' https:`,
  `worker-src 'self' blob:`,
  `manifest-src 'self'`,
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HSTS yalnızca üretim HTTPS'inde gönderilir (localhost HTTP'yi bozmaz).
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  serverExternalPackages: ["pg", "sharp", "ioredis"],
  // sharp'ın native binary'sini (@img/sharp-linux-x64 vb.) standalone çıktısına zorla dahil et.
  // Aksi halde NFT trace dinamik native yüklemeyi kaçırır → standalone'da "Could not load sharp".
  outputFileTracingIncludes: {
    "/api/upload": ["./node_modules/@img/**", "./node_modules/sharp/**"],
    "/api/upload/seller": ["./node_modules/@img/**", "./node_modules/sharp/**"],
  },
  // Eski (v1) landing URL'leri kısa sluglara 301 — canlıda paylaşılmış/indexlenmiş
  // linkler kırılmasın, SEO değeri yeni adrese aksın.
  async redirects() {
    return [
      { source: "/kutahya-satilik-daire", destination: "/daire", permanent: true },
      { source: "/kutahya-satilik-arsa", destination: "/arsa", permanent: true },
      { source: "/kutahya-satilik-villa", destination: "/villa", permanent: true },
      { source: "/kutahya-yatirimlik-arsa", destination: "/yatirimlik-arsa", permanent: true },
      { source: "/kutahya-satilik-isyeri", destination: "/isyeri", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Arama sayfası dinamik (searchParams). Cloudflare'in kısa süre edge'de
        // tutabilmesi için s-maxage; cache key query string'i içermeli (Cloudflare
        // Cache Rule ile, DEPLOY.md'ye bakın). Tarayıcı cache'i yok (sadece paylaşımlı).
        source: "/ilanlar",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
