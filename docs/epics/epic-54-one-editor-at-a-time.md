# Epic 54: One editor at a time

**Status:** Approved (Michael, 2026-11-14). In progress: 4.1 to 4.4 built, unreleased. 4.3 passed Michael's checks on 2026-11-15; 4.4 waits on his. Left after that: a help page for owners and the Onboarding Runbook at release (4.5, section 6).
**Phase:** 8, Launch readiness (`docs/canopy-sites/ROADMAP.md`)
**Predecessor:** Epic 53 (people on an account)
**Successor:** the Client 3 site's claim links (ROADMAP "The MVP")

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/canopy-sites/PRD.md` (D9, D38, D47, D49, D64), `docs/canopy-sites/REVIEW_FINDINGS.md` (F2, F4), and `docs/UX_PATTERNS.md` section 1 before any of 4.3.

---

## 1. Goal

Two people on one account never edit the site at once. The site becomes a person's when they start an edit, and stays theirs while they are active on Quick Edit, the Editor, or the preview page. Being on a page holds nothing. Anyone else sees who is making edits, can still look at the preview, and can edit once the first person publishes, discards, leaves, or goes quiet. Nobody asks for control through the portal: they message each other.

## 2. Why the site, and not a field

A lock on each field was considered and rejected (PRD D64). The draft is the site's, and Publish sends all of it, so two people in different fields would still publish each other's unfinished changes. A Quick Edit message can change any number of fields, and which ones isn't known until the reply. Adding, removing, or reordering entries spans fields.

## 3. Scope

### In

- **Two writers on one draft (4.1)**: REVIEW_FINDINGS F2 and F4.
- **The hold (4.2)**: its row, and the tool layer's check.
- **The pages (4.3)**: following the hold, who is making edits, opening up.
- **The handoff (4.4)**: what a page does when the hold changes hands.
- **Docs (4.5)**.

### Out

| Not here | Why / where |
|---|---|
| Asking the person editing for control, or taking it from them | After v1 (PRD D64). The hold frees itself within ten minutes of its holder going quiet |
| Showing where on the site the other person is | Needs every page to follow the draft as it changes; the hold's keep-alive is what it would build on |
| A draft per person | One draft per site stands (PRD D38) |
| Two people editing one form | Forms has no draft; the last save wins. Not in play for the Client 3 site, whose form goes to an outside CRM |
| F1, F3, F5 | The rest of ROADMAP E47 |

## 4. Requirements

### 4.1 Two writers on one draft

One person in two tabs can still write twice at once, and so can a hold changing hands, so these land first.

- **F4.** A partial unique index holds `change_sets` to one row per site in `DRAFT` or `PREVIEWED`. Its migration first discards all but the newest pending change of any site that has two. A first write that loses the race runs again on top of the winner.
- **F2.** `publishChange` records its outcome against the row as it is then, not as it was read. A second Publish of a change that went live returns the first one's commit and leaves the row `PUBLISHED`. An edit saved while a publish was in flight stays a draft: the change is recorded as published with the ops that were sent, and what arrived after becomes the site's new draft, on the published commit, with its own build.
- Each lands with its test from `docs/canopy-sites/review-findings-repro.db.test.ts.txt`, turned around.

### 4.2 The hold

- `SiteHold`: one row per site (`siteId` unique), `userId`, `takenAt`, `expiresAt`. Deleting the user or the site deletes it. `src/lib/site-tools/hold.ts` is the only code that reads or writes it.
- **Taking.** A hold starts with an edit, never with a page being open (Michael, 2026-11-15: a person watching the welcome video in front of Quick Edit had locked the other out). A person takes a site's hold when it has none, when the one it has expired, or when it is already theirs; each take or keep moves `expiresAt` to `HOLD_TTL_MS` from now (90 seconds). One conditional write decides it, so two people asking at once get one hold.
- **Keeping.** `extendHold` keeps a hold its person already has and never takes one: it is all an open page may do.
- **By person.** The holder is a user, whatever browser or tab asks. An operator acting as a client holds as themselves.
- **Every write checks it**: `saveDraft`, `proposeChange`, `publishChange`, `discardChange`, and Quick Edit before it spends a model call. The check takes or keeps the hold for the caller, so a person whose page isn't keeping it (an older page, a client with scripts blocked) still edits safely. A refusal is a `ToolError` with `heldBy`, reading "<name> is currently making edits."
- **Reads are open** to everyone on the account: the canvas, the draft view, the preview page.
- **Release**: a publish or a discard that leaves the site without a draft gives the hold up at once (`doneEditing`), since the person is done; with a draft still pending (an edit saved during the publish) they keep it. Sign-out releases the user's holds. Otherwise a hold ends by expiring.
- A database test for each: a second person's save, proposal, publish, and discard are refused and change nothing; the same person from a second context is not refused; an expired hold passes to the next writer; removing a person frees their hold; sign-out releases.

### 4.3 The pages

Built a section at a time, each proposed to Michael and checked by him on `localhost:3006` before the next (`sites.localhost:3006`, two browsers, two people).

- **Following the hold.** Quick Edit, the Editor, and the preview page ask who has the site when they open and about every 25 seconds, which keeps the hold of a person who has one (a tab the browser has throttled to one timer a minute still keeps it) and takes none. A page stops asking after ten minutes without a key or a pointer on it, and asks again at the next one.
- **Where an edit starts.** Sending a Quick Edit message, saving, publishing, and discarding are writes, and the tool layer takes the hold for them. The Editor also takes it when a field is opened, before anything is typed, so two people never type into the canvas at once.
- **Someone else is making edits.** One wording everywhere: "Jane Doe is currently making edits". Quick Edit shows it in place of the chat, which stays mounted underneath so a conversation is still there afterwards. The Editor shows it over the site, which stays on the canvas behind frosted glass and out of reach. Both open up by themselves once the hold is free. The preview page still shows the draft, with the same line where Publish would be. The Sites chrome keeps Preview and holds back Discard.
- Copy says who is making edits and stops (`docs/UX_PATTERNS.md`, copy rules).

### 4.4 The handoff

- **A page never edits on top of what it hasn't seen.** Every answer about the hold carries a marker of where the draft and the published list stand. When it has moved without the page's own doing, the editing surface mounts again: the Editor and Quick Edit hear of changes only from the same browser.
- **A field left open** when the site passes to someone else stays open behind the glass. If they change nothing, it is still open with its text when the glass lifts. If they change something, the canvas loads again and a message hands the text back: the field's name, what it held, and Copy.
- **Edits a save couldn't send** (`src/lib/unsaved-edits.ts`) are kept with the marker they were typed at and sent after a reload only while the site still stands there; otherwise they are dropped and the person is told how many.
- **Whose changes.** A change records who last edited it (`updatedByUserId`) and who published it (`publishedByUserId`). To anyone but its last editor, the draft reads "Jane Doe's unpublished changes" in the Sites chrome and on Quick Edit's card, and the published list names who published.

### 4.5 Docs

- `docs/AGENT_CONTEXT.md`: the hold among the tool layer's guards, `SiteHold` in the appendix.
- `docs/canopy-sites/REVIEW_FINDINGS.md`: F2 and F4 deleted by the commits that fix them, with their tests in the `.txt` beside it.
- The Sites Onboarding Runbook, section 5: acceptance with a second person.
- A help page for owners once 4.3 is settled.

## 5. Acceptance

- [ ] Two first saves at once leave one draft holding both edits; two Publish requests leave the change published once and recorded as published.
- [ ] With two people signed in to one account and both only looking, neither is held back, on Quick Edit or the Editor.
- [ ] Once the first opens a field or sends a Quick Edit message, the second can't save, send a Quick Edit message, publish, or discard, and is told who is making edits.
- [ ] The second can open the preview page and see the draft.
- [ ] When the first publishes or discards, a minute and a half after they leave the editing pages, or ten minutes after they go quiet, the second's page opens up and they can edit.
- [ ] One person's laptop and phone never refuse each other.
- [ ] The second person finds the first's unpublished changes marked as theirs, and a publish names who published.
- [ ] `npm run build`, `npm run lint`, and `npm test` pass.

## 6. Progress

- 2026-11-14: 4.1 built. The partial index is migration `one_pending_change_per_site`; `recordPublish` in `src/lib/site-tools/index.ts` is the publish's record. Tests in `site-tools.db.test.ts`: two first writes at once, Publish pressed twice, a refusal that arrives after an edit, and an edit saved during a publish.
- 2026-11-14: 4.2 built. `SiteHold` is migration `site_holds`; `src/lib/site-tools/hold.ts` holds the rules, and `requireHold` in `index.ts` is the check each write starts with. `sendQuickEdit` and the other Editor actions answer a refusal with `heldBy`, which 4.3's pages read. Until 4.3, nothing keeps a hold between writes, so it lasts 90 seconds past a person's last save, message, publish, or discard: a second person's write inside that window is refused, and shows as the error each surface already shows. Tests: "one person edits at a time" in `site-tools.db.test.ts`, and sign-out in `auth.db.test.ts`.
- 2026-11-14: 4.3, first section, built after Michael's yes to the sketch: keeping the hold, and who is editing on Quick Edit and the Editor. `SiteHoldProvider` and `WhileHolding` are in `src/components/sites/site-hold.tsx`; when a page asks is `src/lib/site-hold-policy.ts` (unit tested); the pages render from `getSiteEditing` and ask through the `keepHold` action over `keepSiteHold` (both in the tool layer, database tested). Quick Edit shows who is editing where the chat is, with Preview when there is a draft, and leaves out the "Change waiting for you" card, which is the editor's to preview and discard. The Editor shows the same in place of the canvas. Checked with two people in headless Chromium on `sites.localhost:3006`: the second saw who was editing on both pages, and their Editor opened 20 seconds after the first signed out. Two things from 4.4 came with it, because the page is unsafe without them: a page that takes the hold after the site moved mounts its editing surface again (the marker), and a refused write shows who is editing at once. Still 4.4's: a field left open keeps its text, unsent edits, and whose changes a draft holds. Not built yet: the preview page still offers Publish, and the Sites chrome Discard, to someone waiting; the tool layer refuses both.
- 2026-11-15: Michael's check of the first section, and the rework. His findings: the Editor's notice was too bare (he wanted the site in the background behind frosted glass, with the message); the wording should be "is currently making edits"; and Quick Edit had been blocked for one person while the other only watched the welcome video in front of it, so being on a page must not hold the site. Reworked: a hold starts with an edit (`extendHold` for an open page, `keepSiteHold(ctx, take)` and the hook's `begin()` for a field opened on the canvas), a publish or discard that leaves no draft gives it up (`doneEditing`), the Editor's canvas stays mounted behind `BehindGlass`, Quick Edit's chat stays mounted under its notice, and `editingNotice` is the one wording. Opening a field as the start of an edit, and giving the hold up on publish and discard, are Claude's calls inside that finding, flagged to Michael. Checked with two people in headless Chromium on the local demo site: neither was held back on Quick Edit or the Editor while both only looked; 17 seconds after one opened a field the other's Editor was behind glass and out of reach, and their Quick Edit showed the notice.
- 2026-11-15: the first section passed Michael's second check ("Passes, go on"). 4.3's second section built: the preview page follows the hold (`SiteHoldProvider` with `reload={false}`, since the page tracks the draft itself and a router refresh would remount it), and its bar says who is making edits where Publish would be; the Sites chrome's `DraftStatus` leaves out Discard while `getDraftState` reports `heldBy`, looking again when an editing page's provider fires `HOLD_CHANGED` and when a page without one (Forms, Stats) comes back into view. Checked with two people on the local demo site: with nobody editing, both had Discard and Publish; 13 seconds after one opened a field the other's top bar had lost Discard (Preview stayed), their open preview tab said who in place of Publish, and their Stats page loaded without Discard; the editor's own preview kept Publish; 17 seconds after the editor signed out, Publish was back on the other's preview.
- 2026-11-15: 4.3's second section passed Michael's check ("Passes, go on"). 4.4 built. Schema: `ChangeSet.updatedByUserId` and `publishedByUserId` (migration `change_set_editor_and_publisher`, hand-written to carry who started each existing change into both). The provider's rule is now one line: the editing surface mounts again when the marker moved and this page didn't move it, so a person who took the site and changed nothing leaves an open field as it was. `SITE_MOVED` lets the Editor hand back an open field's text in a toast before it mounts again. `saveCanvasEdits` answers with the marker after the save, which the page adopts (`wrote`) and stamps on any edits it has to keep in the browser. Checked with two people on the local demo site: a field left open with typed text went behind glass when the other opened a field, and was still open with its text when they left without changing anything; when they saved a change instead, the canvas loaded again with it, the toast read "Subheadline wasn't saved" with the text and Copy, and the top bar and Quick Edit's card read "Bob Roe's unpublished changes". The demo's draft was put back to its two changes afterwards (its version moved from 2 to 6).
