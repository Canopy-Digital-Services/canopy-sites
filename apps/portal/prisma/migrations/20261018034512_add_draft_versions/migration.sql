-- AlterEnum
ALTER TYPE "BuildStatus" ADD VALUE 'SUPERSEDED';

-- AlterTable
ALTER TABLE "builds" ADD COLUMN     "draftVersion" INTEGER;

-- AlterTable
ALTER TABLE "change_sets" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;
