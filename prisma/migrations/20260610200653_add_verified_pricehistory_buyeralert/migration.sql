-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PriceHistory_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BuyerAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "propertyType" TEXT,
    "listingType" TEXT DEFAULT 'sale',
    "district" TEXT,
    "minPrice" INTEGER,
    "maxPrice" INTEGER,
    "minArea" INTEGER,
    "rooms" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "listingType" TEXT NOT NULL DEFAULT 'sale',
    "status" TEXT NOT NULL DEFAULT 'active',
    "moderationStatus" TEXT NOT NULL DEFAULT 'approved',
    "note" TEXT,
    "agentId" TEXT,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "district" TEXT NOT NULL,
    "neighborhood" TEXT,
    "address" TEXT,
    "lat" REAL,
    "lng" REAL,
    "areaGross" INTEGER,
    "areaNet" INTEGER,
    "rooms" TEXT,
    "floor" TEXT,
    "totalFloors" INTEGER,
    "buildingAge" TEXT,
    "heating" TEXT,
    "furnished" BOOLEAN NOT NULL DEFAULT false,
    "inSite" BOOLEAN NOT NULL DEFAULT false,
    "balcony" BOOLEAN NOT NULL DEFAULT false,
    "parking" BOOLEAN NOT NULL DEFAULT false,
    "deedStatus" TEXT,
    "zoningStatus" TEXT,
    "adaNo" TEXT,
    "parselNo" TEXT,
    "kaks" TEXT,
    "videoUrl" TEXT,
    "droneUrl" TEXT,
    "virtualTourUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "investmentScore" INTEGER,
    "valueGrowthPct" INTEGER,
    "features" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Listing_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("adaNo", "address", "agentId", "areaGross", "areaNet", "balcony", "buildingAge", "createdAt", "currency", "deedStatus", "description", "district", "droneUrl", "featured", "features", "floor", "furnished", "heating", "id", "inSite", "investmentScore", "kaks", "lat", "listingType", "lng", "metaDescription", "metaTitle", "moderationStatus", "neighborhood", "note", "parking", "parselNo", "price", "propertyType", "rooms", "slug", "status", "title", "totalFloors", "updatedAt", "valueGrowthPct", "videoUrl", "viewCount", "virtualTourUrl", "zoningStatus") SELECT "adaNo", "address", "agentId", "areaGross", "areaNet", "balcony", "buildingAge", "createdAt", "currency", "deedStatus", "description", "district", "droneUrl", "featured", "features", "floor", "furnished", "heating", "id", "inSite", "investmentScore", "kaks", "lat", "listingType", "lng", "metaDescription", "metaTitle", "moderationStatus", "neighborhood", "note", "parking", "parselNo", "price", "propertyType", "rooms", "slug", "status", "title", "totalFloors", "updatedAt", "valueGrowthPct", "videoUrl", "viewCount", "virtualTourUrl", "zoningStatus" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");
CREATE INDEX "Listing_propertyType_idx" ON "Listing"("propertyType");
CREATE INDEX "Listing_district_idx" ON "Listing"("district");
CREATE INDEX "Listing_status_idx" ON "Listing"("status");
CREATE INDEX "Listing_featured_idx" ON "Listing"("featured");
CREATE INDEX "Listing_moderationStatus_idx" ON "Listing"("moderationStatus");
CREATE INDEX "Listing_agentId_idx" ON "Listing"("agentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PriceHistory_listingId_idx" ON "PriceHistory"("listingId");

-- CreateIndex
CREATE INDEX "BuyerAlert_status_idx" ON "BuyerAlert"("status");

-- CreateIndex
CREATE INDEX "BuyerAlert_district_idx" ON "BuyerAlert"("district");
