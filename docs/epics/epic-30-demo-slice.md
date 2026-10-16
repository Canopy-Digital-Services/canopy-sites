# Epic 30: Builder, Preview, and the Demo Slice

**Status:** 🚧 In progress
**Started:** 2026-10-16
**Phase:** 2, Builder and preview (`docs/canopy-sites/ROADMAP.md`), built first as the demo slice
**Predecessor:** Epic 29 (Plan extension, Site model, operator Sites)
**Successor:** what remains of E31 to E35 (section 8)

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/canopy-sites/PRD.md` (D1, D3, D5, D6, D9, D19, D21, D23 to D27, sections 4.4 and 4.5), `docs/canopy-sites/ROADMAP.md` (C1, E30 to E35), `docs/epics/epic-29-plan-site-model-operator-sites.md`, and the `docs/tools/*.md` for whatever you touch.

---

## 1. Goal

A sales demo of Canopy Sites that works end to end through the real pipeline, for a call on the morning of 2026-10-17: sign in at `sites.canopyds.com`, see the demo site in the Editor, ask quick edit for a change, open the preview, publish, see it live at `sites.canopyds.com/demo`, and look at Stats. A partner gets their own login to the same demo account.

Everything on screen goes through the pipeline it will use for clients. What is not built yet is not on screen. The one stand-in is Stats, which shows labeled sample data for the demo site (Michael's decision, section 6).

## 2. Scope

### In

- **C1, narrowed.** `@canopy/site-contract` v0.1: Zod schemas for `site`, `pages`, `services`, `reviews`, `gallery`, `announcements`; content validation for the portal; `validateSite(dir)` for the builder; JSON Schema for the model; released as a tarball (PRD D26).
- **The demo site.** A new private repo, `Canopy-Digital-Services/canopy-demo-site`, seeded from Client 2's code and content, on Astro 7, built with base `/demo`, every fact in `src/content/*.json`, plus an announcements banner and structured hours. No analytics, `noindex`.
- **E30, narrowed.** `Build` and `ChangeSet`; `apps/builder`, an internal HTTP service that reads content, builds previews, and publishes (commit, push, point `current` at the previewed build); the portal serving `/demo` from the builder's output, with preview for signed-in members of the owning account.
- **E31, narrowed.** The ChangeSet lifecycle and the tool layer for content: read, propose, preview, publish, discard, each enforcing ownership, locked fields, contract validation, and a rate limit, with database tests.
- **E32, narrowed.** Quick edit: one chat on the Editor home, Claude API with the tool layer in-process, each conversation recording tokens and estimated cost.
- **Editor home.** Pages list, quick edit, the pending change with Preview, Publish, Discard, and recent changes.
- **E35, narrowed.** The Stats page (visitors, pageviews, top pages, referrers, date range), fed by a sample source for demo sites and labeled as sample data.
- **Partner access.** An operator action that adds a new user to an account as a `MEMBER`; they set a password through "Forgot password".
- **Demo setup on production.** Demo account, demo site, partner member.

### Out

| Not here | Why / where |
|---|---|
| Caddy, client production hostnames, preview hostnames | The demo is served by the portal (D2); E36 brings Caddy for client domains |
| Any change to `client2` or Client 2's live site | D1; H1 to H3 are Client 2's own migration |
| Media upload, HEIC, moderation, tokens panel, page thumbnails, page-scoped chat | E32 and E33 remainders |
| Rollback UI, build retention | E31 and E30 remainders |
| MCP endpoint | E34 |
| Umami as the Stats source | E35 remainder |
| `monthlyAiBudgetCents` enforcement | E32 remainder; cost is recorded from the first conversation |
| A builder on the dev environment | Follow-up; dev gets the portal changes, verification runs locally and on production |

## 3. Gating decisions

Recommended 2026-10-16 before any code. Michael's answers are section 6's D1 to D6.

- **The demo is not Client 2's live site.** Publishing on a call would change a real business's site, and Stats would show its traffic. The demo gets its own account and site (PRD D23).
- **Preview hostnames under `*.sites.canopyds.com` get no certificate** on Universal SSL; client previews move one level up (PRD D25). The demo previews at its own URL.
- **`canopy.json` has nothing left to hold** (PRD D24).
- **Client 2 states facts more than once** (featured prices beside the menu, hours in two places, a hardcoded analytics ID), so one edit would update one place and not the other. The demo site gives every fact one source.
- **PRD Q1** answered as D26, **Q9** as D27; Q2's default stands for client hostnames; Q3 to Q6 are outside the slice.

## 4. Requirements

Filled in as each part lands (section 9 has the commits).

## 5. Acceptance

- [ ] Signed in as the demo account on production, the Editor shows the demo site's pages
- [ ] A quick edit request produces a ChangeSet, a preview build, and a preview at `sites.canopyds.com/demo` that only signed-in members of the account see
- [ ] Publish commits and pushes to the demo repo and serves the previewed build at `/demo` without a rebuild
- [ ] A ChangeSet that breaks the contract or touches a locked field is refused with a readable reason, and the live site is unchanged
- [ ] One account can never read or change another account's site, ChangeSets, or conversations
- [ ] Stats shows sample data, labeled, for the demo site only
- [ ] The partner signs in with their own password as a member of the demo account
- [ ] Every migration read and verified; `npm run build`, `lint`, `test` pass; every guard's test fails with the guard removed

## 6. Decisions

### Michael (2026-10-16)

- **D1. The demo is a future demo capability, with Client 2 as content only.** "We'll eventually be building a dedicated demo ... we're using Client 2 for now as pure content. It shouldn't actually intermingle with her stuff." Its own private repo, account, and site; nothing touches Client 2's repo, analytics, or search presence. "We can even add a couple elements to make the demo show more of the control features." the owner agreed to Client 2's content being used as part of her free site.
- **D2. Served at `sites.canopyds.com/demo`**, a stopgap until the dedicated demo site has a home.
- **D3. Audience: prospects on a sales call with Michael driving; a partner needs their own access on 2026-10-17**, as a member of the demo account.
- **D4. Stats shows made-up data for now**, with a small "Sample data" label.
- **D5. The PRD and ROADMAP take the planning fixes first** (D23 to D27).
- **D6. Approved for tonight without asking again:** GitHub (the demo repo, its deploy key, the contract release), Coolify (the builder app, portal env vars, deploys by API), and the production release with the demo setup.

### Agent calls inside scope

- **C1. Client 2's live site and repo are untouched**, and its Astro 7 and Dockerfile move stays H1, after the call.
- **C2. The dev environment gets no builder tonight.** The portal changes deploy to forms-dev as usual; builder verification runs locally and on production.

## 7. Completion report

## 8. Follow-ups (recorded, not built)

## 9. Progress log

- 2026-10-16: Planning recommendation written and decided (sections 3 and 6). PRD D23 to D27 and the ROADMAP updated.
