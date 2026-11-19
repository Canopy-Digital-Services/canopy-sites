-- Site.timeZone retired 2026-11-12, when the zone moved to Account.timeZone
-- (20261113010000_account_time_zone copied it there); 5.21.0 took it out of
-- the Prisma client with @ignore, so no running release names the column.
ALTER TABLE "sites" DROP COLUMN "timeZone";
