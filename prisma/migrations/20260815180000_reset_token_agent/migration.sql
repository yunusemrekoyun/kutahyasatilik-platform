-- Şifre sıfırlama jetonu danışmanları da kapsasın.
--
-- Tablo yalnız User'a bağlıydı; danışman şifresini unuttuğunda tek çözüm
-- veritabanına elle müdahaleydi. userId artık nullable, yanına agentId geldi;
-- uygulama katmanı tam olarak birinin dolu olmasını garanti ediyor.
ALTER TABLE "PasswordResetToken" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "PasswordResetToken" ADD COLUMN "agentId" TEXT;

ALTER TABLE "PasswordResetToken"
  ADD CONSTRAINT "PasswordResetToken_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "PasswordResetToken_agentId_idx" ON "PasswordResetToken"("agentId");
