-- Epic 40, 4.4: text Quick Edit refused to put on the site goes to Canopy at
-- once, with no card for the owner to send (PRD D34).
-- AlterTable
ALTER TABLE "help_requests" ADD COLUMN     "refused" BOOLEAN NOT NULL DEFAULT false;
