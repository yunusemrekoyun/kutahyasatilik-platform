-- CreateTable
CREATE TABLE "AgentApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "title" TEXT,
    "agency" TEXT,
    "experience" TEXT,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "adminNote" TEXT,
    "agentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentApplication_status_idx" ON "AgentApplication"("status");
