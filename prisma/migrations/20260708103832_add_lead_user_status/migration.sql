/*
  Warnings:

  - Added the required column `updatedAt` to the `Lead` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- updatedAt: mevcut satırlar için CURRENT_TIMESTAMP → boş OLMAYAN Lead tablosunda da güvenli deploy.
-- Uygulama katmanı @updatedAt ile yönetir; DB default'u yalnızca geçiş içindir.
ALTER TABLE "Lead" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'received';

-- CreateIndex
CREATE INDEX "Lead_userId_idx" ON "Lead"("userId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
