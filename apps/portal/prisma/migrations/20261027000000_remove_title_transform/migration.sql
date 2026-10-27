-- The title no longer has a case setting: a title in capitals is typed in
-- capitals. Drop the token from saved themes (20261026210000 wrote it out
-- for themes whose shared heading case was uppercase).
UPDATE "forms"
SET "defaultTheme" = "defaultTheme" - 'titleTransform'
WHERE jsonb_typeof("defaultTheme") = 'object' AND "defaultTheme" ? 'titleTransform';
