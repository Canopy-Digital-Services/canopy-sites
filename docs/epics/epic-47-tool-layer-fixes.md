# Epic 47: Tool layer fixes

**Status:** In progress (2026-11-24). Drafted from the ROADMAP brief when Michael moved on to it as the MVP's next item, and built in the same session.
**Phase:** 8, Launch readiness (`docs/canopy-sites/ROADMAP.md`, E47)
**Successor:** E48 (deploys and checks), next in the MVP

> **Before starting, read `CLAUDE.md` and any referenced docs relevant to the work**, plus `docs/canopy-sites/PRD.md` (D8, D9, D38, D40, D50), `apps/portal/src/lib/site-tools/index.ts`, its tests in `site-tools.db.test.ts`, and `packages/site-contract/src/guide.ts`.

---

## 1. Goal

Nothing about a site's past stops an owner's edit, a builder restart never leaves a draft stuck, and nothing reaches the live site that the site's rules refuse today.

## 2. Scope

### In

- **4.1** The guide checks only what an edit changes, and the operator sees where published content and the guide disagree.
- **4.2** A build the builder lost in a restart starts again.
- **4.3** Publish runs the guardrails again.

### Out

| Not here | Why / where |
|---|---|
| The builder keeping its records and queue on disk | The builder is a single process with an in-memory queue by design until E36; the portal recovering is enough here |
| Tests for the builder's queue, publish, and nightly rebuild | ROADMAP, "Not scheduled" |
| Contract changes | Everything here uses what the contract already exports (`limitIssues`, `countIssues`, `refusalIssues`), so no site upgrades |

## 3. Requirements

Each fix lands with a database test that fails without it. The tests for 4.2 and 4.3 started as `docs/canopy-sites/e47-repro.db.test.ts.txt`, written to pass while the defect was there; they move into `site-tools.db.test.ts` turned around, and the file goes.

### 4.1 The guide checks what the edit changed

`check` (`apps/portal/src/lib/site-tools/index.ts`) ran the guide's limits, counts, and refused phrases over the whole site. Once published content broke one (a Canopy push, or a guide tightened after the copy was written), every owner edit was refused naming a field the owner didn't touch, and a refused phrase became a request to Michael about text the owner never wrote.

1. The contract's own rules (shapes, formats, references) still run over the whole draft: content that breaks them can't build.
2. A guide limit or refused phrase is reported only on a field whose value the edit changed or added. A count is reported only on a list the edit made longer. That is the rule `avoidWarnings` already follows.
3. Fields and lists are compared by address, so reordering a list or editing a neighbour never reports a field that kept its value.
4. The same check runs on a rebase (`syncDraft`), so a Canopy push that leaves copy past a limit doesn't fail the owner's draft for it.
5. **The operator's site page shows where published content breaks the guide**: a Site guide card, streamed in like Stats, listing each field or list by address with what it breaks, or saying it all fits. A site with no repo, or a builder that can't be reached, says so in the card.

### 4.2 A build the builder lost starts again

The builder keeps its records and queue in memory (`apps/builder/src/sites.ts`) and answers 404 for a build it was running when it restarted. `refreshChange` treated any builder error as no news, so the `Build` stayed `QUEUED` or `RUNNING` and the draft never became previewable until another edit.

1. `BuilderError` carries the HTTP status the builder answered with.
2. A 404 for the draft's latest build, of its current version, marks that build `FAILED` with the reason and starts a new build of the same version on the same base commit. The draft stays `DRAFT` and the next refresh follows the new build.
3. Two refreshes at once start one new build, not two.
4. A version whose build was already lost once isn't started a third time: its new build is marked `FAILED`, and the draft gets the plain line a failed build gets (`BUILDER_FAILED.build`), so a builder that keeps losing builds can't make the portal start one per poll.
5. Any other builder error is still no news: the next refresh asks again.

### 4.3 Publish runs the guardrails again

A lock, a fixed list, or a guide rule added after a draft was saved didn't apply to that draft, because `publishChange` sent it to the builder unchecked.

1. `publishChange` reads the site and runs `check` on the draft before asking the builder to publish, when the branch is still at the draft's base commit. When it has moved, the builder refuses as before ("changed since").
2. A draft that no longer passes is marked `FAILED` with the reason (as a rebase that no longer fits is), and the refusal reaches the owner as the `ToolError`, `outOfLane` when it is Canopy's call.
3. A read that fails is the plain try-again `readSite` already gives, and the draft stays ready to publish.

## 4. Acceptance

- [ ] A guide limit, count, or refused phrase that published content already breaks no longer refuses an edit elsewhere; editing that field, growing that list, or writing that phrase is still refused (database tests).
- [ ] The operator's site page lists where published content breaks the guide, and says when it all fits.
- [ ] A build the builder lost starts again on the next refresh, once, and the draft becomes previewable when it succeeds (database test, from the repro file).
- [ ] A lock added after a draft was saved refuses that draft's publish, and the draft is marked failed with the reason (database test, from the repro file).
- [ ] `e47-repro.db.test.ts.txt` is gone; build, lint, and the suite pass.

## 5. Decisions

### Agent calls inside scope

- **A lost build starts again rather than failing.** The brief allowed either. Failing would leave the owner a line telling them to edit again for something that wasn't theirs; starting again heals without them. The one-retry cap keeps it from looping.
- **Publish checks only when the branch hasn't moved.** When it has, the builder already refuses, and checking against moved content could fail a change another tab just published.
- **A draft that fails the publish check is marked FAILED**, as `syncDraft` does for a rebase that no longer fits and `publishChange` already does for the builder's "changed since". Its edits can't pass while the rule stands, and a failed draft frees the site for a fresh one.
- **The operator card names fields by address**, the form the operator writes locks, fixed lists, and the guide's limits in.

## 6. Open

None.

## 7. Completion report

## 8. Progress log

- 2026-11-24: Drafted from the ROADMAP brief and a read of the tool layer, the builder client, and the builder's build route.

## 9. Docs this makes stale

- `.claude/rules/site-tools.md`: the guide checks only what an edit changed; publish runs the guardrails again; a lost build starts again.
- `docs/canopy-sites/ROADMAP.md`: E47's brief shrinks to a pointer here.
