-- Who last changed a draft, and who published it (PRD D64).
ALTER TABLE "change_sets" ADD COLUMN "updatedByUserId" TEXT,
ADD COLUMN "publishedByUserId" TEXT;

-- Until now a change knew only who started it. For the changes already here,
-- that is the best answer to who last edited and who published.
UPDATE "change_sets" SET "updatedByUserId" = "createdByUserId";
UPDATE "change_sets" SET "publishedByUserId" = "createdByUserId" WHERE "status" = 'PUBLISHED';

-- AddForeignKey
ALTER TABLE "change_sets" ADD CONSTRAINT "change_sets_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_sets" ADD CONSTRAINT "change_sets_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
