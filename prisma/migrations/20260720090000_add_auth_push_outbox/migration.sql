-- Additive production hardening: revocable auth versions and Expo Push outbox.
ALTER TABLE "Admin" ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Agent" ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "PushToken" (
    "id" TEXT NOT NULL,
    "recipientRole" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "pushTokenId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "ticketId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "receiptCheckedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PushDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushToken_token_key" ON "PushToken"("token");
CREATE INDEX "PushToken_recipientRole_recipientId_active_idx" ON "PushToken"("recipientRole", "recipientId", "active");
CREATE INDEX "PushToken_active_lastSeenAt_idx" ON "PushToken"("active", "lastSeenAt");
CREATE UNIQUE INDEX "PushDelivery_notificationId_pushTokenId_key" ON "PushDelivery"("notificationId", "pushTokenId");
CREATE INDEX "PushDelivery_status_nextAttemptAt_idx" ON "PushDelivery"("status", "nextAttemptAt");
CREATE INDEX "PushDelivery_ticketId_idx" ON "PushDelivery"("ticketId");

ALTER TABLE "PushDelivery" ADD CONSTRAINT "PushDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PushDelivery" ADD CONSTRAINT "PushDelivery_pushTokenId_fkey" FOREIGN KEY ("pushTokenId") REFERENCES "PushToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;
