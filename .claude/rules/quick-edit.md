---
paths:
  - "apps/portal/src/lib/quick-edit/**"
  - "apps/portal/src/lib/site-tools/**"
  - "packages/site-contract/src/**"
---

# Quick Edit Guidance

Where a rule for Quick Edit (and later MCP clients) belongs, and the numbers planned for what isn't built yet. The wording the model runs on is `BASE_RUNBOOK` in `apps/portal/src/lib/quick-edit/runbook.ts`; change it there, then run the Quick Edit Eval Runbook (Nextcloud, Canopy Sites). A field's description, label, and kind are its `.meta()` in `packages/site-contract/src/schemas.ts`. The site guide's front matter syntax is in `packages/site-contract/README.md`; what every guide must cover is the Site Build Checklist (Nextcloud).

## Where a rule lives

Pick the first home that can carry it:

1. **Code.** Anything deterministic: validation, formats, image preflight, locks, publish gating. The model sees the result, never the rule. A site's limits and display formats are code too, with their values in its guide's front matter (PRD D40).
2. **Contract field metadata** (PRD D36): what a field means, what it's called, and what it holds. It reaches every client through the JSON Schema and gives the canvas its labels, and it versions with the contract.
3. **Tool descriptions and tool results.** Every MCP client shows these to its model, so a rule here works for a client's own assistant too. A result says what to tell the owner and what to do next; a warning is data (the field's address and a message), so the canvas shows it as well.
4. **Core guidance** (`BASE_RUNBOOK`): judgment calls. A client may drop server instructions, so nothing a guardrail depends on lives only here.
5. **Quick Edit persona**: the "Replying to the owner" part of `BASE_RUNBOOK`. Portal chat only.
6. **Site guide** (`SITE_GUIDE.md` in the site's repo, PRD D31): what is true of one business. Canopy writes it; the model reads it from the published commit. A client's own assistant can read it, so it holds nothing the client shouldn't see.

Across all six: **content only** (PRD D29). No rule lets an edit reach design, layout, or components. The canvas's own editors run on homes 1 and 2, and every source writes the same draft through the same tool layer (PRD D38), so a rule in code holds everywhere.

Canopy's own copy mechanics (no em dashes, sentence case) are not checks: they govern copy Canopy writes, and owner text is verbatim (PRD D32).

## Planned, not built

**Warnings in the tool result.** Only "what the copy avoids" (the guide's `avoid`) is built. Planned:

- **Stale mentions**: when a value is replaced, every other place the old value still appears ("$85 also appears in a section on the home page").
- **Dates**: an `endsOn` in the past; a weekday that doesn't match its date ("Monday the 20th" when the 20th is a Tuesday).
- **Duplicates**: a service name that already exists; an announcement already covering that date.
- **Links**: an external link that doesn't answer with a success or a redirect.
- **Housekeeping**: adding an announcement removes expired ones in the same change, before the cap of 5 applies.

**Image preflight** (ROADMAP E50):

- Accepted: JPEG, PNG, WebP, AVIF, HEIC/HEIF, up to 25 MB. Rejected with a reason: GIF, SVG, PDF, anything that won't decode.
- Every upload: EXIF orientation applied, then EXIF stripped (phone photos carry GPS); long edge at most 2400 px; re-encoded to 1 MB or less, JPEG, or WebP when the image has transparency. Astro builds the responsive sizes; the repo keeps one master.
- Size per slot, on the long edge: refused under the floor, accepted with a warning under the recommended size. Hero 1200 / 1800 px, gallery 800 / 1200 px, headshot 400 px.
- The low-resolution warning the model relays: *"This picture is low resolution and will look blurry on the page. Do you have a better version, or do you want to see what it looks like on the preview anyway?"* It uses the photo only if the owner says to.
- The model gets a downscaled copy for alt text, placement, and moderation (PRD D33). It suggests alt text of 125 characters or fewer (the contract caps it at 200), which the owner accepts or edits; it is the one thing the model writes. A photo that fails moderation isn't used, the reply says it can't go on the site, and the operator is notified.
