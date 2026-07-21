-- Prevent overlapping cron invocations from sending the same outbox row twice.
ALTER TABLE "PushDelivery" ADD COLUMN "claimId" TEXT;
CREATE INDEX "PushDelivery_claimId_idx" ON "PushDelivery"("claimId");
