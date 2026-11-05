-- Text no longer takes a format or length limits, and a Paragraph takes only
-- a character limit. A numbers-only Text becomes a whole Number. A URL Text
-- keeps its rule until the Website type takes it over.
UPDATE "fields" SET "type" = 'NUMBER', "validation" = '{"integer": true}'
WHERE "type" = 'TEXT' AND "validation"->>'format' = 'numbers';

UPDATE "fields" SET "validation" = NULL
WHERE "type" = 'TEXT' AND "validation" IS NOT NULL AND coalesce("validation"->>'format', '') <> 'url';

UPDATE "fields" SET "validation" = CASE
    WHEN jsonb_typeof("validation"->'maxLength') = 'number'
      AND ("validation"->>'maxLength')::numeric BETWEEN 1 AND 10000
      AND ("validation"->>'maxLength')::numeric % 1 = 0
    THEN jsonb_build_object('maxLength', "validation"->'maxLength')
  END
WHERE "type" = 'TEXTAREA' AND "validation" IS NOT NULL;
