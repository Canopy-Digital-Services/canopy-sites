-- One draft per site, held by the database (PRD D38; REVIEW_FINDINGS F4).
-- Prisma's schema can't state a partial index, so it lives here only.

-- A site that already has two pending changes keeps the newest, the one the
-- draft view has been showing. The rest were never shown again.
UPDATE "change_sets" AS older
SET "status" = 'DISCARDED', "error" = 'Replaced by a newer draft.'
WHERE older."status" IN ('DRAFT', 'PREVIEWED')
  AND EXISTS (
    SELECT 1
    FROM "change_sets" AS newer
    WHERE newer."siteId" = older."siteId"
      AND newer."status" IN ('DRAFT', 'PREVIEWED')
      AND (newer."createdAt" > older."createdAt" OR (newer."createdAt" = older."createdAt" AND newer."id" > older."id"))
  );

CREATE UNIQUE INDEX "change_sets_one_pending_per_site" ON "change_sets" ("siteId") WHERE "status" IN ('DRAFT', 'PREVIEWED');
