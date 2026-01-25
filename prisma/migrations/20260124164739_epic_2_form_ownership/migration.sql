-- Epic 2: Form Ownership & Metadata
-- Add accountId to Site and Form models, createdByUserId to Form

-- Step 1: Add accountId to sites table (nullable initially)
ALTER TABLE "sites" ADD COLUMN "accountId" TEXT;

-- Step 2: Populate sites.accountId from users.accountId
UPDATE "sites" 
SET "accountId" = u."accountId"
FROM "users" u
WHERE "sites"."userId" = u.id;

-- Step 3: Make sites.accountId non-nullable
ALTER TABLE "sites" ALTER COLUMN "accountId" SET NOT NULL;

-- Step 4: Add accountId and createdByUserId to forms table (nullable initially)
ALTER TABLE "forms" ADD COLUMN "accountId" TEXT;
ALTER TABLE "forms" ADD COLUMN "createdByUserId" TEXT;

-- Step 5: Populate forms.accountId and createdByUserId from sites -> users
UPDATE "forms" 
SET "accountId" = u."accountId",
    "createdByUserId" = s."userId"
FROM "sites" s
JOIN "users" u ON s."userId" = u.id
WHERE "forms"."siteId" = s.id;

-- Step 6: Make forms columns non-nullable
ALTER TABLE "forms" ALTER COLUMN "accountId" SET NOT NULL;
ALTER TABLE "forms" ALTER COLUMN "createdByUserId" SET NOT NULL;

-- Step 7: Create indexes
CREATE INDEX "sites_accountId_idx" ON "sites"("accountId");
CREATE INDEX "forms_accountId_idx" ON "forms"("accountId");
CREATE INDEX "forms_createdByUserId_idx" ON "forms"("createdByUserId");

-- Step 8: Add foreign key constraints
ALTER TABLE "sites" ADD CONSTRAINT "sites_accountId_fkey" 
  FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "forms" ADD CONSTRAINT "forms_accountId_fkey" 
  FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "forms" ADD CONSTRAINT "forms_createdByUserId_fkey" 
  FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
