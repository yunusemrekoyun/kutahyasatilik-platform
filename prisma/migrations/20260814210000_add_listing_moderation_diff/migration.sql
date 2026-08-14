-- Bekleyen düzenlemenin alan bazında farkı.
--
-- Kullanıcı kendi ilanını düzenlediğinde değişiklik doğrudan uygulanır, ilan
-- `moderationStatus = 'pending'` olur (kamu sorguları approved istediği için
-- yayından kalkar) ve bu kolon { alan: { from, to } } haritasını taşır. Admin
-- onay ekranı yalnız burada listelenen alanları gösterir; onayda NULL'lanır.
--
-- Tamamen ekleme: mevcut satırlar NULL alır, hiçbir davranış değişmez.
ALTER TABLE "Listing" ADD COLUMN "moderationDiff" JSONB;
