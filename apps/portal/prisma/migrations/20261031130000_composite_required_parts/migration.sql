-- Names and Addresses are required part by part (options.requiredParts).
-- Each field keeps what it required: a required field requires every part it
-- collects but the middle name or the apartment, and an optional one none.
-- A field without options collects the default parts, so those are listed.
UPDATE "fields" f
SET "options" = o.opts || jsonb_build_object(
  'requiredParts',
  CASE WHEN f."required" THEN COALESCE(
    (SELECT jsonb_agg(p) FROM jsonb_array_elements_text(o.parts) AS p
     WHERE p NOT IN ('middle', 'middleInitial', 'line2')),
    '[]'::jsonb
  ) ELSE '[]'::jsonb END
)
FROM (
  SELECT id,
    CASE WHEN jsonb_typeof("options") = 'object' THEN "options" ELSE '{}'::jsonb END AS opts,
    COALESCE(
      CASE WHEN jsonb_typeof("options"->'parts') = 'array' THEN "options"->'parts' END,
      CASE "type"
        WHEN 'NAME' THEN '["first", "last"]'::jsonb
        ELSE '["line1", "line2", "city", "region", "postalCode"]'::jsonb
      END
    ) AS parts
  FROM "fields"
  WHERE "type" IN ('NAME', 'ADDRESS')
) o
WHERE f.id = o.id
  AND NOT COALESCE(jsonb_typeof(f."options") = 'object' AND f."options" ? 'requiredParts', false);
