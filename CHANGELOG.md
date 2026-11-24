# Changelog

All notable changes to the Canopy portal (Canopy Forms, and from 5.0.0 the Canopy Sites portal) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.24.2] - 2026-11-23

### Fixed

- Sites: while someone else is editing, the top bar shows their changes with Preview as soon as they save, not only once they've left
- The avatar's initials come from the person's name, and from their email only when they have no name

## [5.24.1] - 2026-11-23

### Changed

- Sites: discarding someone else's unpublished changes asks "Discard <name>'s changes?" and warns that all of them will be lost, while discarding your own asks "Discard changes?"
- A dialog that asks whether to go ahead is titled as a question, such as "Delete Form?" or "Remove <name>?"

## [5.24.0] - 2026-11-20

### Added

- Sites: the claim email opens with Canopy Boy holding the keys to the site, carried inside the message so it shows where remote pictures are blocked
- Sites: a person added to a site's account gets their own "You're in!" email with a Set my password button
- Operator: Email it, beside Done on a claim link just made, emails that same link, so a copy already sent by text keeps working

### Changed

- Sites: the owner's claim email reads "Your Canopy Site is ready!" with a Claim my site button and no longer spells out the link
- Sites: a claim link's preview in a messaging app and the claim page lead with the email's picture, headline and button
- Operator: emailing a claim link says when it replaced one that still worked
- The password reset email is laid out like the claim email

## [5.23.3] - 2026-11-19

### Fixed

- Sites: the preview bar has Cancel beside Publish, which closes the preview or goes back to the portal page that opened it
- Sites: Discard on Quick Edit's draft card asks first for your own changes too, as the top bar's Discard always has

## [5.23.2] - 2026-11-19

### Fixed

- Sites: setting a password from a claim link asks for it twice, so a typo can't silently become the owner's password

## [5.23.1] - 2026-11-19

### Fixed

- Sites: a welcome video can be skipped forward and back on a deployed portal
- Operator: a welcome video upload refused for its size leaves no partial file behind
- Sites: when a preview can't be built, the Editor, Quick Edit and the preview bar say so and that the changes are kept, instead of "Not saved", an endless spinner, or the builder's own error

### Changed

- Production has welcome-video storage (`MEDIA_DIR` and its volume), so a site's tabs can have their videos there

### Removed

- The site time zone column retired in 5.21.0 is dropped from the database

## [5.23.0] - 2026-11-18

### Added

- Operator: a workstation script turns a screen recording into a welcome video's files, with the sound levelled, the picture made smaller, and the captions transcribed, flagging any word to check by ear

### Changed

- Sites: a welcome video's captions show in a strip under the picture instead of over the screen it shows, except in full screen
- The portal image has a media folder where an environment's welcome-video volume mounts (`MEDIA_DIR`)

### Fixed

- Site contract 0.7.1: an owner can change which services a page features, which every site had refused as Canopy's
- Sites: when the site builder fails, the owner reads "Your change wasn't published. Try again in a moment." in place of the builder's own error, and the portal and the builder log the failure

## [5.22.1] - 2026-11-18

### Fixed

- Operator: the Stats card shows the Umami website's domain on its own line instead of wrapping mid-line

## [5.22.0] - 2026-11-17

### Added

- Operator: the site page has a Stats card naming the Umami website a site's Stats read, with its domain and first and last visit, and flagging one the portal can't read, one whose domain is none of the site's hostnames, or one that has recorded nothing in a week
- Operator: Link a site and the site settings refuse an Umami website the portal can't read

## [5.21.0] - 2026-11-17

### Added

