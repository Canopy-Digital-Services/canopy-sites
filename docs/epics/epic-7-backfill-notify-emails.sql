-- Epic 7: Backfill notifyEmails for existing forms
-- For forms with emailNotificationsEnabled=true but empty notifyEmails,
-- populate with the owner's email address.
--
-- Apply via: cat docs/epics/epic-7-backfill-notify-emails.sql | docker exec -i canopy-forms-db psql -U user -d canopy-forms

UPDATE forms f
SET "notifyEmails" = ARRAY[(
  SELECT u.email FROM users u WHERE u."accountId" = f."accountId" LIMIT 1
)]
WHERE f."emailNotificationsEnabled" = true
AND (array_length(f."notifyEmails", 1) IS NULL OR array_length(f."notifyEmails", 1) = 0);
