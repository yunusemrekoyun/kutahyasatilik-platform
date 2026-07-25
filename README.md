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
# .env içindeki AUTH_SECRET alanını `openssl rand -hex 32` çıktısıyla doldurun.
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

Canlı uygulama `/var/www/kutahyasatilik.com/app` dizininde,
`kutahyasatilik.service` ile standalone olarak `127.0.0.1:3003` üzerinde çalışır.
Kullanıcı medyası deploy dizininin dışında,
`/var/www/kutahyasatilik.com/uploads` altında kalıcıdır.

1. Temiz `main` çalışma ağacında `git pull --ff-only origin main` çalıştırın.
2. `npm ci`, `npx prisma migrate deploy` ve `npm run backfill:agencies` çalıştırın.
3. `npm run build`, `npm run prepare:standalone` ve `npm run check:standalone`
   kapılarını geçirin.
4. Yalnız `kutahyasatilik.service` servisini restart edin.
5. `http://127.0.0.1:3003/api/health` ve public health endpoint'ini doğrulayın.

`backfill:agencies` idempotenttir ve migration sonrasında her deploy’da güvenle çalıştırılabilir. Yalnız `agencyId` değeri boş eski kayıtları bağlar; oluşturduğu firmaları otomatik olarak onaylamaz veya kamuya yayınlamaz.

Production `.env` dosyası uygulama dizininde ve `0600` izniyle tutulmalıdır.
Bekleme/test döneminde `PUSH_ENABLED=false` kalır. Production'da demo/seed veya
veritabanı reset komutlarını çalıştırmayın. Güvenli kontroller ve rollback notları
[DEPLOY.md](./DEPLOY.md) içindedir.

## Secrets

`.env.example` yalnız sözleşmeyi gösterir. `DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET`,
e-posta sağlayıcı kimlik bilgileri, `EXPO_ACCESS_TOKEN`, Apple/Android doğrulama
değerleri ve Sentry anahtarları GitHub/EAS/production secret deposunda
tutulmalıdır. Sentry DSN tanımlı değilse uygulama normal çalışır; source map
yükleme yalnız `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` ve `SENTRY_PROJECT` birlikte varsa
etkinleşir.
