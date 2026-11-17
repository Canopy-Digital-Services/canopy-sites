-- AlterTable
ALTER TABLE "memberships" ADD COLUMN     "welcomeShownAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "welcomeVideoKey" TEXT;
