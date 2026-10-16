-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED');

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "billingRef" TEXT,
ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';