- Sites: a site's account can have several people, listed on the operator's site page owner first with where each stands on claiming
- Operator: add a person by name and email to get their claim link, copy or email a link to anyone who hasn't claimed, rename people, and remove anyone but the owner, which deletes their login
- Link a site takes the owner's name, and the portal shows a person to others by name, or by email until they have one
- Sites: one person edits a site at a time: it becomes theirs when they open an Editor field, send a Quick Edit message, publish, or discard, and everyone else sees who is editing and can preview but not change, publish, or discard
- Sites: the editing hold ends at publish or discard, a minute and a half after its holder leaves the editing pages, or after ten quiet minutes, and the others' pages open up by themselves
- Sites: a draft belongs to the person who made it until it is published or discarded, so one person's unfinished changes no longer go out inside another's publish, and anyone else discarding it is asked first with its author named
- Sites: a page loads the site again when someone else changed it meanwhile, handing back the text of an open field with a Copy button
- Sites: edits a save couldn't send are dropped with a message once the site has changed since they were typed, instead of being sent up to twelve hours later
- Sites: Recently published names who published each change, and the published commit carries their name
- Help: an Editing with other people page, in a Your website group that only Canopy Sites accounts see
- Sites: each tab can have a welcome video, which opens once on a person's first visit to the tab and replays from the help button
- Operator: upload a tab's welcome video with its captions, remove it, and see how far each person watched; videos stay off until the app has media storage (`MEDIA_DIR`)

### Changed

- The site time zone column is no longer read, and is dropped in the next release
- Development: the dev container runs as `node` and regenerates the Prisma client on every start, and the unused root compose file and `db:push` script are gone

### Fixed

- Sites: pressing Publish twice no longer marks a change that went live as failed, and an edit saved during a publish stays a draft instead of being marked published
- Sites: two first saves at the same moment no longer make two drafts
- Deploys: an image build missing a platform-specific package fails at once, instead of caching a broken install that fails every later redeploy

## [5.20.0] - 2026-11-14

### Added

- Sites: Stats shows each site's real numbers from Umami (visitors, pageviews, views per visit, visitors per day, top pages, and where visitors came from) for the last 7, 30, or 90 days in the account's time zone, and the demo keeps its sample data
- Sites: "How they found you" (formerly Referrers) names sources as an owner reads them, such as Google or Facebook, and counts visitors with no referrer as "Typed in or from an app"
- Sites: when Umami can't be reached, Stats says it can't load right now instead of failing

### Fixed

- Sites: views per visit divides pageviews by visits, not visitors, which overstated it for returning visitors

## [5.19.1] - 2026-11-13

### Fixed

- Sites: an Editor edit whose save can't reach the server shows "Not saved" with a Reload to save button, stays in the browser, and is saved on reload, and one failed save no longer stops the ones after it
- Deploys: a page left open across a release keeps working, which needs the `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` build arg

## [5.19.0] - 2026-11-13

### Added

- Sites: once a preview is published, its bar offers Close this window, or says "You can close this tab." where the tab can't close itself

## [5.18.0] - 2026-11-13

### Added

- Sites: the builder builds only repos in the GitHub accounts it is set up for, now that the Canopy Sites GitHub App is public and anyone can install it

## [5.17.0] - 2026-11-13

### Added

- Site contract 0.7.0: an FAQ can carry a link after its answer, and a team member can have a note shown with their role, which the owner edits, and a group they are listed under, which Canopy sets

## [5.16.0] - 2026-11-13

### Added

- Every account has a time zone, set on the Account page from a list searchable by city, offset, or name, and recorded from the browser at signup
- Sites: a site with a server of its own (Astro with an adapter) can be on Canopy Sites, with only its prerendered pages built and served
- Site contract 0.6.0: a site states hours only if it keeps them

### Changed

- Everything that used a site's time zone (notifications, claim emails and links, operator pages, Quick Edit's "today", builds, and the nightly rebuild) uses the account's, where an account with a site keeps its zone and every other existing account starts in Pacific time
- Forms: the font picker works from the keyboard like the other searchable lists, with the arrow keys, Enter for the first match, and one Tab stop

### Fixed

- Forms: the font picker opens on the chosen font, and typing a search shows its first match
- A control's tooltip no longer opens over its own open list, or when a closing list or dialog hands focus back to it

## [5.15.0] - 2026-11-12

### Added

- Sites: a site's repo can live in the client's own GitHub org or account, with the Canopy Sites GitHub App installed on that one repo and nothing set up on the builder, and Link a site lists the repos of every installation

