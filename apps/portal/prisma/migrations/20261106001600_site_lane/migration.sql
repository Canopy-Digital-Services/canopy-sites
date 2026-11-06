-- Epic 40, 4.2 (PRD D50): fixed lists beside locked fields.
ALTER TABLE "sites" ADD COLUMN     "fixedLists" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Locks were dotted paths (site.contact.phone); they are addresses now
-- (site/contact/phone), in the same order. Every lock in use was a dotted
-- path of object keys (as of 2026-11-05: the demo's and canopyds.com's three
-- contact fields), so swapping the separator is the whole conversion.
UPDATE "sites"
SET "lockedFields" = ARRAY(
  SELECT replace(f, '.', '/')
  FROM unnest("lockedFields") WITH ORDINALITY AS t(f, n)
  ORDER BY n
)
WHERE array_length("lockedFields", 1) > 0;
