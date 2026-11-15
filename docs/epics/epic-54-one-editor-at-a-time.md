# Epic 54: One editor at a time

**Status:** Approved (Michael, 2026-11-14). In progress.
**Phase:** 8, Launch readiness (`docs/canopy-sites/ROADMAP.md`)
**Predecessor:** Epic 53 (people on an account)
**Successor:** the VETS site's claim links (ROADMAP "The MVP")

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/canopy-sites/PRD.md` (D9, D38, D47, D49, D64), `docs/canopy-sites/REVIEW_FINDINGS.md` (F2, F4), and `docs/UX_PATTERNS.md` section 1 before any of 4.3.

---

## 1. Goal

Two people on one account never edit the site at once. Whoever is on Quick Edit, the Editor, or the preview page holds the site. Anyone else sees who is editing, can still look at the preview, and gets the site when the first person leaves or goes quiet. Nobody asks for control through the portal: they message each other.

## 2. Why the site, and not a field

A lock on each field was considered and rejected (PRD D64). The draft is the site's, and Publish sends all of it, so two people in different fields would still publish each other's unfinished changes. A Quick Edit message can change any number of fields, and which ones isn't known until the reply. Adding, removing, or reordering entries spans fields.

## 3. Scope

### In

- **Two writers on one draft (4.1)**: REVIEW_FINDINGS F2 and F4.
- **The hold (4.2)**: its row, and the tool layer's check.
- **The pages (4.3)**: keeping the hold, who is editing, opening up.
- **The handoff (4.4)**: what a page does when the hold changes hands.
- **Docs (4.5)**.

### Out

| Not here | Why / where |
|---|---|
| Asking the person editing for control, or taking it from them | After v1 (PRD D64). The hold frees itself within ten minutes of its holder going quiet |
| Showing where on the site the other person is | Needs every page to follow the draft as it changes; the hold's keep-alive is what it would build on |
| A draft per person | One draft per site stands (PRD D38) |
| Two people editing one form | Forms has no draft; the last save wins. Not in play for the VETS site, whose form goes to Monday.com |
| F1, F3, F5 | The rest of ROADMAP E47 |

## 4. Requirements

### 4.1 Two writers on one draft

One person in two tabs can still write twice at once, and so can a hold changing hands, so these land first.

- **F4.** A partial unique index holds `change_sets` to one row per site in `DRAFT` or `PREVIEWED`. Its migration first discards all but the newest pending change of any site that has two. A first write that loses the race runs again on top of the winner.
- **F2.** `publishChange` records its outcome against the row as it is then, not as it was read. A second Publish of a change that went live returns the first one's commit and leaves the row `PUBLISHED`. An edit saved while a publish was in flight stays a draft: the change is recorded as published with the ops that were sent, and what arrived after becomes the site's new draft, on the published commit, with its own build.
- Each lands with its test from `docs/canopy-sites/review-findings-repro.db.test.ts.txt`, turned around.

### 4.2 The hold

- `SiteHold`: one row per site (`siteId` unique), `userId`, `takenAt`, `expiresAt`. Deleting the user or the site deletes it. `src/lib/site-tools/hold.ts` is the only code that reads or writes it.
- **Taking and keeping.** A person takes a site's hold when it has none, when the one it has expired, or when it is already theirs; each take or keep moves `expiresAt` to `HOLD_TTL_MS` from now (90 seconds). One conditional write decides it, so two people asking at once get one hold.
- **By person.** The holder is a user, whatever browser or tab asks. An operator acting as a client holds as themselves.
- **Every write checks it**: `saveDraft`, `proposeChange`, `publishChange`, `discardChange`, and Quick Edit before it spends a model call. The check takes or keeps the hold for the caller, so a person whose page isn't keeping it (an older page, a client with scripts blocked) still edits safely. A refusal is a `ToolError` with `heldBy`, reading "<name> is editing the site."
- **Reads are open** to everyone on the account: the canvas, the draft view, the preview page.
- **Release**: sign-out releases the user's holds. Otherwise a hold ends by expiring.
- A database test for each: a second person's save, proposal, publish, and discard are refused and change nothing; the same person from a second context is not refused; an expired hold passes to the next writer; removing a person frees their hold; sign-out releases.

### 4.3 The pages

Built a section at a time, each proposed to Michael and checked by him on `localhost:3006` before the next (`sites.localhost:3006`, two browsers, two people).

- **Keeping the hold.** Quick Edit, the Editor, and the preview page keep the hold while they are open: a call about every 25 seconds, so a tab the browser has throttled to one timer a minute still holds. A page stops keeping it after ten minutes without a key or a pointer on it, and starts again at the next one. A Quick Edit reply or a publish in flight counts as activity.
- **Someone else is editing.** Quick Edit and the Editor show who, in place of the chat and the canvas, and open up by themselves once the hold is free. The preview page still shows the draft, with who is editing where Publish would be. The Sites chrome keeps Preview and holds back Discard.
- Copy says who is editing and stops (`docs/UX_PATTERNS.md`, copy rules).

### 4.4 The handoff

- **A page that takes the hold loads the site again first** when the draft or the published site has moved since it loaded: the Editor and Quick Edit hear of changes only from the same browser.
- **A field left open** when the hold passes keeps its text on screen and says the site is being edited; nothing is dropped silently.
- **Edits a save couldn't send** (`src/lib/unsaved-edits.ts`) are sent after a reload only while the site is where it was when they were typed; otherwise they are dropped and the person is told.
- **Whose changes.** A change records who last edited it and who published it. The draft in the Sites chrome and in Quick Edit names who it is from when that isn't the person looking, and the published list names who published.

### 4.5 Docs

- `docs/AGENT_CONTEXT.md`: the hold among the tool layer's guards, `SiteHold` in the appendix.
- `docs/canopy-sites/REVIEW_FINDINGS.md`: F2 and F4 deleted by the commits that fix them, with their tests in the `.txt` beside it.
- The Sites Onboarding Runbook, section 5: acceptance with a second person.
- A help page for owners once 4.3 is settled.

## 5. Acceptance

- [ ] Two first saves at once leave one draft holding both edits; two Publish requests leave the change published once and recorded as published.
- [ ] With two people signed in to one account, the second can't save, send a Quick Edit message, publish, or discard while the first is editing, and is told who is editing.
- [ ] The second can open the preview page and see the draft.
- [ ] A minute and a half after the first leaves the editing pages, or ten minutes after they go quiet, the second's page opens up and they can edit.
- [ ] One person's laptop and phone never refuse each other.
- [ ] The second person finds the first's unpublished changes marked as theirs, and a publish names who published.
- [ ] `npm run build`, `npm run lint`, and `npm test` pass.
