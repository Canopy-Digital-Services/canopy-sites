# @canopy/site-contract

The content contract for Canopy Sites (PRD section 4.4): Zod schemas for every collection a site may have, shared by the portal (validating ChangeSets), the builder (`validateSite` before `astro build`), and each site repo (parsing its content at build time).

- `@canopy/site-contract`: schemas and types, `collections` (name → file and schema), `validateContent`, `applyChanges` (the ChangeSet op format, JSON Patch per collection), `lockedFieldViolations`, `jsonSchemaFor`, `activeAnnouncements`.
- `@canopy/site-contract/node`: `readContent`, `writeContent`, `validateSite(dir)`.

A site keeps one JSON document per collection at `src/content/<collection>.json` and the images they name under `src/assets/`. Strings are plain text: markup is rejected.

## Releasing (PRD D26)

Bump `version` here and `CONTRACT_VERSION` in `src/index.ts` (a test checks they match), then from this directory:

```bash
npm pack
gh release create site-contract-v<version> canopy-site-contract-<version>.tgz --repo Canopy-Digital-Services/canopy-sites --title "site-contract v<version>" --notes "<what changed>"
```

Site repos install the release asset by URL: `npm install https://github.com/Canopy-Digital-Services/canopy-sites/releases/download/site-contract-v<version>/canopy-site-contract-<version>.tgz`.
