-- Kayıtlı arama her kategoride.
--
-- Kolon yokken kapsam kod tarafında "emlak" olarak sabitlenmişti: vasıta ya da
-- teknoloji arayan kullanıcıya asla eşleşme bildirimi gitmiyordu. attributes,
-- ilanlardaki Listing.attributes ile AYNI sözleşmeyi kullanır (yil_min,
-- kilometre_max, yakit ...).
ALTER TABLE "BuyerAlert" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'emlak';
ALTER TABLE "BuyerAlert" ADD COLUMN "attributes" JSONB;

-- Mevcut talepler zaten emlak: varsayılan doğru, ek dolgu gerekmiyor.
CREATE INDEX "BuyerAlert_status_category_idx" ON "BuyerAlert"("status", "category");
