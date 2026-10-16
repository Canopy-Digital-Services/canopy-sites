-- CreateEnum
CREATE TYPE "ChangeSetSource" AS ENUM ('QUICK_EDIT', 'OPERATOR');

-- CreateEnum
CREATE TYPE "ChangeSetStatus" AS ENUM ('DRAFT', 'PREVIEWED', 'PUBLISHED', 'DISCARDED', 'FAILED');

-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "change_sets" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "source" "ChangeSetSource" NOT NULL,
    "createdByUserId" TEXT,
    "conversationId" TEXT,
    "summary" TEXT NOT NULL,
    "ops" JSONB NOT NULL,
    "baseCommit" TEXT NOT NULL,
    "status" "ChangeSetStatus" NOT NULL DEFAULT 'DRAFT',
    "error" TEXT,
    "publishedCommit" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "change_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builds" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "changeSetId" TEXT,
    "status" "BuildStatus" NOT NULL DEFAULT 'QUEUED',
    "baseCommit" TEXT,
    "error" TEXT,
    "log" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "builds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "userId" TEXT,
    "model" TEXT NOT NULL,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "change_sets_siteId_status_idx" ON "change_sets"("siteId", "status");

-- CreateIndex
CREATE INDEX "change_sets_siteId_createdAt_idx" ON "change_sets"("siteId", "createdAt");

-- CreateIndex
CREATE INDEX "builds_siteId_createdAt_idx" ON "builds"("siteId", "createdAt");

-- CreateIndex
CREATE INDEX "builds_changeSetId_idx" ON "builds"("changeSetId");

-- CreateIndex
CREATE INDEX "conversations_siteId_createdAt_idx" ON "conversations"("siteId", "createdAt");

-- AddForeignKey
ALTER TABLE "change_sets" ADD CONSTRAINT "change_sets_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_sets" ADD CONSTRAINT "change_sets_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_sets" ADD CONSTRAINT "change_sets_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_changeSetId_fkey" FOREIGN KEY ("changeSetId") REFERENCES "change_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
