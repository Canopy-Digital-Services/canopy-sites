-- CreateEnum
CREATE TYPE "PasswordTokenPurpose" AS ENUM ('RESET', 'CLAIM');

-- AlterTable
ALTER TABLE "password_reset_tokens" ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "emailedAt" TIMESTAMP(3),
ADD COLUMN     "purpose" "PasswordTokenPurpose" NOT NULL DEFAULT 'RESET';

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
