-- Sıralama için attributes'tan türetilmiş kolonlar.
--
-- Prisma JSON alanına göre orderBy desteklemiyor; "en yeni model" ve "en düşük
-- kilometre" sıralaması bunlar olmadan yazılamıyor. attributes tek doğruluk
-- kaynağı olmaya devam ediyor, bu kolonlar yazma yollarında ondan türetiliyor.
ALTER TABLE "Listing" ADD COLUMN "attrYear" INTEGER;
ALTER TABLE "Listing" ADD COLUMN "attrKm" INTEGER;

-- Mevcut vasıta ilanlarını doldur. Sayıya çevrilemeyen değer null kalır:
-- bozuk tek bir kayıt yüzünden göç başarısız olmasın.
UPDATE "Listing"
SET "attrYear" = NULLIF("attributes"->>'yil', '')::int
WHERE "attributes"->>'yil' ~ '^[0-9]+$';

UPDATE "Listing"
SET "attrKm" = NULLIF("attributes"->>'kilometre', '')::int
WHERE "attributes"->>'kilometre' ~ '^[0-9]+$';

CREATE INDEX "Listing_category_attrYear_idx" ON "Listing"("category", "attrYear");
CREATE INDEX "Listing_category_attrKm_idx" ON "Listing"("category", "attrKm");