### Fixed

- Forms: a submission's notification email names the time zone of its time, where a bare UTC time read as the recipient's own

## [5.14.8] - 2026-11-12

### Fixed

- Sites: publishing from any page of the preview keeps "Published. It will be live in a few minutes." on screen instead of switching to "No unpublished changes"
- Sites: an expired claim link's page offers only "Email me a new link" and says "Check your email" once it's sent, no longer offering Sign in to an owner with no password
- Times show in the viewer's own time zone instead of UTC in Quick Edit's history, a form's submissions, and the operator's dates

### Added

- Sites: on a phone, a Quick Edit reply that changed the draft carries a Preview button

## [5.14.7] - 2026-11-10

### Fixed

- Forms: form and submission actions check their input and the form's ownership more strictly
- Forms: a hosted form's page sends the browser only the title, fields, and look it shows, not the form's whole settings
- The demo site and the Editor's canvas answer 404 for an address that still holds an encoded dot or separator
- Forms: in the editor's preview, the "For preview only" tooltip lines up with a Submit button aligned left or right

### Changed

- Next.js, sharp, and nodemailer are updated past their known advisories

## [5.14.6] - 2026-11-10

### Fixed

- The demo site, the Editor's canvas, and the builder refuse page addresses with dot segments or a separator inside a part

## [5.14.5] - 2026-11-06

### Fixed

- A claim link pasted into WhatsApp shows its preview picture instead of a bare card

## [5.14.4] - 2026-11-06

### Changed

- A claim link's preview shows Canopy Boy holding up a set of keys, with a tag on the ring carrying the site's name

## [5.14.3] - 2026-11-06

### Fixed

- A claim link pasted into a message previews as "Claim your <site> website" instead of the portal's generic title, never shows the owner's email, and the browser tab matches

## [5.14.2] - 2026-11-06

### Fixed

- Sites: Quick Edit changes a fact only where the owner asked, and when the same fact appears elsewhere it says where and asks whether to change it there too
- Sites: Quick Edit's example requests wrap on a phone instead of pushing the page wider than the screen
- Forms: a form's first notification recipient is the account's owner, also when an operator builds the form while acting as the client
- Forms: renaming a field keeps what's typed when the label starts with the field type's name, and a Name's or Address's part labels are trimmed on save

## [5.14.1] - 2026-11-06

### Fixed

- Sites: Quick Edit's example requests come from the site's own content instead of the demo's, and a click puts one in the message box to change before sending
- Sites: Quick Edit refers to the request card without saying where it is, and drafts a request again when the owner wants to add to it

## [5.14.0] - 2026-11-06

### Added

- Sites: whatever Quick Edit can't do, it drafts as a request in the owner's words, which the owner can send to Michael from a card
- Operator: a sent request emails Canopy's operators with the owner as Reply-To, and closing it as done or declined from the operator's Requests page emails the owner a closing note; requests sent while acting as a client email nobody
- Sites: Quick Edit reads the site guide from the site's repo in place of the runbook overlay
- Sites: Quick Edit uses the owner's copy word for word, shows back suspected typos with the corrected text before using it, questions a sentence that looks unfinished, keeps each field to what its label says, and never works around a refusal or takes content as instructions
- Sites: Quick Edit refuses swearing, hate speech, and text with nothing to do with the business, which the owner can still send to Michael marked Refused
- Forms editor: Change appearance has Undo and Redo, with keyboard shortcuts outside text boxes, and Cancel, which puts back the theme the panel opened with

### Changed

- Operator: the runbook overlay is gone from the site page, and its database column is dropped
- Sites: Quick Edit treats a site guide's voice as context rather than a standard and mentions what the guide's copy avoids once, lightly

### Fixed

- Sign Out works again

## [5.13.0] - 2026-11-05

### Added

