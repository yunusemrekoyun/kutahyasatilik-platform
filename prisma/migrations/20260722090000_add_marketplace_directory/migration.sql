-- Additive marketplace directory, listing details, amenities, and verified local resources.
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "coverImage" TEXT,
    "description" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "serviceDistricts" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verifiedAt" TIMESTAMP(3),
    "published" BOOLEAN NOT NULL DEFAULT false,
    "showPhone" BOOLEAN NOT NULL DEFAULT false,
    "showWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ListingAmenity" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingAmenity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LocalResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "district" TEXT,
    "url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalResource_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Agent"
    ADD COLUMN "agencyId" TEXT,
    ADD COLUMN "bio" TEXT,
    ADD COLUMN "experienceYears" INTEGER,
    ADD COLUMN "specialties" TEXT,
    ADD COLUMN "serviceDistricts" TEXT,
    ADD COLUMN "publicProfile" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "showPhone" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "showWhatsapp" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Listing"
    ADD COLUMN "agencyId" TEXT,
    ADD COLUMN "externalId" TEXT,
    ADD COLUMN "referenceNo" TEXT,
    ADD COLUMN "creditEligible" TEXT,
    ADD COLUMN "usageStatus" TEXT,
    ADD COLUMN "propertyCondition" TEXT,
    ADD COLUMN "bathroomCount" INTEGER,
    ADD COLUMN "dues" INTEGER,
    ADD COLUMN "exchangeEligible" BOOLEAN,
    ADD COLUMN "deedType" TEXT,
    ADD COLUMN "occupancyPermit" TEXT,
    ADD COLUMN "validUntil" TIMESTAMP(3),
    ADD COLUMN "locationVisibility" TEXT NOT NULL DEFAULT 'approximate',
    ADD COLUMN "parcelVisibility" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Agency_slug_key" ON "Agency"("slug");
CREATE INDEX "Agency_status_published_idx" ON "Agency"("status", "published");
CREATE INDEX "Agency_verifiedAt_idx" ON "Agency"("verifiedAt");

CREATE INDEX "Agent_agencyId_idx" ON "Agent"("agencyId");
CREATE INDEX "Agent_publicProfile_status_idx" ON "Agent"("publicProfile", "status");

CREATE UNIQUE INDEX "Listing_referenceNo_key" ON "Listing"("referenceNo");
CREATE UNIQUE INDEX "Listing_agencyId_externalId_key" ON "Listing"("agencyId", "externalId");
CREATE INDEX "Listing_agencyId_idx" ON "Listing"("agencyId");

CREATE UNIQUE INDEX "ListingAmenity_listingId_key_key" ON "ListingAmenity"("listingId", "key");
CREATE INDEX "ListingAmenity_listingId_group_sortOrder_idx" ON "ListingAmenity"("listingId", "group", "sortOrder");

CREATE INDEX "LocalResource_active_sortOrder_idx" ON "LocalResource"("active", "sortOrder");
CREATE INDEX "LocalResource_type_district_idx" ON "LocalResource"("type", "district");

ALTER TABLE "Agent" ADD CONSTRAINT "Agent_agencyId_fkey"
    FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Listing" ADD CONSTRAINT "Listing_agencyId_fkey"
    FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ListingAmenity" ADD CONSTRAINT "ListingAmenity_listingId_fkey"
    FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Başlangıçta yalnız doğrulanmış resmî kurum bağlantıları yayınlanır. Bu
-- kayıtlar sabit kimliklerle tekrar çalıştırılabilir ve yönetimden pasife alınabilir.
INSERT INTO "LocalResource" (
    "id", "title", "description", "type", "institution", "district", "url",
    "active", "sortOrder", "lastCheckedAt", "createdAt", "updatedAt"
) VALUES
    (
      'official-kutahya-eimar',
      'Kütahya Belediyesi e-İmar',
      'İmar durumu ve plan bilgileri için kimlik doğrulamalı resmî hizmet.',
      'zoning', 'Kütahya Belediyesi', 'Merkez',
      'https://www.turkiye.gov.tr/kutahya-belediyesi-eimar-8820',
      true, 10, TIMESTAMP '2026-07-22 00:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
      'official-tkgm-parcel',
      'TKGM Parsel Sorgu',
      'Ada ve parsel konumunu Tapu ve Kadastro Genel Müdürlüğü uygulamasında görüntüleyin.',
      'parcel', 'Tapu ve Kadastro Genel Müdürlüğü', NULL,
      'https://parselsorgu.tkgm.gov.tr/',
      true, 20, TIMESTAMP '2026-07-22 00:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
      'official-kutahya-land-value',
      'Arsa Rayiç Değeri Sorgulama',
      'Cadde ve sokak bazında arsa metrekare birim değerini resmî kaynaktan sorgulayın.',
      'e_government', 'Kütahya Belediyesi', 'Merkez',
      'https://www.turkiye.gov.tr/kutahya-belediyesi-arsa-rayic-degeri-sorgulama-v2',
      true, 30, TIMESTAMP '2026-07-22 00:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
      'official-tavsanli-eimar',
      'Tavşanlı Belediyesi e-İmar',
      'Tavşanlı için imar hizmetine e-Devlet üzerinden güvenli erişim.',
      'zoning', 'Kütahya Tavşanlı Belediyesi', 'Tavşanlı',
      'https://www.turkiye.gov.tr/kutahya-tavsanli-belediyesi-eimar-8627',
      true, 40, TIMESTAMP '2026-07-22 00:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
ON CONFLICT ("id") DO NOTHING;
