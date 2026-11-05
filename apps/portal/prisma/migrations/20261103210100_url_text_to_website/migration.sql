-- A URL Text becomes a Website, which checks the address itself. Apart from
-- the migration that adds WEBSITE: Postgres can't use a new enum value in
-- the transaction that adds it.
UPDATE "fields" SET "type" = 'WEBSITE', "validation" = NULL
WHERE "type" = 'TEXT' AND "validation"->>'format' = 'url';
