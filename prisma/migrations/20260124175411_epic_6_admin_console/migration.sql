-- Epic 6: Admin Console
-- Add deletedAt column to accounts table for hybrid delete (tombstone marker)

ALTER TABLE "accounts" ADD COLUMN "deletedAt" TIMESTAMP(3);