- Forms editor: the Add field list shows each field type with its icon
- Sites: every edit, from Quick Edit or the Editor, is checked against what the owner may change, refusing a field Canopy owns, a locked value, a fixed list's entries, or a list past its count by the field's label, and enforcing the site guide's counts and refused phrases
- Sites: every edit reports what it changed field by field and flags words from the guide's avoid list, and Quick Edit names each change back to the owner
- Site contract 0.5.0: classes with weekly sessions, a team, fields only Canopy changes, and one-line plain text fields

### Changed

- Sites: a site's locks are field addresses and a site can list fixed lists, with a migration that rewrites existing locks

### Fixed

- Forms: the thank-you message sits above "Powered by", which stays at the bottom
- Forms editor: the preview's mark follows its field when the layout moves

## [5.12.0] - 2026-11-05

### Added

- Sites: the builder reaches site repos through the Canopy Sites GitHub App with a token limited to the one repo each job needs, replacing per-site tokens, which stay as a fallback
- Operator: Link a site picks the repository from those the App is installed on that no site uses yet

## [5.11.1] - 2026-11-05

### Fixed

- Forms editor: a new field opens with its label ready to type over every time
- Forms: every Submit checks answers in form order and in Canopy's words, including after an earlier error
- Forms: a required Approval shows its asterisk

## [5.11.0] - 2026-11-05

### Added

- Operator: Link a site makes the client's Sites account, an owner with no password yet, and the site from the client's email, business name, GitHub repo, hostnames, and Umami id, then runs the first build, replacing New site
- Sites: claim links, which let an owner see their site and email, set a password, and stay signed in, working once for a week, with a new link replacing the old and an expired one offering a fresh one by email
- Operator: the site's Owner card copies a claim link to text the owner, or emails it
- Sites: Forgot password sends an owner who hasn't claimed their site their claim link instead of a reset
- Operator: Act as client opens the client's portal under a banner with Stop, refusing password changes and account deletion and naming the operator on edits
- Operator: the site page shows the owner's claim, the latest claim link, their last sign-in, and the latest build's outcome
- Email to a Sites account comes from the Canopy Sites sender (`SMTP_FROM_SITES`)

### Changed

- Forms: Yes / No is now Approval, Dropdown is Choose one, Checkboxes is Choose several, and Text is labeled Short answer, with saved forms converted
- Forms: Choose one shows up to six choices as radio buttons and a longer list as a dropdown, and nothing starts picked now that Default choice is gone
- Sites: typing past a field's limit in the Editor marks the overflow in red instead of refusing keystrokes, and Done waits until the text fits
- Operator: the site page shows the contract version a site's repo installs, so the settings field for it is gone
- Operator: a member the operator adds starts with no password and a claim link to pass on

## [5.10.0] - 2026-11-05

### Added

- Forms: a Date of birth field with Month, Day and Year boxes, and a Website field that takes "example.com" and stores it with https://
- Forms: Address collects the parts you choose, and Name and Address mark each part required on its own
- Forms: Checkboxes can offer Other, as Dropdown does
- Forms: Phone can ask for an extension in its own box
- Forms: live forms let visitors' browsers autofill Name, Email, Phone, Address and Date of birth
- Forms: a Paragraph's character limit counts down as the visitor types
- Forms editor: the preview scrolls to the field being edited and checks answers on Submit as the live form does, still sending nothing

### Changed

- Forms: Name is redesigned as Full name or Separate parts, with a middle name or initial, under short part labels
- Forms editor: a field is renamed with the pencil in its header and opens with its label ready to type over, and its type is fixed once it's added
- Forms: Dropdown and Checkboxes share one options editor, where Enter adds an option, pasted lines become one option each, and blank options are dropped on save
- Forms: Number takes a whole number or a decimal, accepts "1,250", and brings up the number pad
- Forms: Phone takes a US or Canadian number however it's written, or another country's from its +, stores it in international form, and exports the number and extension as two columns, with saved answers converted
- Forms: a Date takes Past Date, Future Date or Any Date
- Forms: help text sits under the label and is read with its field
- Forms editor: "Styling" is now "Appearance", opened with Change appearance
- Forms editor: buttons name the step they go to, and an open field closes from the foot of its settings or with Escape
- Forms: a form needs a field before it can be published
- Forms: the submit API refuses keys that aren't the form's fields and stores only well-formed, length-capped answers

