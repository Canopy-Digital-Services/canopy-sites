-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'MEMBER');

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "accountId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "memberships_accountId_idx" ON "memberships"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_userId_accountId_key" ON "memberships"("userId", "accountId");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing user owns the account it was linked to 1:1.
-- Deterministic ids keep this free of extensions and safe to re-run in the
-- contract migration (drop_user_account_id) for rows created in between.
INSERT INTO "memberships" ("id", "userId", "accountId", "role", "createdAt")
SELECT 'mbr_' || u."id", u."id", u."accountId", 'OWNER', u."createdAt"
FROM "users" u
WHERE u."accountId" IS NOT NULL
ON CONFLICT ("userId", "accountId") DO NOTHING;
