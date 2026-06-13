# Kütahya Satılık — Dijital Emlak Ofisi

Kütahya odaklı, **dönüşüm (lead) toplamaya** yönelik emlak portalı.
Ziyaretçiyi telefon / WhatsApp / form ile iletişime geçirmeyi hedefler.

## Özellikler

- **İlan portalı**: liste, detay, filtre (ilçe / tür / oda / fiyat / arama), galeri
- **5 iletişim butonu** (her ilanda): Telefon ile Ara, WhatsApp'tan Yaz, Randevu Talep Et, Ekspertiz İste, Fiyat Teklifi Al
- **Satıcı formu** (ana sayfa + `/satici`): Ad Soyad, Telefon, İlçe, Mahalle, Mülk Türü, Tahmini Fiyat, **fotoğraf yükleme** → admin paneline düşer
- **Google Ads landing sayfaları**: `/kutahya-satilik-daire`, `/kutahya-satilik-arsa`, `/kutahya-satilik-villa`, `/kutahya-yatirimlik-arsa` — her birinde "bulamadınız mı?" CTA
- **Harita** (Leaflet + OpenStreetMap, API anahtarsız): ilçe filtreli (Merkez, Tavşanlı, Simav, Gediz, Emet...), ilanlar işaretli
- **Yapay zeka destekli analiz** (her ilanda): bölge analizi, yatırım puanı, 3/5 yıllık değer artışı, yakındaki okul & hastaneler — ilçe verisi + şablon motoru ile
- **Admin panel** (`/admin`):
  - Dashboard: telefon/WhatsApp tıklama, görüntülenme, dönüşüm, en çok görüntülenen ilçeler, en çok talep alan ilanlar, **Google Ads dönüşüm kaynakları (utm/gclid)**
  - İlan ekle/düzenle/sil (görsel yükleme, sürükle-sırala)
  - Gelen talepler (tip & durum filtresi, tek tık ara/WhatsApp, durum: yeni/arandı/kapandı)
  - Ayarlar (telefon, WhatsApp, marka)
- **SEO**: dinamik metadata, OpenGraph, `sitemap.xml`, `robots.txt`, ilan başına `schema.org/RealEstateListing` JSON-LD
- **Dönüşüm takibi**: gtag (Google Analytics + Google Ads) + kendi DB'mizde olay kaydı

## Teknoloji

- Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4
- Prisma 7 + SQLite (`@prisma/adapter-better-sqlite3`) — kolayca Postgres'e geçirilebilir
- Leaflet / react-leaflet · jose (admin oturumu) · zod (form doğrulama)

## Kurulum

```bash
git clone GIT_REPO_ADRESI
cd kutahyasatilik.com
npm ci
```

Proje kökünde yerel yolları kullanan bir `.env` oluşturun:

```env
DATABASE_URL="file:./dev.db"
UPLOAD_DIR="./public/uploads"
AUTH_SECRET=""
ADMIN_EMAIL=""
ADMIN_PASSWORD="guclu-bir-sifre"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_PHONE="+90 555 555 55 55"
NEXT_PUBLIC_WHATSAPP="905555555555"
NEXT_PUBLIC_EMAIL="info@example.com"
NEXT_PUBLIC_GA_ID=""
NEXT_PUBLIC_GTAG_ID=""
NEXT_PUBLIC_ADS_CONVERSION_LABEL=""
```

İlk demo kurulumu:

```bash
npm run setup:demo
npm run dev
```

`npm ci` sonrasında Prisma Client otomatik üretilir. `setup:demo`, SQLite dosyasını hazırlar, migration'ları uygular ve örnek veriyi yükler.

Admin bilgileri `.env` içindeki `ADMIN_EMAIL` ve `ADMIN_PASSWORD` değerlerinden oluşturulur.
Yönetim paneli: http://localhost:3000/admin

Gerçek veritabanı taşındıysa `npm run setup:demo` veya `npm run seed` çalıştırmayın.
Detaylı teslim ve taşıma adımları için kökteki `KURULUM_REHBERI.html` dosyasını tarayıcıda açın.

## Üretim (VPS)

```bash
npm ci
npx prisma migrate deploy
npm run build
node .next/standalone/server.js
```

`output: "standalone"` aktiftir → `.next/standalone` klasörü tek başına çalışır.
`DATABASE_URL` canlıda kalıcı SQLite dosyasına bakmalı; `public/uploads` klasörü de kalıcı olmalı (yüklenen fotoğraflar burada tutulur).

### Önemli ortam değişkenleri (`.env`)

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | SQLite yolu veya Postgres bağlantısı |
| `AUTH_SECRET` | Admin oturum imzası — **üretimde mutlaka değiştirin** |
| `NEXT_PUBLIC_PHONE` / `NEXT_PUBLIC_WHATSAPP` | Tüm butonlarda kullanılan iletişim |
| `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_GTAG_ID` | Google Analytics / Ads (boşsa devre dışı) |
| `NEXT_PUBLIC_ADS_CONVERSION_LABEL` | Google Ads dönüşüm etiketi |

## Postgres'e geçiş

`prisma/schema.prisma` içindeki `provider = "sqlite"` → `"postgresql"` yapın,
`lib/prisma.ts` ve `prisma/seed.ts` içindeki adapter'ı `@prisma/adapter-pg` ile değiştirin,
`DATABASE_URL`'i Postgres bağlantısıyla güncelleyip `npx prisma migrate dev` çalıştırın.

## Yapı

```
app/                 sayfalar + API rotaları (/api/leads, /api/track, /api/upload)
  admin/             yönetim paneli (login, dashboard, ilanlar, talepler, ayarlar)
components/          UI bileşenleri (ContactButtons, SellerForm, Map, Gallery...)
lib/                 prisma, auth, analiz motoru, sabitler, formatlama
prisma/              schema + seed
public/uploads/      yüklenen görseller
```
