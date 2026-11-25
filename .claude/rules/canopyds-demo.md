---
paths:
  - "apps/portal/src/app/**/editor/**"
  - "apps/portal/src/app/**/quick-edit/**"
  - "apps/portal/src/app/preview/**"
  - "apps/portal/src/components/sites/**"
  - "apps/portal/src/lib/canvas-bridge.ts"
  - "apps/portal/src/lib/quick-edit/examples.ts"
  - "apps/portal/src/lib/sites-tabs.ts"
---

# The editor demo on canopyds.com

canopyds.com/websites carries a working copy of the owner's editing flow (the Editor's canvas, Quick Edit, the one draft, Preview and Publish, a request to Michael) on a made-up bike shop, for visitors who can't reach the real demo (PRD D23) behind a login. It is front-end only and lives in the website repo (`Canopy-Digital-Services/canopy-website`), where `docs/edit-demo.md` says what it copies from which file here. Since 2026-11-24.

The demo must keep matching the product: a page showing something the portal no longer does is a claim the site can't back up.

- A change in these files that an owner can see (wording, a step of the flow, a new kind of field, a new Sites tab) is mirrored in the demo as part of the same work: wording in its `src/lib/editDemo/portal.ts`, behavior in `src/scripts/editDemo.ts`, as its doc's "Keeping it in step" says. When that can't happen in the session, the hand-off says the demo is behind and what changed.
- A change owners can't see (data access, actions, builds, the hold) needs nothing there.
