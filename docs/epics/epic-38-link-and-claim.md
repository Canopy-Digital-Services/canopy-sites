# Epic 38: Link and claim

**Status:** Draft for Michael's approval (2026-11-05). No code, migration, or deploy until he approves it.
**Phase:** 3, Editor (`docs/canopy-sites/ROADMAP.md`), ahead of Phase 5 (Toro Z)
**Predecessor:** Epic 37 (canopyds.com on Sites), whose run produced the Sites Onboarding Runbook this epic rewrites
**Successor:** T1, Toro Z Muay Thai (login `torozmuaythai@gmail.com`), the first client to be linked and to claim

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/ACCOUNT_OPERATIONS.md` (all of it: this epic changes account creation, reset, and the operator's reach), `docs/canopy-sites/PRD.md` (D3, D4, D11, D16, D19, D22, D24, D47, sections 5 and 6), `docs/canopy-sites/ROADMAP.md` (E32's "edit as client", E36, T1), `docs/epics/epic-28-account-audit-membership.md` (sessions, tokens, the security assessment), `docs/epics/epic-29-plan-site-model-operator-sites.md`, `docs/epics/epic-37-canopyds-on-sites.md` (sections 4.4 and 4.5), `docs/UX_PATTERNS.md` section 1, `apps/builder/README.md`, and the `docs/tools/*.md` for whatever you touch. In Nextcloud: **Sites Onboarding Runbook** (Canopy Sites), **GitHub**, **Coolify**, **Migadu** and **Expirables Register** (Engineering).

---

## 1. Goal

Michael builds a client's site in Claude Code, in its own repo in the Canopy-Digital-Services org, and Coolify deploys it on push. Once it's live he links it in the operator console: the client's email, the business name, and the repo, picked from the org. That creates the client's Sites account, an owner who hasn't claimed it, and the Site row, and runs the first Build and publish. He checks the site as the client, then texts the client a claim link (or has the portal email it). The client opens it on their phone, sees their site's name and their email, sets a password, and lands in the portal with a welcome video Michael recorded for them. The operator site page shows where each client is: link sent, claimed, welcome watched or skipped, last sign-in.

No step needs the client's password, a personal access token, a builder env var, or a builder redeploy.

## 2. Scope

### In

- **Schema (4.1)**: an owner who hasn't claimed, claim tokens beside reset tokens, the welcome video and its outcome, act-as on a session.
- **Repo access through a GitHub App (4.2)**: the builder reaches site repos as an org-owned "Canopy Sites" App and lists them for the portal.
- **Link (4.3)**: one operator form creates the account, owner, and site and runs the first build.
- **Claim (4.4)**: the claim link, its email, the claim page, and Forgot password before claiming.
- **Act as client (4.5)**: the operator inside a client's account, with a banner, recorded as the actor.
- **Welcome video (4.6)**: per site, opened on the first session after claiming, outcome recorded.
- **Operator status (4.7)**: where each client stands, on the site page and the Sites list.
- **The Forms tab (4.8)**: shown when the account has a form.
- **Link from Claude Code (4.9)**: the same link function, run in the portal container. Lowest priority; cut it before anything else.
- **Docs (4.10)**: the PRD decision, the ROADMAP entry, and every page section 10 lists.

### Out

| Not here | Why / where |
|---|---|
| Toro Z's own migration: contract 0.5.0, an allowlist of owner-editable fields, `SITE_GUIDE.md` prose for Quick Edit in place of `Site.runbookOverlay`, a new `BASE_RUNBOOK` | The Toro Z effort (T1) and ROADMAP E32 |
| Invites and member roles UI | PRD section 2 keeps them out of v1. A claim is the one owner of a site getting into an account Canopy made; nobody invites anybody |
| More than one membership per user, an account switcher | Act-as (4.5) gives the operator a client's account without a membership |
| Creating the repo, DNS, Coolify app, or Umami website from the portal | Michael builds and deploys in Claude Code; Coolify's API is reachable only from webber and its token stays out of the portal (Michael, 2026-11-05) |
| Linking by Coolify app | The repo is the site's lasting identity; sites stop deploying through Coolify at E36 (Michael, 2026-11-05) |
| Sign-in without a password (an emailed sign-in link, passkeys) | Section 7, with the canopyds.com copy it bears on |
| Recording or hosting the video in the portal | Michael records each one in Loom (4.6) |

## 3. Order

- 4.1 lands first, one migration per logical change (AGENT_CONTEXT section 5).
- 4.2 can run in parallel with everything in the portal. It deploys before 4.3, which reads the repo list from it; until then 4.3's repo field takes a URL.
- 4.3, then 4.4 and 4.5 (independent of each other), then 4.6 and 4.7, which read what 4.4 and 4.5 write. 4.8 any time.
- 4.9 last.
- The demo and canopyds.com move to the App (4.2) before Toro Z is linked, so Toro Z never gets a PAT.

About four sessions: 4.1 with 4.3; 4.2; 4.4 with 4.5; 4.6 to 4.9.

## 4. Requirements

### 4.1 Schema

Checked against `prisma/schema.prisma` on 2026-11-05: `User.password` is non-null, a `Membership` is unique per user and account (the database allows a user several accounts; v1's one-per-user rule is `getSoleMembership`'s throw), and an operator can't create an account at all, only add a `MEMBER` with a random, unusable password (`src/actions/admin/members.ts`).

- **`User.password` becomes nullable.** Null means the owner hasn't claimed: there is no password to guess, which an unusable random hash only pretends. Sign-in verifies against the dummy hash when it's null, so an unclaimed email takes as long and answers the same as a wrong password. Every reader of `password` handles null (`signInAction`, `changePassword`, `needsRehash`).
- **`PasswordResetToken` becomes `PasswordToken`** (the table name kept with `@@map`) with `purpose` (`RESET | CLAIM`, default `RESET`), `createdByUserId?` (the operator who minted a claim link; null when the owner asked through Forgot password), and `emailedAt?` (null for a link the operator copied to text). A claim lasts 7 days, a reset 1 hour. A new token of either purpose retires the user's earlier unused ones, as reset does today, so only the newest link works. "Link sent" and "claimed" on the operator page (4.7) are the newest claim token's `createdAt` and `usedAt`: no status columns.
- **`Site.welcomeVideoUrl String?`** (4.6).
- **Membership gets `welcomeOpenedAt`, `welcomeClosedAt`, `welcomeSecondsOpen`** (4.6): the video belongs to the account's site, and a membership is a user in that account.
- **`ActAs`** (`id`, `operatorUserId`, `accountId`, `startedAt`, `endedAt?`), and **`Session.actAsId?`** pointing at the open one (4.5). Deleting an account cascades its `ActAs` rows; deleting the operator's user keeps them, with `operatorUserId` set to null (`onDelete: SetNull`, so the column is nullable).
- The `Site.slug` comment stops saying it names `GIT_TOKEN_<SLUG>` once 4.2 retires the PATs.

The AGENT_CONTEXT appendix and `docs/ACCOUNT_OPERATIONS.md` diagrams change with it (section 10).

### 4.2 Repo access through a GitHub App (`apps/builder`)

Checked 2026-11-05: the org's GitHub Apps are `canopyds-github` (Coolify's: all repos, Contents **read**, so it can't push) and Anthropic's `Claude` App. The builder reaches each site through a fine-grained PAT on Michael's personal account (`GIT_TOKEN_DEMO`, `GIT_TOKEN_CANOPYDS`, expiring 2027-01-14 and 2027-01-17).

- **Michael creates a "Canopy Sites" GitHub App owned by the org**: Contents read and write, Metadata read, no other permission, webhook off (nothing needs one, so no Access bypass either, Engineering → Coolify). Installed on **selected repositories only**: an all-repositories install would let the builder push to `canopy-sites` itself and the org's private business repos (`canopy-bd`, the MCP servers). Adding a site repo to the installation is the whole per-site step: no token, no expiry, no env var, no redeploy.
- **The builder holds the App's id, installation id, and private key** (`GITHUB_APP_ID`, `GITHUB_APP_INSTALLATION_ID`, `GITHUB_APP_PRIVATE_KEY`, runtime only). It signs a JWT, mints an installation token limited to the one repo a job names (`repositories: [<name>]`, `permissions: { contents: write }`), and caches it until a few minutes before its hour is up. The token goes into git exactly as the PAT does (`x-access-token` in the environment's `extraheader`, never argv, the remote URL, or a log, `src/git.ts`). Site build steps still get no secret (`src/sandbox.ts`).
- **`GET /v1/repos`** lists the installation's repositories (full name, private, default branch), so the portal's picker (4.3) needs no GitHub secret of its own: the key lives in one place.
- **`GIT_TOKEN_<SLUG>` stays as a fallback** while the demo and canopyds.com move over, then goes: the code path, the README row, both PATs revoked on GitHub, both Expirables rows replaced by one for the App's key (no expiry; rotation means a new key in `canopy-builder`'s env and a redeploy).
- Commits keep the publisher as author (`requestPublish`'s `authorName`/`authorEmail`); the push shows as the App, not as Michael. If `main` gets branch protection later, the App goes on its bypass list.
- `repoUrl` stays the site's identity. GitHub redirects a renamed repo's git URL, so a rename doesn't break a site.

### 4.3 Link (operator console)

**Operator → Sites → Link a site** replaces New site. One form:

- **Client email** (normalized; the owner's sign-in).
- **Business name** (`Site.name`, shown on the claim page and in the portal).
- **Repository**, picked from the builder's `GET /v1/repos`, less repos another site already uses. With no builder configured (development, forms-dev), a URL field. The slug defaults from the repo name (lowercase, hyphens), shown and editable, since it names `/srv/sites/<slug>` and is fixed once created.
- **Production hostnames** and **Umami website id**, typed (Michael, 2026-11-05).
- Branch (`main`), time zone (`America/Los_Angeles`), and locked fields (`site.contact.phone`, `.email`, `.address`) take their defaults and stay editable on the site page.

`linkSite` (`src/lib/site-link.ts`, with no session of its own; the server action checks `requireGlobalAdmin` and passes the actor):

- In one transaction: a User with no password, an Account on `SITES`, an `OWNER` Membership, and the Site. If the email already has a user, refuse with the reason (one membership per user). The exception is an account with no site on the `SITES` plan, which the form offers to link instead.
- Then, outside it, the first Build and publish (`buildAndPublish` in `src/actions/admin/site-builds.ts`). A failed build leaves the rows and shows the failure on the site page, with Build and publish to retry; an account is never rolled back for a build.
- **No claim link goes out at link time.** Michael checks the site as the client first (4.5, the runbook's acceptance), then sends it from the site page (4.4).
- Logged like `createSite` (`event`, `actorEmail`, ids).
- **`Site.contractVersion` is written by every content read the portal makes, not only by the operator's Build and publish**, and the operator form's Contract version field goes: the builder reports the repo's installed contract on every read (`fetchContent`), and today the column lags a Canopy push (canopyds.com read 0.2.0 while running 0.4.0, 2026-11-05).

`addAccountMember` (Operator → Accounts → Add member) stays for the demo account's partners, and its new user also starts unclaimed, with a claim link from the same card (4.4) instead of "use Forgot password".

### 4.4 Claim

**The link.** On the operator site page, the owner card has **Copy claim link** and **Email claim link**, and after a send, **Send a new link**. Each mints a claim token (retiring the last), so a link copied and lost is replaced, never recovered: the database keeps only the hash. Copy shows the URL once, ready to paste into a text. The URL is the account's home host (`appUrlFor`, so `SITES_URL` for a Sites account) plus `/claim?token=…`, never the request's host (AGENT_CONTEXT section 2).

**The email.** Plain and short, in the product's name (`productNameFor`), no em dashes (Copy Guidelines bucket 2):

> Subject: Your website account for Toro Z Muay Thai
>
> Michael at Canopy set up an account for you to update torozmuaythai.com.
>
> Set your password: <link>
>
> The link works once and expires on November 12.

The current mail goes out through Migadu from `Forms@CanopyDS.com` for every product (production env, checked 2026-11-05), within Migadu's 20 a day outgoing limit for the whole account (Engineering → Migadu). A Sites claim from "Forms@" reads wrong: section 7.

**The page.** `/claim` on the Sites host, in the auth layout with the host's branding:

- Opening the link reads the token and consumes nothing, so a messaging app's link preview can't use it up. Only setting the password consumes it, with one conditional update, as reset does (`resetPassword`).
- It shows the site's name and the owner's email, which can't be changed there, a new password (`PasswordInput`, `new-password`, with a hidden `username` field holding the email, so the phone's password manager saves the pair), and **Set password**. Nothing else on the page: no third-party script, since the token is in the URL.
- On success: the password and `passwordChangedAt` set, the token consumed, a "keep me signed in" session started, and home (`/quick-edit`), where the welcome video opens (4.6). The owner's `lastLoginAt` is set as a sign-in sets it.
- A used or expired link says so and offers to send a new one to the same address (the Forgot password path below), so a client who waited too long needs nothing from Michael.

**Before claiming:**

- **Sign-in** answers an unclaimed email exactly as a wrong password.
- **Forgot password** for an unclaimed email sends the claim email instead of a reset, with a fresh 7-day claim token, under the same throttle and the same generic answer, so the response still says nothing about the account.
- A claimed owner's Forgot password is today's reset.

**Tests (database):** a claim token can't be used twice, after 7 days, or after a newer one is minted; a reset token can't claim and a claim token can't reset a claimed user; sign-in with an unclaimed email fails and costs the same verification as a wrong password; Forgot password for an unclaimed user mints a claim token, not a reset; the claim link's host is the account's home host. Each fails with its guard removed.

### 4.5 Act as client

Never built: PRD section 6 and ROADMAP E32 name "edit as client", and nothing implements it (2026-11-05). Smaller than E32's version: for acceptance, support, and building a client a form, not for building the site (Michael, 2026-11-05).

- **Act as client** on the operator site page (Global Admin only). It opens an `ActAs` row and points the operator's own session at it. The operator never holds the client's password or a membership in their account.
- **While acting, the account is the client's.** `getCurrentAccountId` resolves the acted account when the session has an open `ActAs` and the user is still a Global Admin (re-read every request, as the role is). Everything that checks membership directly moves into `src/lib/data-access/memberships.ts` first and honors the same rule: `canPreviewSite` (`src/lib/site-tools/index.ts`, used by `/canvas` and `/preview`) and the form thumbnail route (`src/app/api/forms/[formId]/thumbnail/route.ts`), found by grep on 2026-11-05. AGENT_CONTEXT section 2 already says membership is resolved only there; those two break the rule.
- **A banner on every page while acting**, the portal's chrome and the preview page's bar alike: "Acting as Toro Z Muay Thai (torozmuaythai@gmail.com)" and **Stop**. Stop, sign-out, and the session's end close the `ActAs` row.
- **The operator is the actor.** Sites writes already name the session user: a ChangeSet's `createdByUserId`, a Conversation's `userId`, the published commit's author. A form created while acting has the operator as `createdByUserId`. Forms edits record no actor for anyone today; the `ActAs` row (who, which account, from when to when) is their record, and this epic adds no per-row actor columns to Forms (section 7).
- **Off limits while acting**, refused in the actions as well as hidden: changing the password or email, deleting the account, and signing out the owner's other sessions. Acting never opens the welcome video, never records its outcome, and never sets the owner's `lastLoginAt`.
- Sites accounts only in this epic: the operator's own account is on the Sites host, and acting on a Forms-only account would send the session to the other host (D22).
- **Tests (database):** a non-admin's session with an `actAsId` resolves their own account; a demoted admin's acting ends on the next request; `/canvas` and `/preview` admit an acting admin and still refuse anyone else; the off-limits actions refuse while acting; a ChangeSet made while acting names the operator.

### 4.6 Welcome video

One per client: Michael records a walkthrough in Loom for each, because each portal shows different things depending on what the site has (Michael, 2026-11-05).

- **The URL** goes on the operator site page (`Site.welcomeVideoUrl`). A Loom share or embed URL, stored as the embed URL (`https://www.loom.com/embed/<id>`); other hosts are refused, so the player's behavior is known.
- **It opens once**, in a dialog, on the owner's first session after claiming, and only when the site has a URL. It never autoplays (the embed's `autoplay=0`), so it never starts with sound.
- **Captions:** Loom's auto-captions, which Michael checks and corrects in Loom before he pastes the URL. Runbook step, and an acceptance item below.
- **Watched or skipped.** The dialog records when it opened, when it closed, and how long it was open (`welcomeOpenedAt`, `welcomeClosedAt`, `welcomeSecondsOpen`). The operator page shows it against the video's length ("Open 4:12 of a 5:03 video", "Closed after 6 s"). Whether Loom's embed reports play and progress to the page is unverified (2026-11-05); if it does, record real progress instead, and say which in the completion report.
- **After that** it's in the help bubble ("Welcome video"), which every signed-in page already has (UX_PATTERNS section 10, Help bubble). Reopening it records nothing.
- The portal's CSP is only `frame-ancestors 'none'` (`next.config.ts`, checked 2026-11-05), so a Loom frame loads without a CSP change. A `frame-src` added later must allow `www.loom.com`.

### 4.7 Operator status

The site page's owner card shows, for the owner:

- **Link sent**: when, how (emailed or copied), by whom; or "Not sent".
- **Claimed**: when; or "Not yet", with the send buttons (4.4).
- **Welcome video**: the outcome (4.6), "Not opened", or "No video" when the site has none.
- **Last sign-in**: `User.lastLoginAt`, which acting never sets (4.5).

The Sites list gets one status column: Not sent, Link sent, Claimed, Signed in recently.

### 4.8 The Forms tab

`SitesNav` (`src/components/sites/sites-nav.tsx`) lists Forms for every Sites account. Toro Z has no form, and a per-client video should walk a nav that matches what the client has.

- **Forms shows when the account has at least one form, or while acting** (so Michael can build a client's first form, 4.5). The layout passes it in; it costs one count.
- `/forms` itself stays reachable, so a submission email's link or a help page never 404s.

### 4.9 Link from Claude Code

At the end of a build in Claude Code, the link step runs without the browser.

- A server action can't serve: it needs a browser session, and its action id changes with every build (project memory, "server actions over curl"). A new HTTP route with an operator key would be a second way to authenticate a request (AGENT_CONTEXT section 2).
- So the CLI calls the same `linkSite` (4.3): `scripts/link-site.ts`, bundled into the production image at build time (the image runs Node 20, which can't run TypeScript), run as `ssh webber docker exec <portal container> node …/link-site.mjs` with the form's fields as JSON and `--actor <email>`, which must be a Global Admin. The trust boundary is a shell on webber, which already reaches everything. The container is found by its Coolify label, not its name, which changes every deploy.
- The Sites Onboarding Runbook names it as the alternative to the form.

### 4.10 Docs with the behavior

Each change in section 10 lands in the commit that causes it (DOC_MAINTENANCE rule 15). Two land with the first commit of this epic, after approval:

**PRD decision row:**

| # | Decision | Src |
|---|---|---|
| D49 | **Link, then claim.** Canopy builds a client's site and deploys it before the client has an account. The operator links the live site by its GitHub repo, which creates the account, an owner who hasn't claimed it, and the site, and runs its first build. The operator checks the site acting as the client, then sends a single-use claim link (texted, or emailed by the portal) that lasts a week and can be re-sent; the client sets a password on a page showing their site and email. Before claiming, Forgot password sends the claim. The operator acts as a client for acceptance, support, and building forms, never with the client's password, with a banner and the operator recorded as the actor. A welcome video per client opens on the first session after claiming. This is not an invite flow: one owner, no member roles (section 2). Repo access is an org-owned GitHub App, installed per site repo (Epic 38) | M/R |

and section 2's "Out of v1" row "New-site onboarding automation | Michael creates sites in operator by hand" becomes "Repo, DNS, Coolify app, and Umami website from the portal | Michael creates them; the operator links the live site (D49)".

**ROADMAP entry**, in Phase 3 after E37, with Phase 5's line reading "(needs E38)":

> ### E38 · Link and claim
>
> From `docs/epics/epic-38-link-and-claim.md`. The operator links a live site by its repo, which creates the client's account and site; the client claims it from a link, and a welcome video opens on their first session. Act as client (E32's "edit as client", smaller), the operator's view of where each client stands, and a GitHub App in place of per-site tokens. Toro Z is its first client (PRD D49).

E32's bullet "Operator: … 'edit as client' opens the same chat with operator identity recorded on the ChangeSet" loses its "edit as client" half to E38.

## 5. Acceptance

With Toro Z as the first client, once its repo builds on the contract (T1):

- [ ] The demo and canopyds.com build and publish through the Canopy Sites App; `GIT_TOKEN_DEMO` and `GIT_TOKEN_CANOPYDS` are gone from `canopy-builder` and revoked on GitHub; the Expirables Register has the App's key in place of both
- [ ] Link a site lists `toroz` among the org's repos and none already linked; linking it with `torozmuaythai@gmail.com`, "Toro Z Muay Thai", `torozmuaythai.com` and `www`, and the Umami id creates the account, the unclaimed owner, and the site, and the first build publishes
- [ ] Acting as Toro Z, every item of the runbook's acceptance passes, under the banner. A publish while acting commits with Michael as author. The Forms tab shows while acting and not after Stop
- [ ] Copy claim link gives a link on `sites.canopyds.com`; texted to the owner, its preview leaves it working; on the owner's phone the claim page shows "Toro Z Muay Thai" and the email; the password manager offers to save the new password; Set password lands on Quick Edit
- [ ] The welcome video opens once, silent until played, with correct captions; closing it shows its outcome on the operator page; the help bubble reopens it
- [ ] The operator page shows link sent, claimed, the welcome outcome, and last sign-in, each as it happened
- [ ] Before claiming: sign-in fails as a wrong password does; Forgot password sends the claim email, not a reset. After: Forgot password sends a reset. A second use of a claim link, an expired one, and one replaced by a newer send each refuse
- [ ] Signed in as the owner, the nav is Quick Edit · Editor · Stats with no Forms
- [ ] From Claude Code, the CLI links a throwaway repo on the local stack exactly as the form does
- [ ] `npm run build`, `lint`, `test` pass; every guard's test fails with the guard removed

## 6. Decisions

### Michael (2026-11-05)

- **Link, don't build.** The site is built in Claude Code and deployed by Coolify; the operator console links it once it's live: client email, business name, a repo from the org. That creates the account, an unclaimed owner, and the Site row, then runs the first Build and publish.
- **Link by GitHub repo, not by Coolify app.** The repo is the site's lasting identity, and sites stop deploying through Coolify at E36. Coolify's API is reachable only from webber, so its token stays out of the portal. Hostnames and the Umami id are typed.
- **Claim.** A claim link to text, or the portal emails it; single use, about a week, re-sendable. The page shows the site name and the fixed email, and the client sets a password. Before claiming, Forgot password sends the claim email.
- **One welcome video per client**, recorded in a Loom-type tool. Its URL on the Site row; it opens on the first sign-in after claiming, never autoplays with sound, and stays reachable afterward; captions checked; watched or skipped recorded.
- **The operator site page shows status**: link sent, claimed, welcome watched or skipped, last sign-in.
- **Act-as-client stays, smaller**: acceptance, support, and building a client a form, with a banner and the operator recorded as the actor.
- Leaning yes, checked here: a GitHub App for repo access (4.2), Forms shown only with a form (4.8), and the link step callable from Claude Code (4.9, lowest priority).

### Agent calls inside scope

- **A nullable password, not a random one,** for an unclaimed owner (4.1): a random hash is a password nobody knows but the code can't tell from a real one.
- **Claim tokens share the reset token's table** (4.1): the same hashing, single use, and retiring of older links, with a purpose and its own lifetime.
- **No claim link at link time** (4.3): acceptance acting as the client comes first, so the client never opens a portal Michael hasn't checked.
- **The App's key lives on the builder only**, and the portal asks the builder for the repo list (4.2).
- **Act-as is a state of the operator's own session**, not a membership and not a second session: one cookie per host, and the role is re-checked every request (4.5).
- **Act-as covers Sites accounts only** (4.5).
- **The welcome video is Loom only** (4.6), so its player's behavior is known.
- **The help bubble reopens the video** (4.6), not the account menu, whose items are account settings.

## 7. Open

Each with a recommendation.

- **"You never have to remember a password."** canopyds.com/websites says, under "No dashboards to learn": "You never have to remember a password or dig through a backend you only touch twice a year" (live page, 2026-11-05). A claim sets a password, and "keep me signed in" lasts 30 days at most (ACCOUNT_OPERATIONS, timeout policy), so a client who visits twice a year signs in every time. Michael's copy, flagged, not edited. *Recommendation:* ship the password claim with the phone's password manager saving it (4.4), and change the sentence, as PRD section 1 already plans for "No dashboards to learn". If owners still get stuck, an emailed sign-in link is a later epic; it is a second way to authenticate, with its own tests.
- **Which address sends a Sites email.** Every email goes out as `Forms@CanopyDS.com` through Migadu, whose 20 a day outgoing limit covers the whole account (Engineering → Migadu). *Recommendation:* a `sites@canopyds.com` sender for Sites accounts (one alias on the existing mailbox, picked by `productNameFor` beside the link host), and the copied link as the usual way to send a claim, which costs no email.
- **Actor columns on Forms writes.** Only the `ActAs` window says who changed a form while acting. *Recommendation:* enough for now; add `updatedByUserId` to `Form` if a client ever asks who changed something.
- **Watched or skipped, measured.** If Loom's embed doesn't report progress, the dialog's time open is the measure (4.6). *Recommendation:* accept that; self-hosting the video for exact progress isn't worth a media pipeline.
- **The superseded Pillars page.** Pillars & Product Architecture (Canopy Sites) still describes shared per-site logins and lists impersonation as a non-goal, under a "Superseded, kept for history" banner. *Recommendation:* delete its access-model text with this epic's runbook change (section 10), since act-as now contradicts it.

## 8. Completion report

Not started.

## 9. Progress log

- 2026-11-05: Drafted from Michael's brief, after checking it against the code, the docs, Nextcloud, and production (read only):
  - Production has two sites, the demo and canopyds.com, each on a `SITES` account with one owner; no user has more than one membership; no Toro Z user exists.
  - Toro Z's Coolify app deploys `toroz` `main` through Coolify's GitHub App webhook (a webhook deploy on 2026-10-08) with its health check on, so Toro Z can publish by push as canopyds.com does, without E36. ROADMAP and PRD corrected the same day.
  - `toroz`'s `.dockerignore` drops `*.md` and its Tailwind import scans the whole project, so its production image and the builder would build different CSS. The Sites Onboarding Runbook's build-parity step now says to limit Tailwind's sources to `src/`.
  - Site repo access: the org's Coolify App is read-only, so a push needs a new App (4.2).

## 10. Docs this makes stale

Each lands with the change that causes it, never in a later pass.

**This repo**

- `docs/canopy-sites/PRD.md`: D49 and the section 2 row (4.10). Section 5's data model: the owner's nullable password, claim tokens, `Site.welcomeVideoUrl`, act-as. Section 6's Operator row: "edit as client" becomes act as client. D24: `Site.contractVersion` written on every content read (4.3). Section 1's copy note gains the password sentence if Michael changes it.
- `docs/canopy-sites/ROADMAP.md`: the E38 entry and Phase 5's "(needs E38)" (4.10); E32's "edit as client" half removed; "Not scheduled" loses "New-site onboarding automation" to the narrower item in D49's row.
- `docs/AGENT_CONTEXT.md`: section 2, Auth & ownership (an owner with no password, claim tokens, act-as resolved in `getCurrentAccountId` and nowhere else, and that membership checks live only in `memberships.ts`); Products and chrome (the Forms tab's condition); section 3 (`/claim`, the act-as banner's rule); section 7 (a Sites sender, if one is added); the appendix's data model.
- `docs/ACCOUNT_OPERATIONS.md`: Account Creation (the operator's link beside signup), a Claim section, Password Reset (the claim path for an unclaimed owner), Operator Account Management (act-as, its limits and its record), the model diagram.
- `docs/UX_PATTERNS.md`: the act-as banner (section 2's Notices), the welcome video dialog (section 7), the claim page with the auth pages (section 8), the help bubble's new item (section 10).
- `apps/builder/README.md`: the GitHub App variables in place of `GIT_TOKEN_<SLUG>`, and `GET /v1/repos`.
- `apps/portal/prisma/schema.prisma`: `Site.slug`'s comment.
- `apps/portal/src/actions/admin/members.ts`: its header comment (random password, Forgot password).
- `apps/portal/content/docs/account.md`: signing in for the first time from a claim link, and Forgot password before claiming. Sites owners have no help pages of their own yet (as of 2026-11-05).
- `docs/epics/README.md` and `CHANGELOG.md`: the release (AGENT_CONTEXT section 10).

**Nextcloud**

- Canopy Sites → **Sites Onboarding Runbook**: section 1 (the owner no longer needs an account first); section 4 steps 1 and 2 (add the repo to the Canopy Sites App, in place of a PAT, an env var, and a redeploy) and step 3 (Link a site, or the CLI, in place of New site and the settings form); section 5 (acceptance run acting as the client); section 6 (record the welcome video in Loom and check its captions, paste its URL, send the claim link, watch the status).
- Canopy Sites → **Pillars & Product Architecture**: its superseded access model and its ban on impersonation, deleted (section 7).
- Engineering → Platforms → **GitHub**: the `canopy-builder` row becomes the Canopy Sites App (selected repos, Contents write, key on the builder); the "one PAT per site" and "Never used" traps go with the PATs; pushes show as the App.
- Engineering → **Expirables Register**: the two PAT rows replaced by the App's private key (no expiry, how to rotate).
- Engineering → Platforms → **Migadu**: Sites claim and reset emails as a sender within the 20 a day limit, if they go through Migadu.
- Engineering → Platforms → **Coolify**: nothing; its token stays out of the portal.

**Elsewhere**

- `canopy-website`, the /websites page: "You never have to remember a password", Michael's copy (section 7).
