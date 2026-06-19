-- CreateTable
CREATE TABLE "PortfolioOpportunity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "district" TEXT,
    "propertyType" TEXT,
    "estimatedPrice" INTEGER,
    "areaGross" INTEGER,
    "rooms" TEXT,
    "biddingEndsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "listingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "commissionPct" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortfolioOpportunity_status_idx" ON "PortfolioOpportunity"("status");

-- CreateIndex
CREATE INDEX "PortfolioOpportunity_userId_idx" ON "PortfolioOpportunity"("userId");

-- CreateIndex
CREATE INDEX "Bid_opportunityId_idx" ON "Bid"("opportunityId");

-- CreateIndex
CREATE INDEX "Bid_agentId_idx" ON "Bid"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Bid_opportunityId_agentId_key" ON "Bid"("opportunityId", "agentId");

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "PortfolioOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