### Fixed

- Forms: hosted forms can be submitted from their own page again, which had failed since 4.12.0
- Forms: a date limit of "today" means the visitor's today, where today was refused west of UTC
- Forms: a field named like the form's spam trap no longer sends every answer to spam
- Forms editor: the editor and preview fit windows 1024 to 1200px wide, and a Wide hosted form previews at its real width
- Forms editor: field saves show in the card header like every other save

### Removed

- Forms: field placeholders, with a Dropdown starting on "Choose one..."
- Forms: Text's formats and length limits, with a numbers-only Text becoming a whole Number and a URL Text a Website
- Forms: Email's settings (domain lists, Store in lowercase) and Phone's Lenient and Strict US formats
- Forms: a Date's fixed From and To dates

## [5.9.0] - 2026-10-27

### Added

- Forms editor: Change styling, at the top of the preview, opens the styling panel at any point, and clicking a part of the preview or its row in the panel styles it
- Forms: the title and field labels are styled separately, each with its own font, color, size, and bold, and the title can be centered
- Forms editor: every color swatch offers the colors already set in the form, named by what uses them, with New color for the system picker
- Forms: the submit button's text color can be set, and unset it's chosen for contrast with the button

### Changed

- Forms editor: the styling panel's rows are one-line settings, with word-processor toolbars for Title, Labels, and Text and a name on each control on hover
- Forms: title, label, and text sizes are pixels picked from a short list, and forms that never set them now use 28px titles, 18px labels, and 16px text, so fields don't zoom in when tapped on an iPhone
- Forms: corners are presets (Square, Slight, Round, Rounder), spacing is Compact, Normal, or Roomy, and the button is Full width or fit to its text at the left, center, or right
- Forms: the submit button's text uses the form's text font and size
- Forms: a hosted form's card has the same 4px default corners as its inputs and button
- Every exclusive choice in the app (stats range and chart, forms grid or list, editor viewport, submissions filter) uses one toggle style
- Font pickers name the font in use instead of "Default"

### Removed

- Forms: the title and label case settings, and vertical centering of hosted forms, which now sit at the top of the page

### Fixed

- Forms: help text and form descriptions take the text color instead of a fixed grey or a faded copy of it
- Forms: Square corners stay selected once picked
- Forms: form thumbnails show the form's own typefaces instead of Times or Arial

## [5.8.1] - 2026-10-26

### Fixed

- The browser tab shows the Canopy Sites icon on every page a Canopy Sites account opens and on the Canopy Sites sign-in page
- Help page titles and new-submission emails name Canopy Sites for Canopy Sites accounts

## [5.8.0] - 2026-10-26

### Added

- Site contract 0.4.0: a site's credentials (certifications and NAICS codes) and FAQs are content of their own, which the Editor and Quick Edit change like any other fact, refusing a malformed code or certification number with the reason

## [5.7.1] - 2026-10-26

### Fixed

- The sign-in and password reset pages at the Canopy Sites address, and every page a Canopy Sites account opens, say Canopy Sites in the browser tab

## [5.7.0] - 2026-10-20

### Added

