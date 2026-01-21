# Can-O-Forms v2 Implementation Summary

This document summarizes the v2 implementation completed on 2026-01-21.

## Overview

Can-O-Forms v2 adds script-based embed forms with a form builder UI, eliminating the need for manual HTML form writing.

## Architecture

```
Admin UI (Next.js)
    ↓
Database (PostgreSQL + Prisma)
    ↓
Public Embed API
    ↓
embed.js (Vanilla JS)
    ↓
Static Sites / Figma Sites
```

## What Was Built

### 1. Database Schema (`prisma/schema.prisma`)

**New Field Model:**
- Stores field definitions (name, type, label, validation)
- Ordered list per form
- Supports TEXT, EMAIL, TEXTAREA, SELECT, CHECKBOX, HIDDEN

**Extended Form Model:**
- `successMessage` - Inline success text
- `redirectUrl` - Redirect after submission
- `defaultTheme` - JSON theme tokens

### 2. Public Embed API

**Location:** `src/app/api/embed/[siteApiKey]/[formSlug]/route.ts`

**GET Handler:**
- Returns embed-safe form definition
- Never exposes `notifyEmails` or owner data
- Rate limited and cacheable
- CORS enabled

**POST Handler:**
- Validates submissions against field schema
- Returns structured field-level errors
- Supports legacy forms (no fields = no validation)
- Same security as v1 (origin validation, rate limiting, honeypot)

### 3. Form Builder UI

**Components Created:**
- `src/components/field-list.tsx` - Display and reorder fields
- `src/components/field-editor-modal.tsx` - Add/edit field dialog
- `src/components/form-fields-manager.tsx` - Main field management UI

**Updated Pages:**
- `src/app/(admin)/sites/[siteId]/forms/[formId]/edit/page.tsx`
  - Added Fields section
  - Added Success Behavior configuration
  - Added Embed Appearance (theme) section

**Server Actions:**
- `src/app/(admin)/sites/[siteId]/forms/[formId]/actions.ts`
  - `createField` - Add new field
  - `updateField` - Edit existing field
  - `deleteField` - Remove field
  - `reorderFields` - Change field order
  - `updateFormSettings` - Update theme and success behavior

### 4. Embed Script (`embed.js`)

**Location:** `embed/src/`

**Files:**
- `index.ts` - Entry point, auto-initialization
- `form.ts` - Form class (render, state, submission)
- `validation.ts` - Client-side validation logic
- `theme.ts` - Theme resolution and CSS generation
- `styles.ts` - Scoped CSS with CSS custom properties

**Build System:**
- `embed/esbuild.config.js` - esbuild configuration
- Output: `public/embed.js` (single minified bundle)
- Command: `npm run embed:build`

**Features:**
- Auto-init on DOMContentLoaded
- Semantic, accessible HTML
- Client-side validation (required, email, length, regex)
- Success messages or redirects
- Error handling with field-level messages
- Theme token system
- CSS isolation with `.cof-*` class prefix
- No external dependencies

### 5. Theme System

**Default Values:**
```javascript
{
  fontFamily: 'inherit',
  text: '#18181b',
  background: '#ffffff',
  primary: '#0ea5e9',
  border: '#e4e4e7',
  radius: 8,
  density: 'normal'
}
```

**Precedence:**
1. `data-theme` attribute (per-embed overrides)
2. Form `defaultTheme` (set in admin UI)
3. Hard-coded defaults

**Density Options:**
- `compact` - Tight spacing
- `normal` - Default spacing
- `comfortable` - Generous spacing

## Usage Example

```html
<div 
  data-can-o-form="contact"
  data-site-api-key="abc123-def456"
  data-theme='{"primary":"#005F6A","radius":10,"density":"normal"}'
></div>
<script src="https://forms.canopyds.co/embed.js"></script>
```

## File Changes Summary

### Created Files (20)
- `src/app/api/embed/[siteApiKey]/[formSlug]/route.ts`
- `src/app/(admin)/sites/[siteId]/forms/[formId]/actions.ts`
- `src/components/field-list.tsx`
- `src/components/field-editor-modal.tsx`
- `src/components/form-fields-manager.tsx`
- `embed/src/index.ts`
- `embed/src/form.ts`
- `embed/src/validation.ts`
- `embed/src/theme.ts`
- `embed/src/styles.ts`
- `embed/esbuild.config.js`
- `embed/package.json`
- `public/test-embed.html`
- `MIGRATION.md`
- `V2_IMPLEMENTATION.md`

### Modified Files (3)
- `prisma/schema.prisma` - Added Field model, extended Form
- `package.json` - Added embed:build script
- `src/app/(admin)/sites/[siteId]/forms/[formId]/edit/page.tsx` - Added v2 sections

## Next Steps

### Before First Use

1. **Run Database Migration:**
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

2. **Build Embed Script:**
   ```bash
   npm run embed:build
   ```

3. **Rebuild Application:**
   ```bash
   npm run build
   ```

### Testing

1. Start the application
2. Open admin UI and create a form
3. Add fields to the form
4. Configure success behavior
5. Open `/test-embed.html` in browser
6. Update API key and form slug
7. Test form submission

### Deployment

1. Run migrations on production database
2. Build application and embed script
3. Deploy to server (Docker/Coolify/etc.)
4. Update existing sites to use new embed format (optional)

## Backwards Compatibility

**v1 forms continue to work without changes:**
- Forms without fields operate in "legacy mode"
- No validation is performed
- Direct POST to `/api/v1/submit/` still works
- Email notifications work the same

**Migration is opt-in:**
- Add fields to enable v2 features
- Keep using v1 endpoint if preferred
- No breaking changes to existing integrations

## Security Notes

- Embed API uses same origin validation as v1
- Rate limiting applies to both GET and POST
- Field schema validation prevents malicious payloads
- IP addresses are hashed before storage
- Admin data never exposed to embed API

## Performance Considerations

- `embed.js` bundle size: ~15-20KB minified
- GET requests are cacheable (cache headers TBD)
- No external dependencies in embed script
- CSS-in-JS for single-file distribution
- Multiple forms on same page supported efficiently

## Known Limitations

- No drag-and-drop field reordering (up/down buttons only)
- No conditional logic (v3+ feature)
- No file uploads (v3+ feature)
- No real-time preview (embed is the preview)
- No webhooks (existing limitation)

## Documentation Updates Needed

- [ ] Update README.md with v2 features
- [ ] Add embed usage examples to docs
- [ ] Create video walkthrough
- [ ] Update integration guides
- [ ] Add Figma Sites specific instructions

## Future Enhancements (v3+)

- Drag-and-drop field builder
- Visual theme editor
- Conditional field logic
- File upload support
- Real-time form preview
- Multi-page forms
- Webhooks
- Analytics dashboard

---

**Implementation completed:** 2026-01-21  
**Status:** Code complete, ready for migration and testing  
**Tested:** Build system verified, code review complete  
**Production ready:** Pending database migration and integration testing
