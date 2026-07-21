# Deploy Rehberi — Hostinger VPS + Cloudflare + Supabase

Bu doküman, kod hazır olduğunda canlıya alma adımlarıdır. Uygulama katmanı
"ölçek-hazır" yazıldı; burada **kurulum + Cloudflare + doğrulama** yapılır.

Mimari: Cloudflare (CDN/cache/WAF) → nginx (TLS, /uploads, gerçek IP) → Next.js
standalone (PM2/systemd) → Supabase Postgres + Redis. Medya VPS diskinde, `media.`
subdomain + Cloudflare ile servis. Yedek: pg_dump → R2.

---

## 0. Mevcut ESKİ sürümü kaldırma (VPS'te eski site yayında)

VPS'te bu sitenin eski sürümü çalışıyor. Yeni sürüme geçmeden önce:

- [ ] **VERİ KARARI — önce buna karar ver (geri alınamaz):** Eski canlı sitede
  korunması gereken gerçek veri var mı (toplanmış lead / ilan / görsel)?
  - **Hayır / demo** → eski veriyi at, sıfırdan Supabase ile başla.
  - **Evet** → eski veriyi taşı: eski sürüm SQLite ise `dev.db`'yi ve `uploads`'u
    yedekle; veriyi Supabase'e aktar (ayrı bir migrasyon işi — SQLite satırlarını
    Postgres'e taşıma). **Emin olmadan eski DB/sunucuyu SİLME.**
- [ ] Eski uygulamayı durdur (`pm2 stop ...` / `systemctl stop <eski-servis>` / `docker compose down`).
- [ ] Eski sürümün `.env`, DB dosyası ve `uploads` dizinini **yedekle** (silmeden önce, off-site).
- [ ] Eski nginx site config'ini kaldır/devre dışı bırak (port 80/443 + domain çakışmasın).
- [ ] Domaini Cloudflare'e taşıyınca eski DNS kayıtlarını/SSL'i temizle.
- [ ] Boşalan portu/diski doğrula; yeni sürümü ayrı temiz bir dizine kur.

## 1. Ön hazırlık (servisler)

- [ ] **Supabase** projesi aç (bölge: Hostinger'a en yakın, ör. Frankfurt/eu-central).
  - Connection string'leri al: **pooled** (port 6543, transaction mode) + **direct** (5432).
- [ ] **Cloudflare** hesabına domaini ekle, nameserver'ları Cloudflare'e yönlendir.
- [ ] **Cloudflare R2** bucket'ı aç (yedekler + ileride medya master'ı için). `rclone` remote'u: `r2`.
- [ ] Hostinger **KVM4** VPS (Ubuntu LTS).

## 2. VPS temel kurulum

```bash
# Node (nvm ile, repo .nvmrc = 24)
nvm install 24 && nvm use 24
# Gerekli araçlar
sudo apt update && sudo apt install -y nginx postgresql-client redis-server rclone
# Redis (lokal) çalışıyor mu
sudo systemctl enable --now redis-server
```

- [ ] Ayrı yetkisiz kullanıcı ile çalıştır (`adduser kutahya`), repo onun home'unda.
- [ ] Firewall: yalnızca 22/80/443 (`ufw allow 22,80,443`).
- [ ] SSH parola girişi kapalı, anahtar tabanlı.

## 3. Uygulama

```bash
git clone <repo> && cd kutahyasatilikguncel
npm ci
# .env oluştur (aşağıdaki değişkenler). DİKKAT: build, generateStaticParams + ISR
# prerender için DB'ye bağlanır → DATABASE_URL erişilebilir OLMALI (migrate'ten sonra).
npx prisma migrate deploy        # şema + index'ler
# Demo veri İSTENMİYORSA seed çalıştırma. Sadece ilk demo için: npm run seed
npm run build

# output: "standalone" → statik dosyaları hazırla; public/uploads release paketine alınmaz:
npm run prepare:standalone
```

