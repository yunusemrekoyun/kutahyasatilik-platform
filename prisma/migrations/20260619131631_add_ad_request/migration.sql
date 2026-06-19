-- CreateTable
CREATE TABLE "AdRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdRequest_status_idx" ON "AdRequest"("status");
