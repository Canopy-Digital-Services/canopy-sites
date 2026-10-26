-- The form title and the field labels shared one heading style (headingFont,
-- titleWeight, titleColor) and one case (labelTransform). They are styled
-- independently now, so each saved theme gets that shared style written out
-- for both: every form looks as it did, with separate tokens to change.
-- labelWeight was never written by the editor and labels ignored it; it is
-- replaced by the title weight the labels actually rendered at.
UPDATE "forms"
SET "defaultTheme" =
  ("defaultTheme" - 'headingFont' - 'labelWeight')
  || jsonb_strip_nulls(jsonb_build_object(
    'titleFont', COALESCE("defaultTheme"->'titleFont', "defaultTheme"->'headingFont'),
    'labelFont', COALESCE("defaultTheme"->'labelFont', "defaultTheme"->'headingFont'),
    'labelWeight', "defaultTheme"->'titleWeight',
    'labelColor', "defaultTheme"->'titleColor',
    'titleTransform', "defaultTheme"->'labelTransform'
  ))
WHERE jsonb_typeof("defaultTheme") = 'object';
