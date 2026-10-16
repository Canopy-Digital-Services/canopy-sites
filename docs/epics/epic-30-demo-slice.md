# Epic 30: Builder, Preview, and the Demo Slice

**Status:** ✅ Complete
**Version:** v5.3.0, v5.3.1 (released 2026-10-16)
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

### Schema (two migrations, both additive, SQL read before commit)

1. `add_site_is_demo`: `sites."isDemo" BOOLEAN NOT NULL DEFAULT false`.
2. `add_change_sets_builds_conversations`: `change_sets`, `builds`, `conversations`, and the enums `ChangeSetSource`, `ChangeSetStatus`, `BuildStatus`. `Build.changeSetId` is the one FK direction between builds and change sets (E29's open point). Builds, change sets, and conversations cascade with their site; their user links set null.

### Contract (`packages/site-contract`, v0.1.0, released as `site-contract-v0.1.0`)

Six collections, one JSON document each at `src/content/<collection>.json`; plain text only (markup rejected); `validateContent` (schemas, then references such as featured `serviceIds`), `validateSite(dir)` (plus image files), `applyChanges` (the ChangeSet op: JSON Patch per collection, shared by portal and builder), `lockedFieldViolations`, `jsonSchemaFor`. 12 tests.

### Builder (`apps/builder`)

Internal HTTP service on Node 24 (type stripping, no build step): content read, preview build (HEAD plus ops, validated, `astro build`, `preview` flips only on success), publish (re-apply the same ops to the same base commit, commit, push, point `current` at the previewed build), reset to the `demo-baseline` tag, file serving. One job per site, two sites at once, argument arrays only, no builder secrets in site builds, repo access by a repo-scoped token in git's environment config.

### Portal

- `src/lib/site-tools`: `getContentView`, `proposeChange`, `refreshChange`, `publishChange`, `discardChange`, `getEditorChanges`, `canPreviewSite`.
- `src/lib/quick-edit`: the Claude loop with `get_content` and `propose_change`; base runbook in `runbook.ts`.
- `/editor` (quick edit, pending change, pages, recently published), `/stats` (sample source for demo sites), `/demo` (served from the builder, sandboxed, member preview).
- Operator: Add member (accounts), Build and publish, Reset demo, Mark as demo site (site detail).

### Tests

Tool layer 14, members 5, operator site builds 3, stats 20, contract 12; every ownership, membership, and guardrail guard checked to fail with the guard removed (section 9).

## 5. Acceptance

- [x] Signed in as the demo account on production, the Editor shows the demo site's pages
- [x] A quick edit request produces a ChangeSet, a preview build, and a preview at `sites.canopyds.com/demo` that only signed-in members of the account see
- [x] Publish commits and pushes to the demo repo and serves the previewed build at `/demo` without a rebuild
- [x] A ChangeSet that breaks the contract or touches a locked field is refused with a readable reason, and the live site is unchanged (database tests; locally)
- [x] One account can never read or change another account's site, ChangeSets, or conversations (database tests)
- [x] Stats shows sample data, labeled, for the demo site only (rendered locally; Michael's visual check)
- [ ] The partner signs in with their own password as a member of the demo account: Michael adds the partner on 2026-10-17 (D8)
- [x] Every migration read and verified; `npm run build`, `lint`, `test` pass; every guard's test fails with the guard removed

## 6. Decisions

### Michael (2026-10-16)

- **D1. The demo is a future demo capability, with Client 2 as content only.** "We'll eventually be building a dedicated demo ... we're using Client 2 for now as pure content. It shouldn't actually intermingle with her stuff." Its own private repo, account, and site; nothing touches Client 2's repo, analytics, or search presence. "We can even add a couple elements to make the demo show more of the control features." the owner agreed to Client 2's content being used as part of her free site.
- **D2. Served at `sites.canopyds.com/demo`**, a stopgap until the dedicated demo site has a home.
- **D3. Audience: prospects on a sales call with Michael driving; a partner needs their own access on 2026-10-17**, as a member of the demo account.
- **D4. Stats shows made-up data for now**, with a small "Sample data" label.
- **D5. The PRD and ROADMAP take the planning fixes first** (D23 to D27).
- **D6. Approved for tonight without asking again:** GitHub (the demo repo, its deploy key, the contract release), Coolify (the builder app, portal env vars, deploys by API), and the production release with the demo setup.
- **D7. The builder reaches the demo repo with a fine-grained token** limited to that repo (Contents read and write), since the org disables deploy keys.
- **D8. The demo login is `demo@canopyds.com`; Michael adds the partner himself** with the operator's Add member.

### Agent calls inside scope

- **C1. Client 2's live site and repo are untouched**, and its Astro 7 and Dockerfile move stays H1, after the call.
- **C2. The dev environment gets no builder tonight.** The portal changes deploy to forms-dev as usual; builder verification runs locally and on production.
- **C3. Site content is plain JSON parsed with the contract at build time**, not Astro content collections (PRD 4.4 revised): it fails the build the same way and avoids tying the contract's Zod to Astro's.
- **C4. One pending change per site; proposals stack.** A new proposal is the pending change's ops plus the new ones, checked from the published content, and supersedes it, so "also change X" keeps building on one preview. A pending change whose base commit moved is failed, not rebased.
- **C5. Publish is the E36 mechanism, pulled forward for the demo**: the same ops on the same base commit, pushed, then `current` points at the previewed build. No rebuild, so what was approved is what goes live.
- **C6. The demo is served by the portal, not Caddy**, with member preview at the same URL (no preview hostname, no DNS), sandboxed by CSP because it is editable content on the portal's origin.
- **C7. Quick edit runs `claude-opus-5-5` at medium effort** (`QUICK_EDIT_MODEL` overrides), records tokens and estimated cost per conversation, and can't publish. Measured locally: about $0.007 to $0.035 per turn.
- **C8. Operator Build and publish, Reset demo, and Mark as demo** were needed for the site's first build and between calls; Global Admin only, tested.
- **C9. `Build` has no `kind` column**: every build is a preview, and publishing points `current` at one (D21's rule).

## 7. Completion report

Shipped in v5.3.0 and v5.3.1. The sales demo works end to end on production through the real pipeline: sign in at sites.canopyds.com, ask quick edit for a change, preview it at `/demo` (members only), publish it (a commit on `canopy-demo-site` and the previewed build served without a rebuild), and see labeled sample Stats. Behind it: the content contract v0.1.0, the builder service, the site tool layer with every guardrail tested, quick edit on the Claude API with per-conversation cost, and operator controls for first publish, demo reset, and partner members.

Michael's decisions reshaped the brief before any code (section 6): the demo is its own capability with Client 2 as content only, served at `/demo`, with sample Stats and a partner login. Planning corrected the PRD (D23 to D27). Found on the way: the org disables deploy keys (D7); `next.config`'s CSP replaced `/demo`'s sandbox; the preview redirect used the container's address; a demo reset left removed changes listed.

Two migrations, both additive. 188 portal tests and 12 contract tests.

## 8. Follow-ups (recorded, not built)

- **Contract friction from the demo site** (E31/C1 v0.2): a booking CTA kind so the booking URL isn't repeated; more than one hero CTA; business type and staff for JSON-LD; alt text for template photos; section nav labels; inline links in copy; one business name versus two spellings; a time zone for announcement dates, which take effect only on a rebuild; uppercase image extensions; reference checks skipped when a collection fails its schema.
- **Builder on forms-dev**, and per-environment demo branches so dev and prod never push to one branch.
- **Server-side refusal fallbacks** for quick edit (`fallbacks: "default"`), left out because they couldn't be tested before the call.
- **`monthlyAiBudgetCents`** enforcement and an operator view of quick-edit spend (cost is recorded per conversation now).
- **Help pages for Canopy Sites** (Editor, quick edit, Stats); `/docs` has no product gating yet, so a Sites page would show to Forms users.
- **Operator build log UI**; build logs are stored on `builds.log`.
- **Pin GitHub's SSH host keys** if deploy keys are ever used (the builder trusts on first use).
- **The real Client 2**: H1 to H3 and its account, unchanged by this epic.
- **`GIT_TOKEN_DEMO` expires 2027-01-14** (90-day fine-grained token). Rotate it on the builder app before then, or move to a GitHub App installation token.
- **Coolify deploys of the portal and the builder started together** can fail in Coolify's helper container (v5.3.1's builder deploy did; redeploying alone worked).

## 9. Progress log

- 2026-10-16: Planning recommendation written and decided (sections 3 and 6). PRD D23 to D27 and the ROADMAP updated.
- 2026-10-16: Built: `cc4b368` contract, `cb5f705` builder, `b92c491` migrations, `03044d7` tool layer, `f875967` /demo, `1ff66cf` quick edit, `bfe5555` Editor, `b415ea4` members, Stats (`02c1b0a`, `fa557b3`, by a subagent), `399eff1` operator builds, fixes `68eb34a`, `2b6ff6a`, `3d01e9e`, `0c099d6`. Demo site repo `canopy-demo-site` (private) seeded from Client 2 7bbc608 by a subagent: Astro 7.4, base `/demo`, content in `src/content`, announcements banner, no analytics, `noindex`; `client2` untouched. Guards checked to fail with the guard removed: locked fields, contract, ownership, publish status, publish build, rate limit, preview membership, no-op, member admin gate, one membership per user, owner-only deletion, demo-only reset.
- 2026-10-16: Verified locally end to end against a bare copy of the demo repo: first build and publish (16 s cold, about 1.5 s warm); quick edit "We're closed Saturday the 24th for a wedding" proposed an announcement, previewed in 8 s from send, published as a commit by the demo user; `/demo` showed it; a pending price change showed $90 only to a signed-in member with preview on, $85 to everyone else, and the preview cookie alone did nothing. The model asked instead of guessing on "Monday the 20th" (a Tuesday) and on a Monday closure (Client 2 is closed Mondays), so the suggested prompts were changed. Found and fixed: `/demo` was served without its sandbox CSP (`next.config` replaced it) and its preview redirect used the container's own address.
- 2026-10-16 (later): Released v5.3.0 (PR #26, merge `889a3c2`). Production: both migrations applied, `ANTHROPIC_API_KEY` and the builder variables present, the portal reaches `canopy-builder:4100`, volume mounted. Demo account `demo@canopyds.com` created through the signup action; plan `SITES`, billing reference "Sales demo account (PRD D23): no billing", and the demo site (slug `demo`, `isDemo`, locked contact fields, a voice overlay) set in the production database through the portal container. After Michael added `GIT_TOKEN_DEMO`: builder redeployed, first build and publish (11 s), `/demo` 200 with the sandbox CSP, `noindex`, and fonts served with CORS. As the demo account over HTTPS: quick edit "Raise the haircut price to $90" replied in 13 s with the preview ready at 14 s; `/demo` showed $85 to everyone and $90 with the preview bar to the member; Publish pushed `bd46d77` (author `demo@canopyds.com`) and `/demo` showed $90. The reset then left the Editor listing that removed change, so v5.3.1 (PR #27, merge `52b4a9f`) makes reset clear the demo's history. Builder deploy of `52b4a9f` failed in Coolify's helper container and succeeded on a lone redeploy; `/demo` kept serving across it (the volume persists). Demo reset on production: branch back at `d839f3a`, rebuilt and published (7 s), history cleared, test sessions removed.
- 2026-10-16: Contract released (`site-contract-v0.1.0`); `canopy-demo-site` pushed with tag `demo-baseline`. The org disables deploy keys, so the builder takes a repo-scoped token (D7). Coolify: builder app `p7tvlgubddrucz9mnppbhabt` (prod, alias `canopy-builder`, volume `/srv/sites`), `BUILDER_URL`/`BUILDER_TOKEN` on the prod portal, contract added to both portal apps' watch paths. forms-dev deployed `0c099d6` with both migrations.
