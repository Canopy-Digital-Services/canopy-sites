---
paths:
  - "apps/portal/content/**"
---

# The in-app help

`apps/portal/content/docs/*.md` is user-facing help served at `/docs`. Registered in `content/docs/meta.ts`, where a group marked `sites` is shown, and its pages open, only for accounts with Canopy Sites (`docsNavFor` in `src/lib/docs.ts`): a page about a website goes in such a group, never in one every Forms account sees.

It is written for owners: plain steps, the portal's own labels, no internals.
