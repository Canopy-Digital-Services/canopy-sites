-- Remove HIDDEN field type: convert any existing HIDDEN fields to TEXT first
UPDATE "fields" SET "type" = 'TEXT' WHERE "type" = 'HIDDEN';

-- Recreate enum without HIDDEN
ALTER TYPE "FieldType" RENAME TO "FieldType_old";
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'EMAIL', 'TEXTAREA', 'DROPDOWN', 'CHECKBOX', 'CHECKBOXES', 'PHONE', 'DATE', 'NAME');
ALTER TABLE "fields" ALTER COLUMN "type" TYPE "FieldType" USING "type"::text::"FieldType";
DROP TYPE "FieldType_old";
