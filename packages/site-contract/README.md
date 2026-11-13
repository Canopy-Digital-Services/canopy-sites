# @canopy/site-contract

The content contract for Canopy Sites (PRD section 4.4): Zod schemas for every collection a site may have, shared by the portal (validating ChangeSets), the builder (`validateSite` before `astro build`), and each site repo (parsing its content at build time).

- `@canopy/site-contract`: schemas and types, `collections` (name → file and schema), `validateContent` (optionally with a site guide's limits, counts, and refused phrases), `applyChanges` (the ChangeSet op format), `laneViolations` (below), `jsonSchemaFor`, `activeAnnouncements`, `serviceIndex` and `serviceAddresses`; addresses (`resolveAddress`, `fieldInfo`, `field`); `parseSiteGuide` and `avoidWarnings`; `migrateContent`.
- `@canopy/site-contract/node`: `readContent`, `writeContent`, `validateSite(dir)`, `readSiteGuide(dir)`, `migrateSite(dir, fromVersion)`.

A site keeps one JSON document per collection at `src/content/<collection>.json` and the images they name under `src/assets/`. The collections are `site`, `pages`, `services`, `reviews`, `faqs`, `gallery`, `announcements`, `classes` (each with its weekly sessions), and `team`; a site has the ones it renders. `site.hours` is optional (from 0.6.0): an organization that keeps no hours states none. Strings are one line of plain text: markup, markdown, and line breaks are rejected. Every list of objects has ids, unique within the list (service ids across the whole menu).

**The lane** (PRD D50): `laneViolations(before, after, { locked, fixed })` lists every way an owner's edit leaves it. Fields flagged `canopy` in their metadata (ids, page paths, navigation labels, SEO fields, eyebrows, buttons) keep their values; locks are address patterns (`site/contact/phone`, `*` for any one segment), each covering everything under it; fixed lists (`pages` and every page's `sections` always, plus a site's own) keep their entries. `lockedFieldViolations`, with dotted paths, is deprecated until the portal moves off it.

**Site guide front matter** (PRD D40): `limits` and `counts` (address pattern to a number), `formats`, and the lists `avoid` (named checks `em-dash`, `emoji`, `all-caps`, `exclamations`, or phrases) and `refuse` (phrases). A phrase matches whole words, ignoring case, and a trailing `*` matches any ending. The full syntax is in `src/guide.ts`. Limits, counts, and refused phrases are content issues; what the copy avoids is `avoidWarnings`, reported only in text an edit changed.

**Addresses** (PRD D36) name a value by collection, then each list entry's id and each object key: `services/haircuts/services/haircut/priceLabel`. Ops come in two forms: a JSON Patch op on one collection (`{ collection, op, path }`), or an address op (`{ op, address, value?, before? }`) resolved when it applies, so it survives reordering. Templates mark each editable value for the visual editor with `field(address)`, spread onto the element that renders it, and each field's kind and label come from `fieldInfo(address)`.

## Upgrading a site to a new contract version

Install the new tarball (below), then migrate the content in the same commit; a version that changes the shape of content fails the site's build until it is migrated:

```bash
node --input-type=module -e "import('@canopy/site-contract/node').then(m => m.migrateSite('.', '<old version>')).then(console.log)"
```

The portal and builder validate with the newest contract, so a shape-changing release goes out with every site's upgrade commit, not before.

## Releasing (PRD D26)

Bump `version` here and `CONTRACT_VERSION` in `src/index.ts` (a test checks they match), then from this directory:

```bash
npm pack
gh release create site-contract-v<version> canopy-site-contract-<version>.tgz --repo Canopy-Digital-Services/canopy-sites --title "site-contract v<version>" --notes "<what changed>"
```

Site repos install the release asset by URL: `npm install https://github.com/Canopy-Digital-Services/canopy-sites/releases/download/site-contract-v<version>/canopy-site-contract-<version>.tgz`.
