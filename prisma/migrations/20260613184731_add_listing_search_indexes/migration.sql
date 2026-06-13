-- CreateIndex
CREATE INDEX "Listing_moderationStatus_status_district_idx" ON "Listing"("moderationStatus", "status", "district");

-- CreateIndex
CREATE INDEX "Listing_moderationStatus_status_propertyType_idx" ON "Listing"("moderationStatus", "status", "propertyType");

-- CreateIndex
CREATE INDEX "Listing_featured_createdAt_idx" ON "Listing"("featured", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_price_idx" ON "Listing"("price");
