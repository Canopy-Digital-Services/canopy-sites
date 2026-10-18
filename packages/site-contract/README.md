# @canopy/site-contract

The content contract for Canopy Sites (PRD section 4.4): Zod schemas for every collection a site may have, shared by the portal (validating ChangeSets), the builder (`validateSite` before `astro build`), and each site repo (parsing its content at build time).

- `@canopy/site-contract`: schemas and types, `collections` (name → file and schema), `validateContent` (optionally with a site guide's limits), `applyChanges` (the ChangeSet op format), `lockedFieldViolations`, `jsonSchemaFor`, `activeAnnouncements`, `serviceIndex` and `serviceAddresses`; addresses (`resolveAddress`, `fieldInfo`, `field`); `parseSiteGuide`; `migrateContent`.
- `@canopy/site-contract/node`: `readContent`, `writeContent`, `validateSite(dir)`, `readSiteGuide(dir)`, `migrateSite(dir, fromVersion)`.

A site keeps one JSON document per collection at `src/content/<collection>.json` and the images they name under `src/assets/`. Strings are plain text: markup is rejected. Every list of objects has ids, unique within the list (service ids across the whole menu).

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
