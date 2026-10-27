-- Hosted pages no longer center the form vertically: every page sits at the
-- top. The setting is gone from the editor and the renderer, so drop it from
-- saved themes rather than leave a value nothing reads.
UPDATE "forms"
SET "defaultTheme" = "defaultTheme" - 'verticalAlign'
WHERE jsonb_typeof("defaultTheme") = 'object' AND "defaultTheme" ? 'verticalAlign';
