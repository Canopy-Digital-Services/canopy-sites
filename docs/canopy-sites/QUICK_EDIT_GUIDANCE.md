# Quick Edit Guidance

**Status:** draft, 2026-10-17. The content of the guidance quick edit and MCP clients run on (PRD D29 to D34), sorted by where each rule lives, and how the visual editor uses the same rules (PRD D35 to D45). The live wording is still the old base runbook in `apps/portal/src/lib/quick-edit/runbook.ts`. E32 moves this doc's wording into the shared definitions module (PRD D30), after which the module is the source of the wording and this doc keeps only section 1 and the numbers code reads (section 2). E32 deletes this status note.

Companions: `PRD.md` (decisions), `ROADMAP.md` (E31 to E34), and in the Nextcloud Canopy Sites collective, **Copy Guidelines** (bucket 3 is what a site guide holds) and **Site Build Checklist** (what every site guide must cover).

---

## 1. Where a rule lives

Pick the first home that can carry it:

1. **Code.** Anything deterministic: validation, formats, image preflight, locked fields, publish gating. The model sees the result, never the rule. Per-site limits and display formats are code too, with their values in the site guide's front matter (PRD D40).
2. **Contract field metadata** (`.meta()` in `packages/site-contract`, PRD D36). What a field means (its description), what it is called (its label), and what it holds (its kind). Descriptions reach the model through the JSON Schema; labels and kinds give the canvas its field names and inputs. All of it versions with the contract.
3. **Tool descriptions and tool results.** Every MCP client shows these to its model, so a rule here works for a client's own assistant too. A tool result says what to tell the owner and what to do next.
4. **Core guidance.** Judgment calls. MCP clients get it as server instructions, quick edit as its system prompt. A client may drop server instructions, so nothing a guardrail depends on lives only here.
5. **Quick edit persona.** Portal chat only: the person on the other end is a non-technical owner.
6. **Site guide.** What is true of one business. `SITE_GUIDE.md` in the site repo, written by Canopy (PRD D31): front matter for code (home 1), prose for the model.

The boundary across all six: **content only** (PRD D29). No rule anywhere lets an edit reach design, layout, tokens, or components.

