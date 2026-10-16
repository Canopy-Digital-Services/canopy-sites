-- CreateTable: Plan catalog
CREATE TABLE "plans" (
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "maxPublishedForms" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("code")
);

-- Seed plan catalog. maxPublishedForms = NULL means unlimited.
-- HOSTING and PAID are placeholders; they are not reachable until billing
-- ships. UNLOCKED is operator-granted only (isPublic = false).
INSERT INTO "plans" ("code", "displayName", "description", "maxPublishedForms", "isPublic", "sortOrder") VALUES
    ('FREE',     'Free',     'One published form.',                              1,    true,  10),
    ('HOSTING',  'Hosting',  'Hosting tier for self-hosted deployments.',        10,   true,  20),
    ('PAID',     'Paid',     'Unlimited published forms.',                       NULL, true,  30),
    ('UNLOCKED', 'Unlocked', 'Internal / VIP accounts exempt from plan limits.', NULL, false, 99);

-- AlterTable: attach plan + resolution flag to every account.
-- Existing rows default to FREE; we grandfather over-limit accounts below.
ALTER TABLE "accounts"
    ADD COLUMN "planCode" TEXT NOT NULL DEFAULT 'FREE',
    ADD COLUMN "requiresPlanResolution" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "accounts"
    ADD CONSTRAINT "accounts_planCode_fkey"
    FOREIGN KEY ("planCode") REFERENCES "plans"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "accounts_planCode_idx" ON "accounts"("planCode");

-- Backfill: any account already running more than the FREE cap of published
-- forms is grandfathered to UNLOCKED so the deploy does not retroactively
-- lock them out of their own content.
UPDATE "accounts" a
SET "planCode" = 'UNLOCKED'
WHERE (
    SELECT COUNT(*)
    FROM "forms" f
    WHERE f."accountId" = a.id AND f.published = true
) > 1;
