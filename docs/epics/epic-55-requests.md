# Epic 55: Requests

**Status:** Draft (2026-11-19), paused on 2026-11-20: Services (Epic 56) is built first, and Michael takes the form up with the owner around 2026-12-04. Sections 2, 3, and 7 still wait on him. Nothing is built.
**Phase:** 9, The suite (`docs/canopy-sites/ROADMAP.md`, E55); 4.1 and 4.2 are its first step, which is in "The MVP"
**Predecessor:** Epic 56 (Services), built first, whose list her form's services come from; Epic 46 (Client 2 on Sites), which linked her site, made her account, and put her booking address in one locked value; Epic 42 (4.4), the pattern for a client's form built by acting as them; E39, whose media volume the photos share
**Successor:** confirming a request with a time (ROADMAP, "Not scheduled"); E52 (Booking), when a client needs a calendar

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/UX_PATTERNS.md` (section 1, and sections 8 and 11 for the embed), `docs/canopy-sites/PRD.md` (D52, D55, D65), `docs/canopy-sites/ROADMAP.md` ("The MVP", E55), `docs/canopy-sites/REVIEW_FINDINGS.md` (F12, F32), `docs/epics/epic-42-test-site-on-sites.md` (4.4), and `docs/epics/epic-46-client2-on-sites.md` (4.6, sections 6 and 9). In `apps/portal`: `src/lib/public-submit.ts`, `src/lib/field-types.ts`, `embed/src/form.ts`, `embed/src/validation.ts`, `src/lib/submission-email.ts`, `src/lib/welcome-video.ts` with its route `src/app/welcome/[siteId]/[file]/route.ts`, `src/app/(admin)/forms/`, and `src/components/sites/sites-nav.tsx`. In `client2`: `CLAUDE.md` and `SITE_GUIDE.md`.

---

## 1. Goal

A new client reads the owner's services and prices on client2.example, taps the booking button, and asks for an appointment: who they are, what they want done, photos of their hair, their hair history, her policy agreed to, and the days and times that suit them. the owner reads the request on her phone, books the time in her own calendar, and answers the client herself. From the first visit on she books the next one in person, so a client fills the form once (PRD D65).

She is leaving Square, which today takes the booking, holds a card behind her cancellation policy, and keeps her client list. Nothing of Square's stays, so a request is also the only record of a client she will have, and the record of what they agreed to is what she has when a cancellation fee is disputed.

What Forms lacks for this, as of 2026-11-19:

- No field takes a file (`FieldType` in `prisma/schema.prisma`), and a submission is JSON of at most 64 KB (`public-submit.ts`).
- An Approval is a box and one line of plain text (`embed/src/form.ts`), with no document behind it and nothing kept of what was agreed to.
- A Sites account's Forms tab is the Forms product's page: a grid of forms and Create Form. Submissions are read one form at a time, the tab shows no count, a phone number or an email in a submission is plain text, and a submission can be archived or marked as spam but never deleted (`src/actions/submissions.ts`).

Her form itself needs none of that to start: every question but the photos is a field type Forms has. So the epic opens with the form, which her site needs the day Square closes, and then builds the three things that make it what she asked for. Those three are Forms' own, for every account.

## 2. Scope

### In

- **Her form (4.1)**: built in her account, acting as her, from the field types Forms has today.
- **The switch (4.2)**: her site's booking buttons open the form, on the day she names. Michael's go-ahead first.
- **An Approval's document (4.3)**: the text being agreed to, opened from the form, and kept with the answer.
- **The Forms tab for a Sites account (4.4)**: it opens on what came in.
- **Photos (4.5)**: a field type for a visitor's photos.
- **Her form, finished (4.6)**: the policy as a document and the photos added, and the whole flow run on a phone.
- **Docs (4.7)**: section 10, and the help pages.

### Out

| Not here | Why / where |
|---|---|
| Confirming a request with a time, and reminding the client | ROADMAP, "Not scheduled": proposed 2026-11-17, not decided |
| Any text message Canopy sends | A text is the owner's, from her own phone, started from the request (4.4) |
| A contacts model | Members (PRD D52). A client submits once, so the list of requests is the list of clients, findable by name (4.4) |
| A typed or drawn signature | Square's agreement is a box beside a link to the policy (Michael's screenshots, 2026-11-17), and hers matches it |
| Payments, deposits, a card on file | She takes payment by Venmo, outside the site |
| Files other than photos | Nobody has asked. The type is named for what it takes, and a general file field would come after it in the Add field menu |
| Steps in a long form, and fields shown by an earlier answer | `docs/future-features.md` |
| The form on a page of her own site | Section 7, item 3. A new page is a template and a contract change, Canopy's and later |
| A sender with headroom (F32), and the portal on one box (F12) | Their own items. Section 7, item 9, asks whether either comes before 4.2 |
| Forms import and export (E45) | Her form is built by hand, acting as her, as Jane's was |
| Checking a visitor's photos by model | They are shown to nobody but the account's people. D33's pass is for photos an owner publishes |
| The media pipeline and the Gallery tab (E50) | An owner's photos are committed to the site's repo and published. A visitor's are private to the account and never leave the portal |

## 3. Order

- **After Epic 56** (Michael, 2026-11-20). Building starts once sections 2, 3, and 7 are approved and the owner has answered section 7's item 2.
- **4.1, with Michael's go-ahead** (it writes to production): her form, built and published with nothing linking to it. It waits on nothing but her wording (section 7, item 2).
- **4.3** next: it is small, it works on the notification email alone, and it is the part her form should have on its first day.
- **4.2 on the owner's date**, with Michael's go-ahead: one commit to `client2` `main`, which deploys the live site. It has no place in this order, because the date is hers; if it comes before 4.3, her form's Approval is a plain line until 4.6.
- **4.4**, a section at a time with Michael (the list, a request, the tab's count, where the forms go), each tried on the local portal before the next.
- **4.5** last: it is the largest, and the only part that adds a public route that takes files. Its storage is backed up before the first real photo is taken.
- **4.6** when 4.3 and 4.5 are in production.

About six sessions: this one with 4.1; 4.3; two or three for 4.4; two for 4.5 (the files, then the field in the form and the portal); 4.6 with whichever comes last.

## 4. Requirements

### 4.1 Her form

Her Sites account exists and is unclaimed (Epic 46, linked 2026-11-17). Acting as the owner, on production:

1. A hosted form (section 7, item 3), named for what a visitor is doing. Fields, all from today's types: Name, Phone, and Email, each required; her hair goals (Paragraph); the services wanted (Choose several, the options typed by hand from her menu's categories); her hair history (Paragraph); the days that suit (Choose several, the days she works) and the times (Short answer); and an Approval of the salon's policies, required. The wording of each is the owner's (section 7, item 2).
2. Notifications to her email with the answers included, so she reads a request and replies from her mail before she has claimed her portal.
3. The hosted page in her site's colors and type (`client2` `src/styles/global.css`).
4. The message after sending says what happens next, in her words. Until 4.5 it also says how to send photos (section 7, item 4).
5. Published, with nothing linking to it. One test request, sent from the hosted page while acting as her, arrives in her account and in her mail, and is archived.

### 4.2 The switch

As of 2026-11-19 every booking button on her site reads `site.contact.bookingUrl`, which is Square's address and is locked on her site's row; the buttons' labels are in the templates ("Book Now", "Book on Square", "Book an Appointment"); and three lines of her copy ask for a card on file (her site guide lists where).

1. `site.contact.bookingUrl` becomes the form's address, in a Canopy commit to `main`. The lock stays: the address is Canopy's wiring.
2. The buttons' labels say what the button now does, one wording for all of them (section 7, item 10), in the same commit.
3. The three card-on-file lines and the cancellation window are the owner's copy. She changes them in her portal once she has claimed it, or Michael does acting as her with her words, published just before the commit.
4. `SITE_GUIDE.md` in the same commit: where a card on file is asked for, and what the booking button opens.
5. The `Book Appointment` event keeps its name and now means the form was opened. Her Report Profile (Nextcloud, Monthly Reports) is rewritten: the conversion is a request received, counted in the portal, where it was a tap through to Square.
6. Checked live on both boxes: every booking button opens the form, and a request sent from a phone reaches her mail.
7. the owner is told what is hers to change: Square's link wherever else she has posted it (her Instagram profile, her Google listing).

### 4.3 An Approval's document

1. An Approval takes an optional document: a title and its text. The text is plain, with its line breaks kept, and has a length cap in the tables beside `validateField`.
2. In the form, a link beside the statement opens the document over the form, with its title as the heading and one button that closes it, as Square's does. It is reachable and closable by keyboard, and the form's answers are untouched by opening it. The link's wording is settled with Michael on the local portal.
3. When a submission is stored, the document's title and text as they stand go with the answer, on the server, from the field's own settings and never from the request. A later edit to the field, or its removal, changes nothing a stored submission shows.
4. A submission's page shows the document agreed to under the answer. The notification email names it. The export carries its title.
5. The embed and the hosted page both render it (`npm run embed:build`), and the single-field submit route stores the same record or refuses an Approval that has a document.

### 4.4 The Forms tab for a Sites account

Built a section at a time with Michael, phone first. A Forms account keeps today's pages.

1. **The list.** For a Sites account, `/forms` opens on submissions across the account's forms: newest first, new ones marked, the form named when the account has more than one, and today's views (new, all, archived, spam). A search by name finds a request in any view.
2. **A request.** Its answers in the form's order, with a phone answer that calls or texts and an email answer that writes, from the device's own apps. Archive, spam, and a delete that asks first: a request holds a person's details, and its owner can remove them.
3. **The count.** The tab shows how many are new.
4. **The forms.** The account's forms and the builder are one click from the list. What an account with no forms sees is section 7, item 6.
5. The notification email's link opens the request in this view.

### 4.5 Photos

1. **The type.** Photos, in the Add field menu before anything more general. Its one setting is how many a visitor may attach, up to a ceiling. It is offered only where `MEDIA_DIR` is set.
2. **In the form.** A visitor picks from their library or takes a photo. Each is downscaled in the browser before it is sent, shown as a thumbnail, and removable. A file the browser can't read as a photo is refused there with a plain line. Tried on an iPhone and an Android phone, whose cameras' own formats are the common case.
3. **Sending.** Photos go with the submission in one request (section 7, item 7), through `handlePublicSubmit`'s gates in their order, with a cap for each photo and for the request. A submission whose honeypot is filled stores no files. The single-field submit route refuses the type.
4. **On the server.** Each file is checked by its content, decoded, and written again as a new image with its metadata removed, location included. What can't be decoded is refused and the submission with it. A small rendition is made for lists.
5. **Stored** under `MEDIA_DIR`, by form and submission, with a row for each file. Nothing is written until every gate has passed, and a failure part way leaves no file behind.
6. **Read** through one route, by the people on the form's account and an operator acting as it, 404 for anyone else, never cached by a shared cache, and at an address with no file extension (the welcome videos' lesson, AGENT_CONTEXT section 2).
7. **Shown** on the request (4.4) and counted in the list. The notification email says how many came and links to the request; it attaches none. The export lists each photo's address.
8. **Removed** with the request, the form, or the account, files and rows together. A cap for each form's stored photos raises a notification the way the submission limits do (section 7, item 8).
9. **Backed up.** The media volume joins the nightly backups before a form with this field is published on production: a welcome video is uploaded again from its original, and a visitor's photo has none.
10. Tests for each decision: who may read a photo, what is refused, what a filled honeypot stores, and what deleting removes.

### 4.6 Her form, finished

1. Acting as the owner, or by the owner: her policy becomes the Approval's document, in the wording she settled, and a Photos field is added.
2. The flow is run on a phone from her live site: a request with three photos and the policy agreed to, her email, the request in her portal with its photos and the policy as agreed, and a text to the client started from it.
3. The message after sending no longer asks for photos another way.

### 4.7 Docs

Section 10, each in the commit that changes the behavior.

## 5. Acceptance

- [ ] Her form takes a request from a phone, the request reaches her account and her mail, and nothing on her site links to it before the switch.
- [ ] After the switch every booking button on client2.example opens the form, on both boxes, and nothing on the site names Square or a card on file.
- [ ] An Approval with a document opens it from the form, and a submission shows the text as it stood when it was sent, after the field is edited and after it is removed.
- [ ] Signed in to a Sites account on a phone, the Forms tab shows what came in with a count of the new ones, a request is found by name, and its phone and email answers call, text, and write.
- [ ] A request with three photos from an iPhone and from an Android phone arrives with all three, each without its location.
- [ ] Someone signed in to another account, and someone signed out, get a 404 for a photo's address.
- [ ] Deleting a request removes its files; deleting the form or the account removes theirs.
- [ ] The media volume is in the nightly backup, and a photo is restored from one.
- [ ] A Forms account's pages are as they were.
- [ ] the owner's flow, 4.6 item 2, on her live site.

## 6. Decisions

### Michael (2026-11-17)

- **Her booking is a request form she answers herself** (PRD D65), and it is Forms' work. Booking with a calendar (D55, E52) waits for a client who needs it.
- **Nothing leans on Square.** She is leaving it and takes payment by Venmo.
- **The agreement is a box and a link to the policy**, as her Square one is. No signature.
- **The Forms tab for a Sites account is about what comes in**: most Sites owners read submissions and never build a form.
- **The form from today's field types is in the MVP.** The rest was recorded as after it (section 7, item 1).
- **No text messages from Canopy.** "SMS is a tough feature."

### Michael (2026-11-19)

- Client 2 is on Sites (Epic 46), and the booking work is picked up.

### Michael (2026-11-20)

- **Services first.** There is time with the owner: the conversation with her resumes in about two weeks. The service list is meant to support this form (section 7, item 11).

### Agent calls inside scope

None yet.

## 7. Open

For Michael, and through him the owner. Items 1, 3, 7, and 11 change what is built; item 2 is what 4.1 and 4.2 wait on.

1. **When the three Forms parts are built.** After Epic 56 (section 6). They were recorded on 2026-11-17 as after the MVP, their place there to decide. Recommended: 4.3 as soon as this resumes, since her form wants it on its first day and it is a session; 4.4 and 4.5 as sessions allow beside the MVP's list, with the ROADMAP's "After the MVP" line and PRD D51 changed to say so in the commit that approves this.
2. **From the owner.** The date Square closes. Her cancellation window: Square's policy says two days and her policies page 24 hours (both read 2026-11-17). Her words for the three lines that ask for a card on file. What the form asks, in her words: Michael set aside drafting it on 2026-11-17, and 4.1 waits on it.
3. **A hosted form, or the form on her own site.** Recommended: hosted, for 4.1. Her booking button already leaves the site for Square's page, the switch is then one value, and the hosted page takes her colors and type. A page of her own with the form in it is a new template and a contract change (pages are fixed on every site), and can follow.
4. **Photos before 4.5.** The form can't take them until then. Recommended: the message after sending asks for them by Instagram message, the one way her site already gives to reach her. Hers to choose.
5. **The tab's label.** It reads Forms. Its id stays `forms`, which welcome videos are named by. Settled with 4.4's first section.
6. **An account with no forms.** The Client 3 site's form goes to an outside CRM, so its people would open the tab on nothing. Recommended: the tab is left out for an account that has no form, as Epic 56 shows Services only for a site that has services.
7. **Photos sent with the submission, or ahead of it.** Recommended: with it, in one request. Nothing is stored for a form that is never sent, so there is nothing to sweep up, and after the browser's downscale three photos are a few megabytes. Ahead of it gives a progress bar for each photo and needs a store of unclaimed files with a clean-up.
8. **How long photos are kept.** Recommended: until the request is deleted, with no expiry, and a cap for each form that tells the owner when it is near.
9. **Before the switch.** The form becomes her only way to be booked. It lives on Webber alone (F12): with Webber down her pages serve from Fox and the form doesn't answer. Its notification mail shares the ceiling in F32, and a notification that fails is logged and nowhere else. Recommended: the sender with headroom (the MVP's item 6) before 4.2, and F12 left as it is, since her pages already say to reach her on Instagram.
10. **The buttons' wording.** Three labels today. Recommended: "Request an appointment" on all of them. Canopy's text, so Michael's to set.
11. **Her form's services: typed, or read from her list.** 4.1 types them into a Choose several field, a second copy of the menu that goes stale when she adds a service. With Services built first, the form can read the site's list. Recommended: a step ahead of 4.1, a choice field whose options are the site's services, so her form is never typed from her menu. Epic 56 leaves it to this epic (its section 2).

## 8. Completion report

## 9. Progress log

- 2026-11-19: Drafted from Michael's direction of 2026-11-17, the owner's message, his screenshots of her Square agreement, and a read of the Forms code, `client2` `main` at `eda3872`, and Epic 46's log. Since the ROADMAP's brief was written, Epic 46 linked her site, which settles whose account holds the form, and both portal apps have their media volume (E39).
- 2026-11-20: Paused. Michael: Services (Epic 56) is built first, and the conversation with the owner resumes in about two weeks. Item 11 added to section 7.

## 10. Docs this makes stale

Each lands with the change that causes it, never in a later pass.

**This repo**: `docs/epics/README.md` (this epic); `docs/canopy-sites/ROADMAP.md` ("The MVP" paragraph on Square when the switch is live, E55's brief as parts ship, "After the MVP" and PRD D51 if section 7's item 1 is approved); `docs/AGENT_CONTEXT.md` (section 2's public API contracts for the photo routes and the multipart submit, section 5's field type steps if a type with files adds one, section 7's `MEDIA_DIR`, and the appendix for each schema change); `docs/UX_PATTERNS.md` (the Approval's document, the Photos field, and the Forms tab's list, with section 8 and section 11 for the embed); `docs/PRISMA_MIGRATIONS.md` (the persistent storage row, which says the volume holds welcome videos); `apps/portal/content/docs/submissions.md` and `forms.md`, and a page for the new field.

**`client2`**: `SITE_GUIDE.md` and `CLAUDE.md` at the switch.

**Nextcloud**: Client 2's Report Profile at the switch; the Backups and Restores runbook when the media volume joins the backups; the Sites Onboarding Runbook if a site's form becomes part of putting a site on; a Sites account's Forms welcome video, which shows the tab as it was when recorded.
