-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "actAsId" TEXT;

-- CreateTable
CREATE TABLE "act_as" (
    "id" TEXT NOT NULL,
    "operatorUserId" TEXT,
    "accountId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "act_as_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "act_as_accountId_idx" ON "act_as"("accountId");

-- CreateIndex
CREATE INDEX "act_as_operatorUserId_idx" ON "act_as"("operatorUserId");

-- CreateIndex
CREATE INDEX "sessions_actAsId_idx" ON "sessions"("actAsId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_actAsId_fkey" FOREIGN KEY ("actAsId") REFERENCES "act_as"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "act_as" ADD CONSTRAINT "act_as_operatorUserId_fkey" FOREIGN KEY ("operatorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "act_as" ADD CONSTRAINT "act_as_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
