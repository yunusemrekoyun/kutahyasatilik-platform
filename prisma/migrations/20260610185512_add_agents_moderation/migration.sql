-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "title" TEXT,
    "agency" TEXT,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME
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
    "featured" BOOLEAN NOT NULL DEFAULT false,
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
INSERT INTO "new_Listing" ("adaNo", "address", "areaGross", "areaNet", "balcony", "buildingAge", "createdAt", "currency", "deedStatus", "description", "district", "featured", "features", "floor", "furnished", "heating", "id", "inSite", "investmentScore", "kaks", "lat", "listingType", "lng", "metaDescription", "metaTitle", "neighborhood", "parking", "parselNo", "price", "propertyType", "rooms", "slug", "status", "title", "totalFloors", "updatedAt", "valueGrowthPct", "viewCount", "zoningStatus") SELECT "adaNo", "address", "areaGross", "areaNet", "balcony", "buildingAge", "createdAt", "currency", "deedStatus", "description", "district", "featured", "features", "floor", "furnished", "heating", "id", "inSite", "investmentScore", "kaks", "lat", "listingType", "lng", "metaDescription", "metaTitle", "neighborhood", "parking", "parselNo", "price", "propertyType", "rooms", "slug", "status", "title", "totalFloors", "updatedAt", "valueGrowthPct", "viewCount", "zoningStatus" FROM "Listing";
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
CREATE UNIQUE INDEX "Agent_email_key" ON "Agent"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_slug_key" ON "Agent"("slug");

-- CreateIndex
CREATE INDEX "Agent_status_idx" ON "Agent"("status");