> Güncelleme (yeni deploy): `git pull && npm ci && npx prisma migrate deploy && npm run build`
> + `npm run prepare:standalone` + `systemctl restart kutahya`. `uploads` UPLOAD_DIR'de (app dışında)
> durduğu için deploy'lar arasında korunur.

`.env` (canlı):
```
DATABASE_URL="<supabase pooled / 6543 ?pgbouncer=true>"
DIRECT_URL="<supabase direct / 5432>"
REDIS_URL="redis://localhost:6379"
UPLOAD_DIR="/var/www/kutahya/uploads"     # kalıcı, nginx ile servis edilen dizin
AUTH_SECRET="<32+ byte rastgele>"
ADMIN_EMAIL / ADMIN_PASSWORD              # ilk admin (sonra değiştir)
NEXT_PUBLIC_SITE_URL="https://kutahyasatilik.com"
NEXT_PUBLIC_MEDIA_URL="https://media.kutahyasatilik.com"
NEXT_PUBLIC_PHONE / WHATSAPP / EMAIL
NEXT_PUBLIC_GA_ID / GTAG_ID / ADS_CONVERSION_LABEL
CRON_SECRET="<ayrı, güçlü rastgele değer>"
PUSH_ENABLED="false"                       # fiziksel cihaz testi sonrası true
EXPO_ACCESS_TOKEN="<Expo erişim tokenı>"
APPLE_TEAM_ID / IOS_BUNDLE_ID
ANDROID_PACKAGE_NAME / ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS
SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN          # opsiyonel
SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN  # source map yükleme, opsiyonel
```

Başlatma (standalone — `next start` DEĞİL):
```bash
npm run start:standalone
```
PM2 veya systemd ile:
```ini
# /etc/systemd/system/kutahya.service
[Service]
WorkingDirectory=/home/kutahya/kutahyasatilikguncel
ExecStart=/home/kutahya/.nvm/versions/node/v24.x/bin/node .next/standalone/server.js
Environment=PORT=3000 NODE_ENV=production
Restart=always
User=kutahya
[Install]
WantedBy=multi-user.target
```
> Not: `npm run prepare:standalone`, `public/uploads` dışındaki public dosyaları ve
> `.next/static` çıktısını standalone altına kopyalar. Kullanıcı medyası kalıcı `UPLOAD_DIR`'da kalır.

## 4. nginx (origin)

