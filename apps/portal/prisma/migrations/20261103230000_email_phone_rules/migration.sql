-- Email keeps one rule, Work emails only, which a block list of personal
-- providers becomes; allow lists, other block lists and "Store in
-- lowercase" are dropped. Phone has no rules of its own: one check takes a
-- US, Canadian or international number.
UPDATE "fields" SET "validation" = CASE
    WHEN "validation"->'domainRules'->'block' ?| array['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com']
    THEN '{"workOnly": true}'::jsonb
  END
WHERE "type" = 'EMAIL' AND "validation" IS NOT NULL;

UPDATE "fields" SET "validation" = NULL
WHERE "type" = 'PHONE' AND "validation" IS NOT NULL;
