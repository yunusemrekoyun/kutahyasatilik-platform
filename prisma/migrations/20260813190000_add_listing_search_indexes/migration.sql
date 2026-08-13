-- Serbest metin araması (lib/listingFilters.ts buildWhere) title/description/
-- neighborhood/address üzerinde ILIKE '%...%' üretir. B-tree bu kalıbı kullanamaz,
-- her arama seq scan olur. pg_trgm GIN indeksleri bu kalıbı indeksler.
-- pg_trgm PostgreSQL 13'ten beri "trusted" olduğu için veritabanı sahibi
-- superuser olmadan da oluşturabilir.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Gereksiz indeksler: ikisi de mevcut bileşik indekslerin sol öneki olduğundan
-- sorgulara katkı sağlamıyor, yalnız her yazmada bakım maliyeti çıkarıyordu.
DROP INDEX IF EXISTS "Listing_featured_idx";
DROP INDEX IF EXISTS "Listing_moderationStatus_idx";

-- Varsayılan public liste sıralaması (featured DESC, createdAt DESC).
-- Aşağıdaki indeks eski "Listing_featured_createdAt_idx" indeksinin yerini alır:
-- moderationStatus eşitliğini de kapsadığı için derin sayfalarda ölçümde
-- 17ms -> 2ms fark yarattı; eski indeks bundan sonra hiçbir sorguda seçilmiyor.
CREATE INDEX "Listing_moderationStatus_featured_createdAt_idx" ON "Listing"("moderationStatus", "featured" DESC, "createdAt" DESC);
DROP INDEX IF EXISTS "Listing_featured_createdAt_idx";

-- Arama indeksleri
CREATE INDEX "Listing_title_idx" ON "Listing" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "Listing_description_idx" ON "Listing" USING GIN ("description" gin_trgm_ops);
CREATE INDEX "Listing_neighborhood_idx" ON "Listing" USING GIN ("neighborhood" gin_trgm_ops);
CREATE INDEX "Listing_address_idx" ON "Listing" USING GIN ("address" gin_trgm_ops);