- Site contract 0.3.0: the Editor can mark headings and cards (a section's steps, reasons, values, or questions), each with a title and text

## [5.6.0] - 2026-10-19

### Added

- Sites: Preview opens in its own tab with the site filling the window and Publish, now the only place to publish, in the bar along the bottom, putting live exactly the version shown
- Sites: the Editor and Preview work for any Canopy Sites site with a live address, not only the demo
- Forms editor: while the header and fields are empty, the preview shows a faded sample form, and focusing the title or description marks it in the preview
- Forms editor: fields are added and edited in place in the Fields list, one open at a time, with autosave and the open field outlined in the preview

### Changed

- Sites: Quick Edit and the top bar offer Preview (a new tab) and Discard instead of Publish
- Sites: the demo address shows only the published demo, and drafts are seen in the Editor and on the preview page
- Sites: the site builder runs each site's install and build as a separate user with access to that site's files only

### Fixed

- Forms editor: removing a field's options or input rules removes them instead of keeping the old values

## [5.5.1] - 2026-10-18

### Fixed

- Sites: a Quick Edit change made from an Editor field shows on the page as soon as its preview is ready, with the panel still open and the page where it was
- Sites: after Discard, the Editor and the demo preview show the published site instead of the discarded changes

## [5.5.0] - 2026-10-18

### Added

- Sites: the Editor edits the demo site in place, with marked text, paragraphs, and prices edited on the page with a character count, other fields opening Quick Edit, and back, forward, a page picker, and desktop and phone views
- Sites: the top bar shows unpublished changes with Discard and Publish, whichever tab made them
- Site contract 0.2.0: ids on every list entry, field addresses that survive reordering, field kinds and labels, and site guide limits, with a migration from 0.1
- Sites: the site builder rebuilds each published site at its local midnight, so dated announcements appear and expire on time

### Changed

- Sites: every edit, from the Editor or Quick Edit, goes into one draft per site, where the last change to a field wins, undoing every change drops the draft, and a template change from Canopy carries the draft over
- Sites: site builds use the site's time zone, so what's current follows the site's calendar
- Sites: the builder answers content reads from its own copy of the site instead of fetching from GitHub each time

## [5.4.5] - 2026-10-17

### Changed

- Fonts for the admin UI and the curated font picker lists are self-hosted, so builds no longer depend on reaching Google Fonts
- Forms: embedded and hosted forms load catalog fonts from Canopy instead of Google, and fonts outside the catalog still load from Google

## [5.4.4] - 2026-10-17

### Fixed

- Sites-only pages (Stats, Editor, Quick Edit) show the Canopy Sites title and icon in the browser tab

## [5.4.3] - 2026-10-17

### Changed

- Site contract 0.1.1: link fields accept only the characters a link needs
- Sites: the site builder installs a site's dependencies without running their install scripts, and a repo-scoped token is the only way in, with deploy keys no longer supported

### Fixed

- Sites: the demo's "not published yet" notice carries the same sandbox as every other demo response

## [5.4.2] - 2026-10-16

### Changed

- Canopy Boy stands in the left margin beside Quick Edit on wide screens, and beside the title where there's no room

## [5.4.1] - 2026-10-16

### Changed

- Sites: the Editor and Quick Edit appear at once, with the parts that wait on the site's content filling in behind placeholders
- Canopy Boy moves to the top of Quick Edit, beside the title

## [5.4.0] - 2026-10-16

### Changed

- Sites: Quick Edit has its own tab and is where Canopy Sites customers land after signing in

### Added

- Sites: the Editor previews the coming visual editor on the demo site, outlining the content you'll change in place and the details Canopy keeps locked, without saving anything yet

## [5.3.1] - 2026-10-16

### Changed

- Operator: Reset demo also clears the demo site's change history and Quick Edit conversations

## [5.3.0] - 2026-10-16

Canopy Sites can edit a real site, starting with the sales demo.

### Added

- Sites: Quick Edit takes a change described in plain language and makes a private preview, refusing locked fields and anything that would break the site, and nothing goes live until Publish
- Sites: the Editor lists the site's pages, the change waiting for review with Preview, Publish, and Discard, and recently published changes
- Sites: Stats shows visitors, pageviews, top pages, and referrers for the last 7, 30, or 90 days, with labeled sample data on the demo
- Sites: the demo site at sites.canopyds.com/demo runs on its own account for sales calls and partners
- Operator: build and publish a site from its repository, reset the demo to its starting point, and add a member to an account

## [5.2.1] - 2026-10-16

### Changed

- There are three plans, Free, Unlimited (formerly Paid), and Sites, and the retired Hosting and Unlocked plans' accounts moved to Unlimited with every limit they had
- Promoting a user to Global Admin moves a plan with a form limit to Unlimited
- Comped and sandbox accounts are marked by their billing status and reference instead of a plan

## [5.2.0] - 2026-10-16

Canopy Sites accounts get a real site, and each product gets its own address.

### Added

- Operator: a Sites page creates a site for an account on the Sites plan, one per account, recording its repository, branch, contract version, hostnames, locked fields, Quick Edit overlay, and Umami website
- A Sites plan, Canopy Sites plus unlimited published forms, assigned by operators only
- Sites: the Editor shows the account's site
- A Canopy Sites customer who signs in at forms.canopyds.com gets a Go to Canopy Sites button that signs them in there without the password again

### Changed

- Canopy Forms customers use forms.canopyds.com and Canopy Sites customers sites.canopyds.com, signup is at the Forms address, and anyone at the other product's address is sent to their own
- Unlocked no longer includes Canopy Sites, and promoting a user to Global Admin, in the console or through `ADMIN_EMAIL` at startup, moves them to Unlocked only from a plan with a form limit
- An account that has a website can't be deleted, by its owner or an operator, until its site moves to another account, and can't move to a plan without Sites

## [5.1.0] - 2026-10-16

Accounts and sign-in are rebuilt for Canopy Sites. Everyone is signed out once by this release and signs in again as usual.

### Added

- Memberships: people reach their account as its owner or a member, and every existing user became their account's owner
- Operator: accounts have a billing status (Active, Past due, Cancelled) and a billing reference, set with a Billing action on the accounts page
- Sign-in for an email address pauses for 15 minutes after five failures, and signup, password reset requests, and password changes are limited the same way
- Security headers: HSTS, no MIME sniffing, a strict referrer policy, and no framing of the sign-in, admin, and operator pages

### Changed

- Sessions are stored server-side in place of NextAuth, so signing out, changing or resetting a password, and deleting an account end sessions everywhere at once, and an active session stays signed in instead of ending 4 hours after sign-in
- Changing your password keeps you signed in on that browser and signs you out everywhere else
- Passwords are hashed with scrypt, upgrading on the next sign-in, and are 8 to 128 characters
- Only the newest password reset link works, each works once, and a reset signs you out on every device
- Role changes take effect on the user's next page load instead of their next sign-in
- `NEXTAUTH_SECRET` and `AUTH_TRUST_HOST` are no longer used

### Fixed

- An expired session no longer leaves the login page bouncing between the login and forms pages
- Rate limits use the client address Cloudflare reports instead of a header the client could set
- Rate limit windows longer than five minutes are no longer cut to five
- Deleting a user no longer deletes the forms they created, which stay with the account
- Operator: the accounts page loads in a fixed number of queries however many accounts there are

## [5.0.0] - 2026-10-15

One codebase now serves Canopy Forms and the Canopy Sites client portal, and Forms-only accounts see no change on either hostname.

### Added

- Sites: accounts with Canopy Sites get the Canopy Sites wordmark and an Editor, Forms, and Stats nav on any hostname, with the Editor as home and Editor and Stats as placeholders for now
- sites.canopyds.com serves the same app as forms.canopyds.com, with Canopy Sites branding on its login, signup, and password reset pages
- Forms editor: Name fields get a live preview in the field editor, in the form's theme
- Embed: a `fieldsOnly` render option shows the fields without the header, Submit button, or watermark

### Changed

- Deploys: the repository is npm workspaces with the app in `apps/portal/`, now `Canopy-Digital-Services/canopy-sites`, and Docker builds use the repo root as context with `apps/portal/Dockerfile`
- Development: the local containers are renamed `canopy-portal` and `canopy-portal-db`, still on port 3006

### Fixed

- Sites: password reset and submission notification emails to Canopy Sites accounts link to the Sites host and name Canopy Sites, using the new optional `SITES_URL` setting
- Login, signup, and password reset trim and lowercase the email, so a capitalized or autofilled address no longer fails login or skips the reset email
- Signing out or deleting an account from a non-Forms hostname no longer lands on the Forms login page
- An expired session no longer counts as signed in on the home and auth pages

## Before 5.0

Canopy Forms' history from 2.x to 4.14.1 is in git: `git show d7629ee:CHANGELOG.md` prints the full changelog as it stood before these entries were shortened.
