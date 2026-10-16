-- DropForeignKey
ALTER TABLE "forms" DROP CONSTRAINT "forms_createdByUserId_fkey";

-- AlterTable
ALTER TABLE "forms" ALTER COLUMN "createdByUserId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
