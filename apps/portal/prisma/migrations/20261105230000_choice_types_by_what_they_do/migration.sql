-- Field types named for what they do: Dropdown is Choose one (buttons for a
-- short list, a dropdown for a long one), Checkboxes is Choose several, and
-- the single checkbox once called Yes / No is Approval. Text is labeled Short
-- answer (its name stays TEXT).
ALTER TYPE "FieldType" RENAME VALUE 'DROPDOWN' TO 'CHOOSE_ONE';
ALTER TYPE "FieldType" RENAME VALUE 'CHECKBOXES' TO 'CHOOSE_SEVERAL';
ALTER TYPE "FieldType" RENAME VALUE 'CHECKBOX' TO 'APPROVAL';

-- A label still its old type's name becomes the new one's.
UPDATE "fields" SET "label" = CASE "type"
    WHEN 'CHOOSE_ONE' THEN 'Choose one'
    WHEN 'CHOOSE_SEVERAL' THEN 'Choose several'
    WHEN 'APPROVAL' THEN 'Approval'
    WHEN 'TEXT' THEN 'Short answer'
  END
WHERE ("type", "label") IN (('CHOOSE_ONE', 'Dropdown'), ('CHOOSE_SEVERAL', 'Checkboxes'), ('APPROVAL', 'Yes / No'), ('TEXT', 'Text'));

-- No choice starts picked: a Choose one's default choice is retired.
UPDATE "fields" SET "options" = "options" - 'defaultValue'
WHERE "type" = 'CHOOSE_ONE' AND jsonb_typeof("options") = 'object' AND "options" ? 'defaultValue';
