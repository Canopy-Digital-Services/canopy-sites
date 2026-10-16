-- AlterTable: Canopy Sites entitlement. Every existing plan, UNLOCKED
-- included, stays false: UNLOCKED means no Forms limits, not Sites.
ALTER TABLE "plans" ADD COLUMN     "sitesEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Seed the Sites plan: unlimited published forms (as PAID) plus Sites.
-- Operator-assigned only (isPublic = false).
INSERT INTO "plans" ("code", "displayName", "description", "maxPublishedForms", "sitesEnabled", "isPublic", "sortOrder") VALUES
    ('SITES', 'Sites', 'A Canopy Sites website, plus unlimited published forms.', NULL, true, false, 40);
