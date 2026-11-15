-- A site's welcome video becomes one video per tab of its portal, and each
-- person's showing and watched figure one row per video (ROADMAP E39).

-- CreateTable
CREATE TABLE "welcome_videos" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "tab" TEXT NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "welcome_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "welcome_views" (
    "videoId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "shownAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "watchedSeconds" INTEGER,
    "videoSeconds" INTEGER,

    CONSTRAINT "welcome_views_pkey" PRIMARY KEY ("videoId","membershipId")
);

-- CreateIndex
CREATE UNIQUE INDEX "welcome_videos_siteId_tab_key" ON "welcome_videos"("siteId", "tab");

-- CreateIndex
CREATE INDEX "welcome_views_membershipId_idx" ON "welcome_views"("membershipId");

-- AddForeignKey
ALTER TABLE "welcome_videos" ADD CONSTRAINT "welcome_videos_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "welcome_views" ADD CONSTRAINT "welcome_views_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "welcome_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "welcome_views" ADD CONSTRAINT "welcome_views_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The one video a site had opened on Quick Edit, where a person lands: it is
-- that tab's video now, with what each person had of it. Its two files take
-- the tab's name in front (welcome/<siteId>/quick-edit-<key>.mp4), by hand,
-- where a volume holds any: no deployed app had one when this was written.
INSERT INTO "welcome_videos" ("id", "siteId", "tab", "key")
SELECT gen_random_uuid()::text, "id", 'quick-edit', "welcomeVideoKey"
FROM "sites"
WHERE "welcomeVideoKey" IS NOT NULL;

INSERT INTO "welcome_views" ("videoId", "membershipId", "shownAt", "watchedSeconds", "videoSeconds")
SELECT v."id", m."id", m."welcomeShownAt", m."welcomeWatchedSeconds", m."welcomeVideoSeconds"
FROM "memberships" m
JOIN "sites" s ON s."accountId" = m."accountId"
JOIN "welcome_videos" v ON v."siteId" = s."id"
WHERE m."welcomeShownAt" IS NOT NULL;

-- These columns never reached a production release, so no container that
-- names them is left running when they go (AGENT_CONTEXT section 5).
-- AlterTable
ALTER TABLE "memberships" DROP COLUMN "welcomeShownAt",
DROP COLUMN "welcomeVideoSeconds",
DROP COLUMN "welcomeWatchedSeconds";

-- AlterTable
ALTER TABLE "sites" DROP COLUMN "welcomeVideoKey";
