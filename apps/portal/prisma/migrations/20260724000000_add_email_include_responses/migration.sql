-- Epic 26: Full-Response Email Notifications.
-- Opt-in per form. When enabled, the notification email lists every submitted
-- value and sets Reply-To to the submitter's email address (when the form
-- collects one), so recipients can triage and reply without signing in.
-- Defaults to false so Epic 4's metadata-only email stays the behavior for
-- every existing form.

-- AlterTable
ALTER TABLE "forms"
    ADD COLUMN "emailIncludeResponses" BOOLEAN NOT NULL DEFAULT false;
