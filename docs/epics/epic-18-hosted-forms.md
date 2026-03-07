# Epic 18: Hosted Forms

**Version:** v4.8.0
**Date:** 2026-03-04
**Status:** Complete

## Summary

Added hosted form pages at `/f/[formId]` — public URLs that render forms directly on the Canopy domain. Users get a shareable link without needing a website to embed on. Forms must be explicitly published to be accessible via hosted URL.

## Changes

### Schema
- Added `published Boolean @default(false)` to Form model

### Server Actions & Data Access
- `toggleFormPublished(formId, published)` — ownership-checked publish toggle
- `getPublishedForm(formId)` — public query for hosted page rendering
- `formExists(formId)` — distinguishes 404 from unpublished

### Embed Script
- Fixed `handleSubmit` and `fetchDefinition` to use `formDefinition.formId` fallback when `options.formId` is undefined (fixes submissions from admin preview and hosted pages)

### Hosted Form Page (`/f/[formId]`)
- Server component with `generateMetadata` for OpenGraph tags
- Published forms render via embed script (reuses existing renderer)
- Unpublished forms show branded "Form Not Available" page (200 status)
- Invalid IDs return 404
- "Powered by Canopy Forms" footer branding

### Editor Integration
- Publish/Unpublish toggle button in editor header bar
- Integrate panel shows hosted URL card when published
- Toast notifications on publish state change

## Design Decisions
- `published` gates hosted URL only — embed API continues to work regardless
- Publish is a deliberate action, not part of auto-save
- Unpublished forms return 200 (not 404) to prevent search engines from caching a 404 for temporarily unpublished forms
- Reuses embed script rendering — no duplicate form rendering logic
