-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Kurumsal Emlakçı Paketi',
    "description" TEXT,
    "price" INTEGER NOT NULL DEFAULT 2500,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "interval" TEXT NOT NULL DEFAULT 'monthly',
    "listingQuota" INTEGER,
    "featuredQuota" INTEGER,
    "features" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);
