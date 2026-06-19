-- AlterTable
ALTER TABLE "BuyerAlert" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "BuyerAlert_userId_idx" ON "BuyerAlert"("userId");

-- AddForeignKey
ALTER TABLE "BuyerAlert" ADD CONSTRAINT "BuyerAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
