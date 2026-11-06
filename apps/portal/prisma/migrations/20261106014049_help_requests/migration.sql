-- CreateEnum
CREATE TYPE "HelpRequestStatus" AS ENUM ('DRAFT', 'OPEN', 'DONE', 'DECLINED', 'DISMISSED');

-- CreateTable
CREATE TABLE "help_requests" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "conversationId" TEXT,
    "createdByUserId" TEXT,
    "actAsId" TEXT,
    "message" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "address" TEXT,
    "status" "HelpRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "note" TEXT,
    "closedByUserId" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "help_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "help_requests_siteId_status_idx" ON "help_requests"("siteId", "status");

-- CreateIndex
CREATE INDEX "help_requests_status_sentAt_idx" ON "help_requests"("status", "sentAt");

-- AddForeignKey
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_actAsId_fkey" FOREIGN KEY ("actAsId") REFERENCES "act_as"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_closedByUserId_fkey" FOREIGN KEY ("closedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
