-- Email has no settings: Work emails only is retired.
UPDATE "fields" SET "validation" = NULL
WHERE "type" = 'EMAIL' AND "validation" IS NOT NULL;
