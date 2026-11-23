# Epic 53: People on an account

**Status:** Complete in 5.21.0 (2026-11-17). Acceptance in section 5, checked on the local portal and by test; the production check is the progress log's last entry.
**Phase:** 8, Launch readiness (`docs/canopy-sites/ROADMAP.md`)
**Predecessor:** Epic 38 (link and claim), whose claim link every person uses
**Successor:** Epic 54 (one editor at a time), which needs a second person to exist

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/ACCOUNT_OPERATIONS.md` (this epic changes who is on an account and how they leave it) and `docs/canopy-sites/PRD.md` (D11, D49, D63).

---

## 1. Goal

The Client 3 site belongs to an organization, and more than one of its people will update it. Michael adds each of them to the site's account from the operator console, by name and email, and each sets a password from a claim link and signs in as themselves. When someone leaves the organization, Michael removes them and they are signed out.

## 2. Scope

### In

- **Names (4.1)**: a name per person, typed by the operator.
- **The account's people on the operator's site page (4.2)**: list, add, claim links, remove.
- **Docs (4.3)**.

### Out

| Not here | Why / where |
|---|---|
| An owner adding their own people | The invite flow, after v1 (PRD D63). It would also send mail from client input, on a sender with a small daily ceiling (REVIEW_FINDINGS F32) |
| Roles beyond owner and member (who may publish) | After v1 (PRD D63). Today a member does everything but close the account |
| A person on two accounts, an account switcher | `getSoleMembership` still throws for a second membership |
| A person changing their own name | Small, and not needed for the Client 3 site: the operator types it |
| Two people editing at once | Epic 54 |

## 3. Order

4.1 first (one migration), then 4.2, then 4.3 with each change it documents.

## 4. Requirements

### 4.1 Names

Checked against `prisma/schema.prisma` on 2026-11-14: a `User` has an email and no name, and a published commit's author name is the email's local part (`publishPreview` in `src/actions/site-editor.ts`).

- `User.name`, optional. `personName(user)` (`src/lib/person.ts`) is the one place that decides what a person is called to other people: the name, else the email.
- Link a site takes the owner's name, and adding a person takes theirs. Both optional: the email stands in.
- The operator renames anyone on the account from the site page.
- A published commit is authored under the name when there is one.

### 4.2 The account's people

The site page's Owner card becomes People: one row per person on the site's account, owner first.

- Each row: name, email, Owner where they are, and where they stand (claimed and when, or the newest claim link and how it went out), with their last sign-in.
- **Add a person**: name and email, a new email only (a person belongs to one account). They get no password and a claim link, shown once to copy, as `addAccountMember` does today.
- **Claim link** for anyone who hasn't claimed: copied, or emailed by the portal. `sendClaimLink` takes the person, and refuses anyone who isn't on the site's account.
- **Rename**.
- **Remove**, for anyone but the owner, behind a confirmation: the membership goes, and the user with it when it was their only one, which ends their sessions and frees whatever they held. What they published keeps its record without their name. The operator can't remove themselves.
- Act as client stays on the card.
- Every action is Global Admin only, refuses an id from another account, and has a database test.

Operator → Accounts keeps the same Add person dialog, for accounts with no site.

### 4.3 Docs

- `docs/AGENT_CONTEXT.md` (Auth and ownership, appendix) and `docs/ACCOUNT_OPERATIONS.md`: an account takes several people; adding, claim links, removing.
- The Sites Onboarding Runbook in Nextcloud, section 6: adding the client's other people before the claim links go out.

## 5. Acceptance

- [x] On a site's operator page, a second person is added with a name, appears in People as not yet claimed, and their claim link sets a password (the card in headless Chromium on the local portal, and Michael adding one himself on 2026-11-15; the claim in `claim.db.test.ts`)
- [x] Signed in, that person sees the site's Quick Edit, Editor, Stats, and Forms, and a publish is recorded under their name (the two-person runs on the local demo site; the publisher in `site-tools.db.test.ts`)
- [x] A claim link can be copied or emailed again for anyone who hasn't claimed, and never for someone who has (`claim.db.test.ts`; Copy claim link in the browser)
- [x] Removing a person signs them out at their next request, and their email no longer signs in (`members.db.test.ts`: the login and its sessions are deleted)
- [x] The owner can't be removed, and an action naming a person from another account is refused (`members.db.test.ts`, `claim.db.test.ts`)
- [x] `npm run build`, `npm run lint`, and `npm test` pass

## 6. Progress

- 2026-11-14: 4.1 and 4.2 built on `dev`. `User.name` is migration `user_name`. The People card is `src/app/operator/sites/[siteId]/people-card.tsx`, with `add-person-button.tsx` shared by the Accounts page; the actions are in `src/actions/admin/members.ts` and `claims.ts`, tested in `members.db.test.ts` and `claim.db.test.ts`. Left: Michael's check of the card, and the Onboarding Runbook's section 6 once this is released (it describes production).
- 2026-11-17: the owners' help now says who can sign in and how people are added and removed (`content/docs/editing-together.md` and a section in `account.md`, Epic 54's 4.5).
- 2026-11-17: Released in 5.21.0 (PR #63, `05f1304`). The release smoke passed on forms-dev and sites-dev at `c0f47a3`, with two checks added for this release: a Forms account's help has no website pages, and a Sites account's has "Editing with other people". Production: the portal's deploy finished and applied the release's seven migrations, the builder redeployed, and the login pages and `/demo` answer. Not checked in production: anything signed in. No production account has a second person yet, so two people editing there is still to see; the Client 3 site's people will be the first. The Sites Onboarding Runbook in Nextcloud now covers it: section 6, step 5, and Link a site's name field in section 4.
- 2026-11-23: Checked in production on the the test site site, with Epic 54's check. A person added on the People card with a name and a test address showed as Not claimed, and the dialog held their claim link. Opened signed out in a second browser, the link set a password and landed in Quick Edit, with Quick Edit, Editor, Forms and Stats in the nav; People then read Claimed. Remove asked "Remove Test Person" ("They're signed out and can't sign in again."), took them off People, and freed the site they were holding, open to the operator 15 seconds after Confirm; their next page load was the sign-in page. Not checked: emailing a claim link, and a publish under the second person's name. Seen: their avatar's initials come from the email, not the name.
