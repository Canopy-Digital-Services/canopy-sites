-- Contract step for Membership (add_memberships was the expand step).
-- First, give an OWNER membership to any user created through the old
-- users.accountId path after add_memberships ran (an old container serving
-- signups during the deploy). Same deterministic ids as the first backfill,
-- so rows it already made are skipped.
INSERT INTO "memberships" ("id", "userId", "accountId", "role", "createdAt")
SELECT 'mbr_' || u."id", u."id", u."accountId", 'OWNER', u."createdAt"
FROM "users" u
WHERE u."accountId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "memberships" m WHERE m."userId" = u."id")
ON CONFLICT ("userId", "accountId") DO NOTHING;

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_accountId_fkey";

-- DropIndex
DROP INDEX "users_accountId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "accountId";
