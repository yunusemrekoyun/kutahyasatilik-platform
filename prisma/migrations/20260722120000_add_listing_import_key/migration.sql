-- Race-safe idempotency for CSV/API imports. The key is derived server-side
-- from the owning agency (or independent adviser) and the external source ID.
ALTER TABLE "Listing" ADD COLUMN "importKey" TEXT;

-- Preserve all legacy rows. Only keys that are already unambiguous are
-- backfilled; any pre-existing independent-adviser duplicates remain NULL and
-- can be reviewed without blocking this additive migration.
WITH candidates AS (
  SELECT
    "id",
    CASE
      WHEN "agencyId" IS NOT NULL
        THEN 'agency:' || "agencyId" || ':' || BTRIM("externalId")
      ELSE 'agent:' || "agentId" || ':' || BTRIM("externalId")
    END AS "candidateKey"
  FROM "Listing"
  WHERE "externalId" IS NOT NULL
    AND BTRIM("externalId") <> ''
    AND ("agencyId" IS NOT NULL OR "agentId" IS NOT NULL)
), unique_candidates AS (
  SELECT "candidateKey"
  FROM candidates
  GROUP BY "candidateKey"
  HAVING COUNT(*) = 1
)
UPDATE "Listing" AS listing
SET "importKey" = candidates."candidateKey"
FROM candidates
INNER JOIN unique_candidates
  ON unique_candidates."candidateKey" = candidates."candidateKey"
WHERE listing."id" = candidates."id";

CREATE UNIQUE INDEX "Listing_importKey_key" ON "Listing"("importKey");
