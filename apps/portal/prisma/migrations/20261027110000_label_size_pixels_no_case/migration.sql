-- Label size becomes pixels, as title size did in 20261027100000: write out
-- each saved theme's current pixel size, rounded, so no styled label changes
-- size. Labels left at the old default (md at 14px, 21px) take the new
-- default, 18, so 21 and 18 are left unwritten.
--
-- Labels lose their case setting too: a label in capitals is typed in
-- capitals. Drop labelTransform, so uppercase labels show as typed.
WITH sized AS (
  SELECT id,
    round(
      (CASE WHEN jsonb_typeof("defaultTheme"->'fontSize') = 'number'
            THEN ("defaultTheme"->>'fontSize')::numeric ELSE 14 END)
      * (CASE "defaultTheme"->>'labelSize'
           WHEN 'sm' THEN 1.25 WHEN 'lg' THEN 1.875 WHEN 'xl' THEN 2.25
           ELSE 1.5 END)
    )::int AS px
  FROM "forms"
  WHERE jsonb_typeof("defaultTheme") = 'object'
    AND jsonb_typeof("defaultTheme"->'labelSize') IS DISTINCT FROM 'number'
)
UPDATE "forms" f
SET "defaultTheme" = CASE
  WHEN sized.px IN (18, 21) THEN f."defaultTheme" - 'labelSize'
  ELSE jsonb_set(f."defaultTheme", '{labelSize}', to_jsonb(sized.px))
END
FROM sized
WHERE f.id = sized.id;

UPDATE "forms"
SET "defaultTheme" = "defaultTheme" - 'labelTransform'
WHERE jsonb_typeof("defaultTheme") = 'object' AND "defaultTheme" ? 'labelTransform';