```nginx
server {
  listen 80;
  server_name kutahyasatilik.com media.kutahyasatilik.com;
  client_max_body_size 12m;                       # upload gövde limiti

  # Yüklenen görseller: doğrudan diskten (Node'a uğramadan), uzun cache
  location /uploads/ {
    alias /var/www/kutahya/uploads/;
    add_header Cache-Control "public, max-age=31536000, immutable";
    access_log off;
  }

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    # Gerçek ziyaretçi IP'si (Cloudflare CF-Connecting-IP'yi iletir; uygulama bunu okur)
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```
- [ ] TLS: Cloudflare **Origin Certificate** kur + 443 dinle (veya certbot). SSL modu **Full (strict)**.
- [ ] `media.` subdomain'i de bu origin'e (veya ileride R2'ye) yönlendir.

## 5. Cloudflare — DNS & SSL

- [ ] `A` kayıtları: `@`, `www`, `media` → VPS IP, **Proxied (turuncu bulut)**.
- [ ] SSL/TLS modu: **Full (strict)**. "Always Use HTTPS" açık.
- [ ] Speed: **Brotli**, **HTTP/3 (QUIC)**, **0-RTT**, **Early Hints** açık.
- [ ] Network: **Tiered Cache** (Smart) açık. **Always Online** açık.

## 6. Cloudflare — Cache Rules (ölçeğin asıl çarpanı)

Uygulama zaten doğru `Cache-Control` üretiyor (ISR sayfaları `s-maxage`, /uploads
`immutable`, admin/api `no-store`). Cloudflare'in bunlara saygı duyması + edge'de
tutması için:

- [ ] **Statik/medya — agresif cache** (Cache Rule):
  - Eğer URI path `/uploads/`, `/_next/static/`, `/_next/image` ile başlıyorsa →
    *Eligible for cache*, **Edge TTL: respect origin** (veya 1 yıl), Browser TTL: 1 yıl.
  - `media.` subdomain → tüm istekler cache (statik görseller).
- [ ] **Arama sayfası — kısa edge cache** (`/ilanlar`):
  - *Cache eligible*, **Cache key** → query string'i DAHİL ET, Edge TTL: respect origin
    (uygulama `s-maxage=60` veriyor). Çerez varsa **bypass**.
- [ ] **Kimlikli sayfalar — ASLA cache** (en üst öncelik):
  - URI path `/admin` veya `/emlakci/panel` veya `/api/` ile başlıyorsa **Bypass cache**.
  - İstek `ks_admin` veya `ks_agent` çerezi içeriyorsa **Bypass cache**.
- [ ] ISR HTML (ana sayfa, ilan detayı, landing, blog) origin `s-maxage` verir;
  default olarak Cloudflare HTML cache'lemez → bunlar için **Cache Rule**: GET + path
  bu sayfalar + çerez yok → *Cache eligible*, Edge TTL: respect origin.

## 7. Cloudflare — Güvenlik

- [ ] **WAF**: Managed Ruleset açık. **Bot Fight Mode** açık.
- [ ] **Rate Limiting Rule**: `/api/*` için ör. 60 istek/dk/IP (uygulama limitini tamamlar).
- [ ] **Security Level**: Medium. Login sayfalarına (`/admin/login`) ekstra challenge.

## 8. Yedekleme

- [ ] `rclone config` ile R2 remote'u (`r2`) ayarla, `.env`/cron'a `R2_REMOTE="r2:kutahya-backups"`.
- [ ] Cron (gece 03:30):
  ```
  30 3 * * * /home/kutahya/kutahyasatilikguncel/scripts/backup-db.sh >> /var/log/kutahya-backup.log 2>&1
  ```
- [ ] **Restore tatbikatı**: `FORCE=1 scripts/restore-db.sh <yedek>` ile boş bir DB'ye test et.
- [ ] Upload dizini için ayrı rsync/restic yedeği (R2'ye), günlük.

## 9. İzleme

- [ ] `/api/health` → UptimeRobot / Cloudflare Health Check ile dışarıdan izle.
- [ ] Disk doluluk + RAM + 5xx alarmı (Netdata/Grafana veya Hostinger paneli).
- [ ] Sentry DSN/secrets tanımlıysa web, API ve source map yüklemesini doğrula; tanımlı değilse Sentry kapalı çalışır.
- [ ] `POST /api/internal/push/dispatch` cron çağrısını `Authorization: Bearer $CRON_SECRET` ile yapılandır.

## 10. Deploy sonrası doğrulama

- [ ] Temiz tarayıcıda: ana sayfa, /ilanlar (filtre), ilan detayı, harita, formlar, admin giriş.
- [ ] `curl -I` ile cache header'ları + `cf-cache-status: HIT` (2. istekte) doğrula.
- [ ] Anonim `POST /api/upload` → 401; satıcı formu upload → çalışıyor.
- [ ] Sitemap/robots production domain; OG görselleri.
- [ ] **Yük testi** (k6/artillery): ana sayfa + ilan detayı + /ilanlar; gerçek kapasiteyi gör, tune et.
- [ ] Lighthouse: performans/SEO/erişilebilirlik.
- [ ] İlk admin parolasını güçlü bir değerle değiştir.

---

### Ölçek notu
Trafiğin büyük kısmını **Cloudflare cache** karşılar (ISR HTML + statik + medya). VPS'e
yalnızca cache-miss + yazma (form/lead/admin) ulaşır. Tek VPS bu modelle yüksek trafiği
taşır; ileride 2. instance + Cloudflare Load Balancer ile yatay ölçeklenir (uygulama
durumsuz: Postgres + Redis + R2 dışarıda).
