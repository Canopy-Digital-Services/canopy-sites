-- CreateTable
CREATE TABLE "site_holds" (
    "siteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_holds_pkey" PRIMARY KEY ("siteId")
);

-- CreateIndex
CREATE INDEX "site_holds_userId_idx" ON "site_holds"("userId");

-- AddForeignKey
ALTER TABLE "site_holds" ADD CONSTRAINT "site_holds_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_holds" ADD CONSTRAINT "site_holds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