**The visual editor uses the same homes.** Its own editors on the canvas (plain text, prices, an announcement's dates) run on homes 1 and 2: the owner types the value, so the copy is verbatim by construction (PRD D32), and spelling is the browser's spellcheck. Every other marked field opens the quick edit popover, which is quick edit scoped to one field and runs on all six (PRD D37). Every source writes the same draft through the same tool layer (PRD D38), so a rule enforced in code holds on the canvas, in quick edit, and over MCP alike.

---

## 2. Checks in code

### Validation and formats

- Contract schemas: types, required fields, ids, link forms, dates, times, plain text (markup rejected).
- Length limits are what the rendered slot can hold. The contract sets absolute caps every site shares; the site guide's front matter tightens them per field address to this site's design (PRD D40), and the canvas shows them as counters. Alt text: 125 characters (screen reader announcement length).
- Facts are stored structured and formatted at render with the site guide's display formats (phone, price, time). Stored text is never re-cased: casing is CSS, and owner copy is verbatim.
- Canopy's own copy mechanics (Copy Guidelines bucket 2: no em dashes, sentence case) are **not** checks. They govern copy Canopy writes. Owner text follows the site guide (PRD D32).
- Locked fields, rate limits, and preview before publish: PRD D9.

### Checks that return warnings in the tool result

Each warning is returned as data (the field's address and a message), so the canvas shows it as well as the model.

- **Stale mentions.** When an op replaces a value, the result lists every other place in the site's content where the old value still appears ("$85 also appears in a section on the home page").
- **Dates.** An `endsOn` in the past; a weekday in the text that doesn't match its date ("Monday the 20th" when the 20th is a Tuesday).
- **Duplicates.** A service name that already exists; an announcement already covering that date.
- **Links.** An external link that doesn't answer with a success or redirect when the change is proposed.

### Housekeeping

- Adding an announcement removes expired ones in the same ChangeSet before the cap of 5 applies.

### Image preflight

- **Accepted:** JPEG, PNG, WebP, AVIF, HEIC/HEIF, up to 25 MB.
- **Normalized on every upload:** EXIF orientation applied, then EXIF stripped (phone photos carry GPS). Long edge scaled to at most 2400px. Re-encoded to land at 1 MB or less: JPEG, or WebP when the image has transparency. Astro builds the responsive sizes at build time; the repo keeps one master.
- **Rejected with a reason:** GIF, SVG, PDF, anything that won't decode.
- **Size per slot**, on the long edge. Below the floor the upload is refused; between the floor and the recommended size it is accepted with a warning.

  | Slot | Refused under | Warned under |
  |---|---|---|
  | Hero | 1200px | 1800px |
  | Gallery | 800px | 1200px |
  | Headshot | 400px | |

  Hero and headshot apply when the contract adds those image slots; v0.1 has gallery only (as of 2026-10-17).
- **Vision** (PRD D33). The model gets a downscaled copy for alt text, placement, and moderation. A moderation reject notifies the operator.

---

## 3. Contract field descriptions

Written into the schemas as each field's description, beside its kind and label (PRD D36), so they reach every client:

- `priceLabel`: display text, written the way the menu writes it ("$90", "From $150").
- `hours`: the regular week, 24-hour times. One-off closures and holiday hours are announcements.
- `announcements.message`: 160 characters or fewer. `startsOn` and `endsOn` (YYYY-MM-DD) whenever the message is about a date; the banner hides itself after `endsOn`.
- `serviceIds`: a featured service shows the menu's name and price. To change either, edit the menu.
- `gallery`: page order is list order. `alt` describes what is in the photo for someone who can't see it; it does not sell.
- `id` fields: stable once set; never renamed to match a new name.
- `reviews`: a real customer's exact words and name, as the owner gives them.

Each new collection adds its descriptions when it enters the contract.

---

## 4. Tool descriptions and results

- **Reading:** read a collection before changing it.
- **Proposing:** everything for one request goes in one proposal. The result says a preview is building and that nothing is live until the owner publishes. A proposal lands in the site's draft, which the owner may also be editing on the canvas (PRD D38); the last write to a field wins.
- **Errors** say how to fix them. A locked field returns the out-of-scope path below.
- **Preflight warnings** carry the message to relay. Low resolution: *"This picture is low resolution and will look blurry on the page. Do you have a better version, or do you want to see what it looks like on the preview anyway?"* The model waits for the answer and uses the photo only if the owner says to.
- **Alt text:** the upload result asks the model to suggest alt text from the photo; the owner accepts or edits it.
- **`request_help`** (PRD D34) files a request Canopy sees in the operator view. Reply: *"I put that request in. You can text Michael if you need it right away."*
- **`get_site_guide`** returns the site guide, for MCP clients that drop server instructions. Every other tool description points to it.
- **`publish`** (MCP only) requires a previewed ChangeSet.

---

## 5. Core guidance (both surfaces)

### Copy is the owner's, word for word (PRD D32)

- Never write copy. Headlines, descriptions, announcement messages, section text, and bios come from the owner verbatim.
- If the owner hasn't given exact text, ask for it: *"I want to make sure I'm adding exactly what you want. Can you put the updated text in quotation marks? The only thing I'll change is correcting typos."*
- **Typos:** correct them, then say so: *"I found a typo in your copy and corrected 'apointment' to 'appointment'. Let me know if that was intentional."* Names in the site guide are never typos, however they're spelled.
- **Site rules:** when the text breaks a convention in the site guide, ask before proposing: *"You used an em dash in that copy, but your site rules say to avoid them. Do you want me to use what you gave me or send me a new version?"*
- **Facts are not copy.** Prices, times, dates, and other structured values go straight into their fields from what the owner said.
- **Alt text** is the one thing the model writes: suggested on upload, used as the owner accepts or edits it.

### Judgment

- Change only what was asked.
- Never invent a fact. If one is missing, ask one short question.
- When a request could mean two things (which page, which item, a date that doesn't line up with the hours), ask instead of guessing. A closure on a day the site guide says they're always closed is probably a mistake.
- "Closed Friday" is an announcement; "closed Fridays now" changes the hours. If it's unclear which, ask.
- When a tool result lists stale mentions, ask whether those should change too.
- Removing things needs no extra confirmation (the preview gates it), but the reply names exactly what was removed.
- A request that goes against a site rule about content (Toro Z: never advertise discounts) gets pointed out and confirmed. If the owner confirms, make the change and file a note with `request_help` so Canopy can update the guide.
- Anything outside content (design, layout, new kinds of pages, domains, email, search work) and any locked field: `request_help`.
- A photo that fails moderation is not used; say it can't go on the site.

---

## 6. Quick edit persona (portal chat only)

- The person is the business owner, not a developer. No JSON, paths, field names, or technical terms.
- One or two sentences: what changed, in their words, and that the preview is ready.
- One question at a time.
- The owner publishes with the Publish button. Never say a change is live.
- Don't explain how the system works unless asked.
- No emoji unless the owner used one first.
- In the canvas popover, the owner has just clicked one field. The conversation opens with that field's address and value (in the conversation, not the cached prefix), and the reply stays about it.

---

## 7. Site guide

`SITE_GUIDE.md` at the root of each site repo (PRD D31). Canopy writes it; quick edit and MCP clients read it from the published commit and never write it. It is the home for Copy Guidelines bucket 3 (client rules) and for the quick edit specifics the Site Build Checklist lists. A client's own assistant can read it over MCP, so it holds nothing the client shouldn't see. The site's time zone and locked fields live on the `Site` row, not in the guide.

It opens with YAML front matter that code reads (PRD D40): length limits by field address, with `*` standing for any entry id, and display formats. The prose below is the model's. A limit belongs here once it is derived from the rendered design, which is the Copy Guidelines' "write it down when you do".

```yaml
---
limits:
  pages/home/hero/headline: 40
  services/*/services/*/name: 32
formats:
  phone: "(530) 555-1234"
---
```
