-- CreateTable: one site per account (unique accountId, PRD D19).
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "repoUrl" TEXT,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "productionHostnames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contractVersion" TEXT,
    "umamiWebsiteId" TEXT,
    "runbookOverlay" TEXT NOT NULL DEFAULT '',
    "lockedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxBuildsRetained" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sites_accountId_key" ON "sites"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "sites_slug_key" ON "sites"("slug");

-- AddForeignKey: RESTRICT, so an account that owns a site cannot be deleted
-- (PRD D19); the site is reassigned first.
ALTER TABLE "sites" ADD CONSTRAINT "sites_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
