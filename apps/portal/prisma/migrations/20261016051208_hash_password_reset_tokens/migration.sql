-- Reset tokens are stored as SHA-256 hashes from here on. Outstanding tokens
-- are plaintext and live at most an hour, so they are deleted rather than
-- converted; anyone mid-reset requests a new link.
DELETE FROM "password_reset_tokens";

-- DropIndex
DROP INDEX "password_reset_tokens_token_idx";

-- DropIndex
DROP INDEX "password_reset_tokens_token_key";

-- AlterTable
ALTER TABLE "password_reset_tokens" DROP COLUMN "token",
ADD COLUMN     "tokenHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");
