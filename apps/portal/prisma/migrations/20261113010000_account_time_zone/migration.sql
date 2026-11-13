-- The business's time zone moves from its site to its account, so an account
-- with no site has one too. sites."timeZone" stays, unread, until the next
-- production release drops it.
ALTER TABLE "accounts" ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'UTC';

-- Every account that exists before signup records a zone is one of Canopy's
-- own, in Pacific time.
UPDATE "accounts" SET "timeZone" = 'America/Los_Angeles';

-- An account with a site takes its site's zone.
UPDATE "accounts" SET "timeZone" = "sites"."timeZone" FROM "sites" WHERE "sites"."accountId" = "accounts"."id";
