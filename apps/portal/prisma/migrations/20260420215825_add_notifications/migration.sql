-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_SUBMISSION', 'LIMIT_MAX_REACHED', 'LIMIT_DEADLINE_REACHED');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_accountId_updatedAt_idx" ON "notifications"("accountId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_accountId_formId_type_key" ON "notifications"("accountId", "formId", "type");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
