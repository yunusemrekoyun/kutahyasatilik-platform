# Kütahya Satılık — Web ve API

Kütahya odaklı emlak portalının Next.js web arayüzü, yönetim ekranları ve mobil uygulamanın kullandığı `/api/v1` backend’i.

## Kapsam

- İlan listeleme, arama, detay, galeri, harita, favori ve karşılaştırma
- Satıcı, ekspertiz, randevu ve alıcı talep akışları
- Bölgesel verilere dayalı ön değerleme ve veri destekli bölge analizi
- Kullanıcı, danışman ve admin oturumları; web bildirim kutusu ve Expo push outbox’ı
- Canonical/OG/Twitter metadata, sitemap, robots ve izin sonrası analytics
- PostgreSQL, Redis, kalıcı medya dizini, standalone Next.js ve opsiyonel Sentry

Değerleme ve bölge analizi bilgilendirme amaçlıdır; resmi ekspertiz veya yatırım tavsiyesi değildir.

## Teknoloji

- Next.js 16.2 · React 19.2 · TypeScript · Tailwind CSS 4
- Prisma 7 + PostgreSQL (`@prisma/adapter-pg`)
- Expo Push Service · Redis destekli rate limit · Sentry (opsiyonel)

## Yerel kurulum

Node.js 24 ve PostgreSQL 17 önerilir.

```bash
cp .env.example .env
npm ci
npx prisma migrate deploy
npm run dev
```

Gerçek/canlı veri kullanılan ortamlarda seed komutlarını çalıştırmayın. Demo kurulumu yalnız boş yerel veritabanı için `npm run setup:demo` ile yapılır.

## Kalite kapıları

```bash
npm run lint
npm run typecheck
npm test
npm run audit:runtime
npm run build
npm run check:standalone
npm run test:e2e
```

Playwright ilk kullanımında Chromium kurulumu gerekir: `npx playwright install chromium`.

## Production yayın sırası

1. PostgreSQL yedeğini doğrulayın ve `npx prisma migrate deploy` çalıştırın.
2. `npm run backfill:agencies` ile eski danışman firma metinlerini yeni firma ilişkilerine bağlayın.
3. `PUSH_ENABLED=false` ile backend’i yayınlayın.
4. `npm run build && npm run check:standalone` kapılarını geçirin.
5. `npm run prepare:standalone` ile statik dosyaları, yerel yüklemeleri pakete katmadan hazırlayın.
6. `npm run start:standalone` ile başlatın ve `/api/health` kontrolünü yapın.
7. Fiziksel cihaz push testi sonrasında `PUSH_ENABLED=true` yapın.

`backfill:agencies` idempotenttir ve migration sonrasında her deploy’da güvenle çalıştırılabilir. Yalnız `agencyId` değeri boş eski kayıtları bağlar; oluşturduğu firmaları otomatik olarak onaylamaz veya kamuya yayınlamaz.

`UPLOAD_DIR` deploy klasörünün dışında kalıcı bir dizin olmalı; `NEXT_PUBLIC_MEDIA_URL` bu dizini HTTPS üzerinden sunan hostu göstermelidir. Ayrıntılı VPS/Cloudflare akışı [DEPLOY.md](./DEPLOY.md) içindedir.

## Secrets

`.env.example` yalnız sözleşmeyi gösterir. `DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET`, `EXPO_ACCESS_TOKEN`, Apple/Android doğrulama değerleri ve Sentry anahtarları GitHub/EAS/production secret deposunda tutulmalıdır. Sentry DSN tanımlı değilse uygulama normal çalışır; source map yükleme yalnız `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` ve `SENTRY_PROJECT` birlikte varsa etkinleşir.
