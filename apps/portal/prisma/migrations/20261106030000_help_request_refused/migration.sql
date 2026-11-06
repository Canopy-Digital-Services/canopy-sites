-- Epic 40, 4.4: marks text Quick Edit won't put on the site; the owner still
-- decides whether to send it to Canopy (PRD D34).
-- AlterTable
ALTER TABLE "help_requests" ADD COLUMN     "refused" BOOLEAN NOT NULL DEFAULT false;
