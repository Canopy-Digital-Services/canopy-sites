# Epic 35: Stats

**Status:** Approved (Michael, 2026-11-14), with section 6's decisions. In progress.
**Phase:** 3 (`docs/canopy-sites/ROADMAP.md`, E35). Its demo half shipped with Epic 30 (the page, sample data for the demo); this is the rest: real numbers from Umami.
**Predecessor:** Epic 30 (the Stats page and its sample source)

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/canopy-sites/PRD.md` (D15, D21, D23), `src/lib/stats/` in the portal, and in Nextcloud the Engineering page **Platforms/Umami** and the Canopy Sites page **Monthly Reports**.

---

## 1. Goal

An owner opens Stats and sees how many people visited their site, which pages they read, and how they found it, for the last 7, 30, or 90 days, counted in their business's time zone. The Veteran Entrepreneur Tribe of Sacramento site, live on its domain since 2026-11-13, is the first case (Michael, 2026-11-14).

## 2. Scope

### In

- **An Umami source behind `getSiteStats`** (4.1), read with a view-only Umami user's key.
- **Days in the account's time zone** (4.2), for Umami and the demo's sample data alike.
- **Views per visit as pageviews over visits** (4.3), not over visitors.
- **Sources an owner can read** (4.4).
- **A state for Umami being unreachable** (4.5).
- **The Umami team and the portal's user** (4.6), and the key on both portal apps.

### Out

| Not here | Why / where |
|---|---|
| Contact taps (Call, Email, Directions) | The center of the monthly report, the search and reporting tier's deliverable; Stats stays the basic stats the base price includes (Michael, 2026-11-14) |
| Page names in place of paths, change from the previous period, phone and desktop | Follow-ups once owners use the page |
| The Stats tab only for sites with an Umami id | Epic 38, 4.8 (the tabs) |
| Backups for Umami's database | Infrastructure, on the Umami page's own condition: before its numbers are client-visible. Tracked there |
| A cache | Owner traffic is a handful of page loads a day |

## 3. Order

4.6's Umami changes first (the key is Michael's to mint), then 4.1 to 4.5 in one pass, verified on :3006 against the VETS site's Umami website, then the release.

## 4. Requirements

### 4.1 The Umami source

- `src/lib/stats/umami.ts`, server only, reads `UMAMI_URL` and `UMAMI_API_KEY`. Four requests in parallel to `/api/websites/<id>/`: `stats` (totals), `pageviews` with `unit=day` and the zone (visitors and pageviews per day), and `metrics` for `path`, `referrer`, and `channel`.
- The website id comes only from the `Site` row read through the session's account; the range only from the fixed list. Nothing from the request reaches Umami's URL.
- `getSiteStats` answers one of three: stats, none (no source: no demo flag and no Umami id), or unavailable (the source failed or isn't configured here).

### 4.2 Days in the account's zone

- A range is today and the days before it in `Account.timeZone`, starting at local midnight. Umami buckets days in the same zone, and leaves out a day with no visits, which the source fills with zero.
- The sample source takes the zone too, so the demo's last day is its local today.

### 4.3 Views per visit

`StatsTotals` gains `visits`; the tile divides pageviews by visits, as Umami does. Dividing by visitors counted a returning visitor's visits as one (Toro Z's 30 days to 2026-11-14: 2.70 shown, 2.34 true).

### 4.4 Sources

Umami's referrer list leaves out visitors who came with no referrer, the largest group on a small site (Toro Z, same window: 358 of 527). The list is:

- "Typed in or from an app": Umami's `direct` channel, the monthly report's label.
- Every referrer domain, under a readable name for the common ones (`google.com` and its country domains as Google; Facebook, Instagram, Bing, and the rest), merged by name, others as the domain without `www.`.
- Without the site's own hostnames and `localhost`.

Most visitors first, at most ten rows, with shares of all visitors.

### 4.5 Unreachable

Umami down, slow past a timeout, or refusing the key: the page says Stats can't load right now and logs a line; it never errors. An empty list in a range with no visits says so in the list.

### 4.6 Umami: the team and the portal's user

- Team **Canopy Sites** (created 2026-11-14) holds every client website: canopyds.com, Hair & Harvest, Toro Z, Fur-Ever Friends, and VETS were moved into it that day. The admin still reads them all (an admin can view every website).
- User **canopy-portal**, role View only, a member of the team as View only, made by Michael in Umami's UI (the admin's API key gets a 401 creating users). Its key is the portal's `UMAMI_API_KEY`: it reads only the team's websites and can change none.
- A new site's Umami website is moved into the team when it is created (one call with the admin key: `POST /api/websites/<id>/transfer` with the team's id). The Umami page and the onboarding runbook say so.

## 5. Acceptance

- [ ] Signed in as the VETS owner's account (acting as the client), Stats shows the same visitors, pageviews, and visits as Umami for the same range in Pacific time
- [ ] A site with no Umami id shows "No stats yet"; the demo shows its sample data, its last day today in Pacific time
- [ ] With Umami unreachable or the key wrong, the page shows that Stats can't load, and the log names why
- [ ] The portal's key reads a team website and is refused a change to one
- [ ] `npm run build`, `lint`, `test` pass

## 6. Decisions

### Michael (2026-11-14)

- **D1. VETS is the case that works today**, released to production the same day.
- **D2. A view-only Umami user**, not the admin key: the portal holds a key that reads the client sites and changes nothing.
- **D3. Stats stays basic**: visitors, pageviews, top pages, sources, and the range. Contact taps stay the monthly report's.

## 7. Progress log

- 2026-11-14: Drafted and approved. Production read, read-only, with Michael's approval: `vets-website` is linked with its Umami id and a Pacific account. Umami: team created, the five client websites moved into it; `canopy-portal` waits on Michael.
