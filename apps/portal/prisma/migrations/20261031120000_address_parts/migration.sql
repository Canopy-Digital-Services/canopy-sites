-- An Address lists the parts it collects (options.parts) instead of only
-- whether it shows line 2 (options.showLine2), so it can ask for just a city
-- or a ZIP. Each field keeps the parts it had; a field with no options still
-- collects every part.
UPDATE "fields"
SET "options" = ("options" - 'showLine2') || jsonb_build_object(
  'parts',
  CASE WHEN "options"->'showLine2' = 'false'::jsonb
    THEN '["line1", "city", "region", "postalCode"]'::jsonb
    ELSE '["line1", "line2", "city", "region", "postalCode"]'::jsonb
  END
)
WHERE "type" = 'ADDRESS' AND jsonb_typeof("options") = 'object' AND "options" ? 'showLine2';
