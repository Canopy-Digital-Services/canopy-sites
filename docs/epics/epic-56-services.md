# Epic 56: Services

**Status:** Draft (2026-11-17). Michael set it to be built now, ahead of E55 (2026-11-20), and widened its foundation past a salon's menu (2026-11-23; sections 4.1 to 4.3 and 6). PRD D66 is in the PRD. Section 7's item 4 is open: the portal's shape is being planned in a session of its own, and this epic's screens wait on it. Nothing is built.
**Phase:** 9, The suite (`docs/canopy-sites/ROADMAP.md`, E56)
**Predecessor:** Epic 46 (Client 2 on Sites), whose templates put the home page's featured services and the menu on one list; Epic 33 (the visual editor) and Epic 54 (one editor at a time), which the tab stands on
**Successor:** E57 (button and menu text on the canvas), which the action layer is built to carry; E50 (Gallery) and E51 (Events), which reuse the tab's list and form

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/UX_PATTERNS.md` section 1, `docs/canopy-sites/PRD.md` (D8, D9, D35 to D40, D48, D50, D54, D64, sections 4.4 to 4.6), `docs/epics/epic-33-visual-editor.md` (4.5, 4.6), `docs/epics/epic-38-link-and-claim.md` (4.8, the tabs), `src/lib/site-tools/hold.ts` (one editor at a time), and `packages/site-contract/README.md`. In `apps/portal`: `src/app/(admin)/(sites)/editor/canvas-editor.tsx`, `src/lib/canvas-bridge.ts`, `src/lib/site-tools/index.ts` (`saveDraft`), `src/actions/site-editor.ts`, `src/components/sites/site-hold.tsx`.

---

## 1. Goal

An owner opens Services on their phone and changes a price, adds a service, takes one off, or picks which ones their home page features. Every place the site shows that service follows, because the site has one list. On the canvas they make the same changes where they see them, and the change is written to that list.

The list is not new. The contract's `services` collection holds it, a page section features services by id, and a featured row on a page is the menu's own entry (as of 2026-11-17, contract 0.7.0). What an owner has for it today is the canvas, which edits a name, a description, or a price in place, in the menu and in a featured row alike, and Quick Edit, for everything else: adding, removing, or reordering a service, and choosing which are featured. Nothing in the portal knows what a service is, and nothing on the canvas adds one or changes which are featured.

This epic gives the list a tab, and gives the canvas an action layer: a click that could mean more than one thing shows its actions as icons, and the owner picks. Services are its first use.

The list is built for any business with something to offer, not for a salon's menu: an auto shop quotes after an inspection, a CPA lists no prices, and a pest control plan is priced by the size of the home (Michael, 2026-11-23). As of contract 0.7.1 every service needs exactly one price, sits inside a category, and describes itself in 200 characters. This epic loosens what would be costly to change once the tab and three sites stand on it (4.1 to 4.3), and leaves the rest to later contract releases (section 2, Out).

## 2. Scope

### In

- **The contract, 0.8.0 (4.1)**: a template can say where a list is, service lists and featured lists carry a kind the canvas can open, and the rule that names a new entry's id is exported. Additive, with no content migration.
- **The tab (4.2)**: Services in the Sites nav, for a site whose content has `services`: the menu as it nests, each service with its name and price.
- **A service (4.3)**: its form, for changing one and adding one; removing one; reordering a list by dragging.
- **Featured (4.4)**: for each page section that features services, which ones and in what order.
- **On the canvas (4.5)**: the action layer. On a service it offers the tab's own forms: edit the service, add one, change the featured ones. On marked text inside a link it offers a pencil and a follow icon.
- **The sites (4.6)**: each site with a service list marks its lists, and renders every showing of a service from the list.
- **Docs (4.7)**: section 10, and a help page.

### Out

| Not here | Why / where |
|---|---|
| Wording of its own for a service where it is featured | A service reads the same wherever it shows: that is what makes it one list. An owner who wants a featured row to read differently renames the service |
| Prices as amounts | A price stays display text ("$170", "From $150", "Consultation required"), as the contract has it. Amounts come when Booking or payments need them |
| Adding, removing, or reordering categories and the sections and groups inside them | Templates place some by id (the test site's three cards). Renaming one is a text edit, here and on the canvas; the rest stays Quick Edit's where the list isn't fixed, and Canopy's where it is |
| Editing the text of buttons and menu items | ROADMAP E57, an epic of its own straight after this one (Michael, 2026-11-17). The layer built here carries it: a pencil and a follow icon on anything that links. Opening those fields to owners changes the lane and every site's guide (PRD D50 keeps buttons and navigation labels Canopy's, and no site marks them), where this epic changes neither |
| Products sold online (a cart, checkout, stock) | A runtime component (PRD D52), and a feature of its own. A price list of things a business sells fits this list as it is |
| A form's choices taken from the list | E55's to build (its section 7, item 11): Client 2's request form asks which services a client wants, and it is the next place a second copy would appear. A request keeps the service's name as it read when sent, beside its id, since the list changes afterwards |
| How long a service takes, for Booking | E52's open question. The contract's `duration` is display text |
| Quick Edit filling the tab's form (PRD D54's third step) | Quick Edit already changes services through the tool layer, into the same draft the tab shows. Decided after owners have used the tab |
| Tabs for classes, the team, FAQs, or reviews | Each when a site needs it. The list and the form built here are made to be reused |
| Several prices for one service (by vehicle, by the size of a home, by a session's length) | Reserved, not built: 4.1 says what must not assume one price. Built when a site needs it |
| What a service includes, a long description, a photo, a page of its own | Each a contract release when a site needs it. The form takes a new field with no work in the tab (4.3) |
| The tab's name on a site whose list isn't services (a restaurant's menu, a firm's practice areas) | When such a site comes. The id stays `services` |
| The area a business serves | The site's fact, not the list's, and the contract has no field for it (as of 0.7.1) |
| The rest of Epic 38's 4.8 (Forms and Stats shown only where the account has them) | Epic 38. This epic applies 4.8's rule to its own tab only |

## 3. Order

- **4.1** first: the canvas (4.5) reads it. It releases by itself, and nothing changes for a site until its templates say where a list is (4.6).
- **4.2, 4.3, 4.4** in that order, on the local portal against the demo, whose menu is Client 2's shape. Each is proposed, built after a yes, and used by Michael before the next starts.
- **4.5** after 4.3 and 4.4, whose forms it opens. Its link half needs neither and is the layer's smallest piece, so it is built first.
- **4.6** per site once 4.5 is released: the demo first, then the test site, then Client 2. Client 2's half of 4.6 that needs no portal work, every showing rendered from the list, is Epic 46's 4.2.
- **Its place among the tabs** is section 7, item 1. It needs neither the media pipeline (E50) nor the builder as the production build (E36, which E51 waits on), so it can be the first tab built.

About four sessions: 4.1 with 4.2; 4.3; 4.4 with 4.5; 4.6 with 4.7 and the release.

## 4. Requirements

### 4.1 The contract, 0.8.0 (`packages/site-contract`)

- **`list(address)`**: the attributes a template puts on the element that holds a list's entries, beside `field()`. A list is not a field: the canvas neither marks it nor selects it. A selection inside it reports it (4.5).
- **Lists the canvas can open.** A list of services (a category's, a section's, a group's) gets field metadata: a kind of its own and the label "Services". A section's `serviceIds` already has the kind `reference`, and from 0.7.1 so does each of its entries. With those, `fieldInfo` tells the canvas what a list holds, the way it tells it a price from a paragraph today.
- **The id rule, exported.** A new service's id comes from its name by the rule the 0.1 migration already uses (`slug` in `src/migrate.ts`, with a number added when the id is taken), unique across the whole menu, since pages feature services by id. The portal and the model then name entries the same way.
- **A service needs no price.** `priceLabel` becomes optional. Nothing in the contract, the portal, or a template may require one, and a template renders nothing where there is none.
- **A list needs no categories.** The top level of `services` holds categories, services, or both, in order, so a short list is written flat. A service's id stays unique across the whole list wherever it sits, addresses and `fieldInfo` work for a service at the top level, and a page features it like any other. Content that validates on 0.7.1 validates unchanged.
- **Room for several prices.** Not added in 0.8.0. The shape it will take is a list of options on a service, each with an id, a name, and a price, in place of the service's own. So nothing built here may assume a service has exactly one price: the tab's row, the form, a featured row, and anything that later points at a service (a form's choice, Booking) show the price a service has, which may be none.
- **A service's fields are read from the contract.** An export gives, for an entry of a list, its fields in order, each with its kind, label, description, and whether it is required, so the portal builds the form from the schema (4.3) and keeps no list of field names of its own.
- `CONTRACT_VERSION` and `package.json` at 0.8.0, the README, a release tarball. A site installs it when its templates use `list()` (4.6), after the portal runs it.
- Tests: `list()` refusing what isn't an address, `fieldInfo` on each list's address, the id rule (a taken id, a name with no letters, a name past the id's length), a service with no price, a flat list, a list mixing categories and services, an id used at both levels, and the fields export for a service.

### 4.2 The tab (`apps/portal`)

- **Services** joins `SITES_TABS` with the id `services`, which never changes afterwards, since a welcome video is named by it. Where it sits in the nav is settled with Michael on the local portal. It shows when the site's published content has a `services` collection, which is Epic 38's rule (4.8): the collection's presence is the signal, never a switch. As of 2026-11-17 the nav lists every tab for every Sites account, so this epic adds the check for its own tab. The route 404s for a site without the collection.
- The page shows the menu as the draft has it, in the menu's order and nesting: each category, the sections and groups inside it, and each service as a row with its name, and its price where it has one. A service at the top level shows with no category over it. Laid out for a phone first.
- A category's, section's, or group's name is edited where it shows, as text, held to the guide's limit.
- **It follows the hold** (PRD D64) the way every editing page does: rendered from `getSiteEditing`, wrapped in `SiteHoldProvider`, taking the site only when a form is opened (`begin()`), never for being open. While someone else is editing, or has left a draft, the page says who, as Quick Edit and the Editor do, and nothing on it edits. When the site moves without the page's doing, the page loads it again.
- Unpublished changes, Preview, and Discard stay in the Sites chrome. The tab has no Publish (PRD D47).

### 4.3 A service

- **The form** is built from the contract's fields for a service (4.1), never from a list in the portal. Name always, since the contract requires it. Every other field is offered only where the site's guide gives it a limit, which is where its templates render it: Client 2 sees no duration, and a site that shows no prices sees no price. Each field's input follows its kind, as on the canvas, and shows the guide's limit as a counter. A field of a kind the form has no input for is left out. A contract release that adds a field to a service needs no change here unless its kind is new.
- **Adding** opens the same form, empty, at the end of the list it was opened from. A list at the guide's count offers no Add, and says the count.
- **Removing** asks first (`ConfirmDialog`). A service a page features says so in the confirmation, and comes out of that page's featured list in the same save.
- **Reordering** is by dragging (`SortableList`), within a list.
- **Every write is `saveDraft`**, through one new server action that builds address ops (`add` with `before`, `remove`, `move`, `replace`), so ownership, the hold, the lane, the contract, the guide's limits, counts, and refused phrases, and the rate limit apply with no new guard. A refusal shows the tool layer's message as it is. The action's ids go through `requireId`.
- A fixed list (PRD D50) offers no Add, Remove, or drag: its entries edit, and that is all.
- Database tests: another account's site is refused; removing a featured service changes both lists in one draft write; a new id is unique across the menu; a list past its count and a fixed list are refused through the action; a field the guide doesn't limit is not offered; a service saves with no price; a service is added to a flat list.

### 4.4 Featured

- For each page section whose content has `serviceIds`, the tab shows that list under the section's own heading ("My personal favorites"), with the page it is on.
- The owner adds a service from the menu (a pick list that searches by name), removes one, and drags to reorder, up to the guide's count for that address.
- A featured row shows the service's name and price as the menu has them, and opens the service's form (4.3): there is nothing else to edit about it.
- The guide's `counts` is a ceiling only. A template that needs an exact number (a two by two grid) is checked rendered at fewer in 4.6, and where fewer breaks the layout the template handles it.

### 4.5 On the canvas: the action layer

Today a click on the canvas means one thing. On marked text it starts an edit; on a link it moves the canvas to that page, which is what makes editing feel like using the site; anything else is the site's own. Marked text inside a link can be edited and never followed (`canvas-bridge.ts`, checked 2026-11-17), and nothing adds a service or changes the featured ones.

**The layer** (Michael, 2026-11-17): where a click could mean more than one thing, the canvas shows those actions as icons at the element, each with a tooltip, and the owner picks one. It is drawn by the portal over the frame, from what the bridge reports about the click: the field, where its link goes when it sits inside one, and the lists it sits in (4.1's `list()`).

- **Text that only edits** behaves as today: the click starts the edit, with no step added.
- **Marked text inside a link**: a pencil and a follow icon, and nothing happens until one is picked. The pencil edits the text in place. Follow does what a click on the link does today: the canvas moves to the page, or says the link goes to another site. An unmarked link keeps following on the click.
- **A service**: a click on its name, description, or price starts that edit as today, and the layer offers what else can be done from there: edit the whole service (4.3's form, so a field the page doesn't show yet can be filled), add a service to the list it sits in, and, in a featured block, change the featured ones (4.4's list). These are the tab's own components in the canvas's panel, writing through the same action, so there is one implementation.
- A change the templates must render (an added, removed, or reordered row) shows the list as updating until the draft's build lands, as hours do today.
- The icons are the portal's own set (`Pencil` to edit, as everywhere), each in a `Tooltip`. Which icon means follow, and whether a service's first click edits at once or waits for a pick as a link does, are settled with Michael on the local portal, a piece at a time.
- Unit tests for the bridge: a click on marked text inside a link reports the link; a click on a service's field reports the list it sits in; a click on an unmarked link still navigates.

### 4.6 The sites

For each site with a service list (the demo, the test site, Client 2):

- The site installs contract 0.8.0. Each service list's container carries `list(...)` with the list's address, and each featured block the address of its `serviceIds`.
- Every showing of a service renders from the list: nothing about a service is typed into a template.
- A service with no price renders with no gap and no stray punctuation where the price would be, checked rendered.
- The guide's `counts` cover each list, checked rendered at the count and at one fewer, at 360 and 1440 px.
- Acceptance acting as the client: the runbook's section 5, plus this epic's section 5 on that site.

### 4.7 Docs

Section 10, each in the commit that changes the behavior. A help page, "Your services", in the group only Sites accounts see (`content/docs/meta.ts`).

## 5. Acceptance

- [ ] A site with a `services` collection shows the Services tab; Client 1 and canopyds.com, which have none, don't, and the route 404s for them.
- [ ] On a phone, acting as the client: a price changed in the tab shows in Preview in the menu and in the featured row; a service added to a group shows in the menu; a list reordered by dragging shows in the new order.
- [ ] Removing a featured service names the page in the confirmation, and Preview shows it gone from both.
- [ ] A featured service swapped for another shows on the home page in Preview, and a pick past the guide's count is refused with the count.
- [ ] On the canvas, from a click on a service: the layer's featured action opens the featured list, and a swap made there lands in the draft; its add action adds a service to that list, which appears when the build lands; a description added from the service's form shows where the template renders one.
- [ ] Marked text inside a link shows a pencil and a follow icon; the pencil edits it and follow moves the canvas to the link's page. An unmarked link follows on the click, as before.
- [ ] A name edited in place on a featured row changes the menu's entry, as before.
- [ ] The test site's three categories can't be added to, removed, or reordered; the services inside them can.
- [ ] With two people signed in, the second sees who is making edits on the tab and can't change anything until the first publishes or discards.
- [ ] A change Quick Edit makes to a service shows in the tab without a reload of the portal.
- [ ] A service saved with no price shows in the tab and in Preview with nothing where the price would be.
- [ ] A site whose list has no categories shows its services in the tab, and one is added, featured, and removed.
- [ ] Every migration read (none is expected); `npm run build`, `lint`, and `test` pass; each new test fails with its guard removed.

## 6. Decisions

### Michael (2026-11-17)

- **Services are a feature, not a rule in one site's front end.** Client 2's home page and menu disagreed because the same four services were typed twice; a rule for that page alone would be a patch. The fix is one list with a place to manage it.
- **Lightweight.**
- **What an owner changes on the canvas is written to the list**, and the canvas must be able to make the change where the owner sees it.
- **The action layer.** A click on anything that links gives two icons, a pencil and a follow icon, so the owner chooses; following on a click is what makes editing feel like using the site, and that stays for links that aren't editable. He had it in mind for the text of buttons and menu items. The same layer carries "edit service" and "add a service line".
- **Button and menu text is an epic of its own**, straight after this one (ROADMAP E57).

### Michael (2026-11-20)

- **Built now**, ahead of E55's Forms parts: Client 2's request form waits on a conversation with the client. He means the list to serve that form, which is E55's to build (its section 7, item 11).

### Michael (2026-11-23)

- **The foundation is any business's**, not one client's: an auto shop, a CPA, pest control. Not all of it is built now; what is built must not have to be rebuilt for them. Four things follow, in 4.1 to 4.3: a service needs no price, room is left for several, the form is read from the contract and the site's guide, and a list needs no categories.
- **Which fields the form offers** follows from the third: name always, and every other field where the site's guide limits it.
- **PRD D66**, approved as section 7 worded it.

### Agent calls inside scope

- **No new tool-layer write.** `saveDraft` already takes add, remove, move, and replace by address, with every guard. The tab is a form over it.
- **No new source.** A tab's writes are recorded as the Editor's are, since nothing reads the difference.
- **The tab is named Services on every site**, the collection's own label, whatever a site calls its page.
- **Removing a featured service also takes it off the page that features it**, said in the confirmation. The contract refuses a featured id that isn't on the menu, so the alternative is a refusal the owner has to work around in two steps.
- **The canvas hosts the tab's components** in its panel, never a second editor for the same list.
- **A list is told to the canvas by its own attribute, not marked as a field.** A marked container would take the field's underline and hover over everything inside it and would have to be clicked in the gaps between its rows. Reported with a selection inside it, a list needs no click of its own.
- **The layer's link half ships here for text that is already marked.** It costs nothing in the lane, and fixes a link that can be edited and not followed.
- **Categories and groups are renamed, not rearranged, here.** They are where templates hold design by id, and the form to add one would need each site's rules.

## 7. Open

For Michael.

1. **When.** Now, and the first tab built (section 6, 2026-11-20). Left open: whether it comes ahead of Client 3 in "The MVP", and so before or after Client 2's claim. Until it ships, Client 2's owner changes a price on the canvas and asks Quick Edit to add a service or change a favorite.
2. **Which fields the form offers.** Name always, and every other field where the site's guide gives it a limit, read from the contract (section 6, 2026-11-23; 4.3).
3. **PRD D66.** In the PRD since 2026-11-23, with the Tool tabs rows and D43's line on a marked link. D37's list of what goes through the popover and section 6's nav change with the build. D50 is E57's to revise.
4. **The portal's shape.** With Services, the Forms tab opening on what came in (Epic 55), and later Gallery and Events, the nav grows past what fits a phone, and nothing says what an owner lands on. Michael is planning that in a session of its own (2026-11-23), and its answer may change where this tab sits and how its screens are laid out. Recommended: 4.1 and 4.3's write action are built ahead of it, since neither depends on layout, and the screens in 4.2 to 4.5 wait for it.

## 8. Completion report

## 9. Progress log

- 2026-11-17: Drafted after Epic 46's read of Client 2 found its home page's four featured services typed apart from the menu. Checked in the code that day: the contract holds the list and featured ids, with a check that a featured id is on the menu; `saveDraft` takes structural ops by address; the canvas edits `text`, `paragraph`, and `price` in place and sends every other kind to the Quick Edit popover; the nav lists four tabs for every Sites account; no portal code names services.
- 2026-11-17 (later): Michael's action layer (section 6) replaces the draft's plan to mark a list and click the space around its rows. 4.1 gains `list()`, and 4.5 is rewritten around the layer, with its link half for text already marked. Button and menu text was section 7's item 3 until Michael made it an epic of its own (ROADMAP E57).
- 2026-11-18: Client 2's eval (Epic 46) found that the contract's lane refuses any change to a featured list: each entry of `serviceIds` is the `Id` type, flagged as Canopy's. 4.4 needs that fixed first: a reference type for the entries without the flag, with a lane test.
- 2026-11-18 (later): Fixed in contract 0.7.1 on `dev`. Each `serviceIds` entry is a reference (the id format, kind `reference`, labelled "Featured service", no `canopy` flag), so `laneViolations` allows swapping, adding, removing, reordering, and clearing a featured list, while an entry's own id stays Canopy's and `validateContent` still refuses an id that isn't on the menu (`test/lane.test.ts`). Against 0.7.0 the same edits gave "ID is Canopy's to change" for a swap, a removal, and a reorder; an append alone got through. Client 2's own content and locks, with one featured service swapped for another (H9), pass under 0.7.1. 4.4 no longer waits on it. Only the portal's tool layer checks the lane, so the fix reaches owners with a portal release; a site keeps 0.7.0 until it has another reason to upgrade. The release tarball is packed, not yet published.
- 2026-11-18 (later): Released. Portal 5.23.0 (PR #66) carries 0.7.1, and production's portal has run it since 00:24 UTC on 2026-11-19. `site-contract-v0.7.1` is published, tagged on `main` at `a35ae06` as the earlier contract releases were; the downloaded asset matches the packed file. 4.1's 0.8.0 builds on it.
- 2026-11-23: Michael asked that the list serve any business (an auto shop, a CPA, pest control). Read against contract 0.7.1: a service needs exactly one price, sits inside a category, and has 200 characters of description, while ids, featured references, and each site's own limits already carry over. 4.1 to 4.3 changed for the four things that would be costly later (section 6); the rest is in section 2's Out.
- 2026-11-23 (later): Michael approved D66, which went into the PRD with the Tool tabs rows and D43's line. Section 7 gains item 4: the portal's shape is planned in a session of its own, and this epic's screens wait on it.

## 10. Docs this makes stale

Each lands with the change that causes it, never in a later pass.

**This repo**

- `docs/canopy-sites/PRD.md`: D37's list of what goes through the popover, and section 6's nav.
- `docs/canopy-sites/ROADMAP.md`: E56's brief and the Sequencing line; E33's brief where it lists the canvas's own editors; E55's first step, if its form's choices later read the list.
- `docs/AGENT_CONTEXT.md`: section 2's nav and Sites-only routes; the tool layer row in section 3, for a tab as a writer.
- `docs/UX_PATTERNS.md`: the tab's list and form, as the pattern Gallery and Events follow; the canvas's action layer.
- `docs/epics/epic-38-link-and-claim.md`: 4.8, which gains the Services rule.
- `packages/site-contract/README.md`, `CHANGELOG.md`, and `docs/epics/README.md` with the release.
- `apps/portal/content/docs`: the new help page.

**Site repos** (`canopy-demo-site`, the test site's repo, Client 2's repo): the marked lists, and each `SITE_GUIDE.md`'s counts and its line on where a service repeats, which goes once it is one value.

**Nextcloud (Canopy Sites collective)**

- **Sites Onboarding Runbook**: section 2's marks (a list of services and a featured block carry `list()`), and section 5's acceptance for a site with the tab.
- **Site Build Checklist**: the guide's limits decide which of a service's fields the tab offers.
- **Quick Edit Eval Runbook**: a case per site that a change made in the tab and one made in Quick Edit land in the same draft.
