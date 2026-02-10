-- Form-First Model Migration
-- Remove Site model and move origin validation to Form

-- Step 1: Add allowedOrigins column to forms
ALTER TABLE "forms" ADD COLUMN "allowedOrigins" TEXT[] DEFAULT '{}';

-- Step 2: Populate allowedOrigins from existing site domains
UPDATE "forms" f 
SET "allowedOrigins" = ARRAY[s.domain]
FROM "sites" s 
WHERE f."siteId" = s.id;

-- Step 3: Drop the siteId_slug unique constraint
ALTER TABLE "forms" DROP CONSTRAINT "forms_siteId_slug_key";

-- Step 4: Drop the siteId foreign key constraint
ALTER TABLE "forms" DROP CONSTRAINT "forms_siteId_fkey";

-- Step 5: Drop the siteId column
ALTER TABLE "forms" DROP COLUMN "siteId";

-- Step 6: Add new unique constraint for accountId + slug
ALTER TABLE "forms" ADD CONSTRAINT "forms_accountId_slug_key" UNIQUE ("accountId", "slug");

-- Step 7: Drop sites table (cascades handled by previous steps)
DROP TABLE "sites";
