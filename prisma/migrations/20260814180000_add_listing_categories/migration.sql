-- Çok kategorili ilan platformu. Emlak kolonlarının hiçbiri değişmiyor; bu
-- migration yalnızca ekleme yapar ve mevcut satırların tamamı 'emlak' olur.
ALTER TABLE "Listing" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'emlak';

-- Kategoriye özel alanlar. Şeması uygulama tarafında (lib/categories.ts)
-- tanımlıdır ve doğrulama orada yapılır. Emlak bu alanı KULLANMAZ — kendi
-- kolonları var; bu yüzden burada NOT NULL veya CHECK yok.
ALTER TABLE "Listing" ADD COLUMN "attributes" JSONB;

-- Bireysel ilan sahipliği. Admin ve emlakçı ilanlarında NULL kalır.
-- Hesap silinirse ilan da gider: iletişim kurulacak kimse kalmadığı için
-- ilan anlamsızlaşır ve öksüz kayıt bırakmak istemiyoruz.
ALTER TABLE "Listing" ADD COLUMN "userId" TEXT;

ALTER TABLE "Listing" ADD CONSTRAINT "Listing_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Listing_userId_idx" ON "Listing"("userId");
CREATE INDEX "Listing_category_idx" ON "Listing"("category");

-- Kategori listelerinin varsayılan sorgusu: moderasyon + kategori eşitliği,
-- ardından öne çıkan + tarih sıralaması. Mevcut
-- [moderationStatus, featured, createdAt] indeksi kategori filtresi olmayan
-- sorgular için yerinde kalır; bu onun kategori kırılımlı eşleniğidir.
CREATE INDEX "Listing_moderationStatus_category_featured_createdAt_idx"
  ON "Listing"("moderationStatus", "category", "featured" DESC, "createdAt" DESC);

-- NOT: attributes üzerinde GIN indeksi bilerek eklenmedi. Nitelik filtreleri
-- her zaman kategori eşitliğinden SONRA çalışır ve küçük bir küme üzerinde
-- döner; ölçüm olmadan indeks eklemek daha önce planlayıcının hiç kullanmadığı
-- bir indeks üretmişti. Gerçek veri hacmi oluşunca EXPLAIN ile bakılacak.
