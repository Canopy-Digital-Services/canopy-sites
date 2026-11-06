-- Epic 40, 4.4: quick edit reads the site's SITE_GUIDE.md (PRD D31), and the
-- runbook overlay is gone. The demo's overlay became canopy-demo-site's guide;
-- canopyds.com's was empty (both read from production, 2026-11-06).
-- AlterTable
ALTER TABLE "sites" DROP COLUMN "runbookOverlay";
