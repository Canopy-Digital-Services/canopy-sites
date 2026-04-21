-- CreateTable: Role catalog
CREATE TABLE "roles" (
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("code")
);

-- Seed role catalog. GLOBAL_ADMIN is internal (isPublic = false); it is
-- granted from the operator console, never via self-serve.
INSERT INTO "roles" ("code", "displayName", "description", "isPublic", "sortOrder") VALUES
    ('USER',         'User',         'Standard account holder.',                             true,  10),
    ('GLOBAL_ADMIN', 'Global Admin', 'Full operator-console access; UNLOCKED plan granted.', false, 90);

-- AlterTable: attach role to every user. Existing rows default to USER. A
-- standalone backfill step (scripts/backfill-global-admin.ts, invoked from
-- start.sh after migrate deploy) promotes the ADMIN_EMAIL user to
-- GLOBAL_ADMIN and moves their account to UNLOCKED. The backfill is
-- idempotent so it is safe to run on every deploy.
ALTER TABLE "users"
    ADD COLUMN "roleCode" TEXT NOT NULL DEFAULT 'USER';

-- AddForeignKey
ALTER TABLE "users"
    ADD CONSTRAINT "users_roleCode_fkey"
    FOREIGN KEY ("roleCode") REFERENCES "roles"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "users_roleCode_idx" ON "users"("roleCode");
