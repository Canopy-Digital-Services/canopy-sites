-- A Name is required or not as a whole, its middle part always optional;
-- per-part required (options.partsRequired) goes. A Name that required every
-- part but the middle becomes required, so it keeps enforcing what it did.
UPDATE "fields" f
SET "required" = true
WHERE f."type" = 'NAME'
  AND NOT f."required"
  AND jsonb_typeof(f."options"->'partsRequired') = 'object'
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(
      COALESCE(f."options"->'parts', '["first", "last"]'::jsonb)
    ) AS part
    WHERE part NOT IN ('middle', 'middleInitial')
      AND COALESCE((f."options"->'partsRequired'->>part)::boolean, false) = false
  );

UPDATE "fields"
SET "options" = "options" - 'partsRequired'
WHERE "type" = 'NAME' AND jsonb_typeof("options") = 'object' AND "options" ? 'partsRequired';
