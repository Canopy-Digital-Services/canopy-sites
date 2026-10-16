-- Epic 25: Form Type Selection (Hosted vs Embedded).
-- Forms now declare their delivery surface up front. The field is locked at
-- creation and drives editor branching, publish surfaces, and the public
-- endpoints (embed API rejects HOSTED with FORM_HOSTED_ONLY; /f/[formId]
-- rejects EMBEDDED with the existing Not Available page).

-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('HOSTED', 'EMBEDDED');

-- AlterTable: add the column nullable so the heuristic backfill below can
-- classify each existing row before we tighten the constraint.
ALTER TABLE "forms"
    ADD COLUMN "type" "FormType";

-- Backfill: forms that are published with no allowedOrigins are reachable
-- only via /f/[formId] in practice — classify them HOSTED. Everything else
-- (drafts, forms with allowedOrigins, etc.) was authored against the embed
-- workflow and stays EMBEDDED. Users who land on the wrong type can recreate
-- the form (type is immutable after creation).
UPDATE "forms"
    SET "type" = 'HOSTED'
    WHERE "published" = true
      AND cardinality("allowedOrigins") = 0;

UPDATE "forms"
    SET "type" = 'EMBEDDED'
    WHERE "type" IS NULL;

-- Lock the column NOT NULL now that every row has a value.
ALTER TABLE "forms"
    ALTER COLUMN "type" SET NOT NULL;
