-- A Phone's answer is its parts, { "number", "extension" }: an answer
-- stored as text becomes { "number": <the text> }, every Phone in a
-- submission at once.
UPDATE "submissions" s
SET "data" = s."data" || (
  SELECT jsonb_object_agg(f."name", jsonb_build_object('number', s."data"->f."name"))
  FROM "fields" f
  WHERE f."formId" = s."formId" AND f."type" = 'PHONE' AND jsonb_typeof(s."data"->f."name") = 'string'
)
WHERE EXISTS (
  SELECT 1 FROM "fields" f
  WHERE f."formId" = s."formId" AND f."type" = 'PHONE' AND jsonb_typeof(s."data"->f."name") = 'string'
);
