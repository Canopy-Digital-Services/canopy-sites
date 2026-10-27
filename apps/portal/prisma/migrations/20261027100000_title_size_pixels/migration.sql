-- Title size becomes pixels, picked from a list as in a word processor. It
-- was a key ("sm" to "xl", absent meaning "md") scaling the text size
-- ("fontSize", absent meaning 14). Write out each saved theme's current
-- pixel size, rounded, so no styled title changes size. The old default (md
-- at 14px, 21px) becomes the new default, 20, and is left unwritten.
WITH sized AS (
  SELECT id,
    round(
      (CASE WHEN jsonb_typeof("defaultTheme"->'fontSize') = 'number'
            THEN ("defaultTheme"->>'fontSize')::numeric ELSE 14 END)
      * (CASE "defaultTheme"->>'titleSize'
           WHEN 'sm' THEN 1.25 WHEN 'lg' THEN 1.875 WHEN 'xl' THEN 2.25
           ELSE 1.5 END)
    )::int AS px
  FROM "forms"
  WHERE jsonb_typeof("defaultTheme") = 'object'
    AND jsonb_typeof("defaultTheme"->'titleSize') IS DISTINCT FROM 'number'
)
UPDATE "forms" f
SET "defaultTheme" = CASE
  WHEN sized.px IN (20, 21) THEN f."defaultTheme" - 'titleSize'
  ELSE jsonb_set(f."defaultTheme", '{titleSize}', to_jsonb(sized.px))
END
FROM sized
WHERE f.id = sized.id;
