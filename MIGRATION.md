# Can-O-Forms v2 Migration Guide

This guide covers migrating from Can-O-Forms v1 to v2 with the new embed system.

## What's New in v2

- **Field Builder**: Define form fields in the admin UI with validation
- **Script Embed**: Single `<script>` tag form rendering (no manual HTML)
- **Theme System**: Customize colors, fonts, and spacing
- **Success Behavior**: Configure inline messages or redirects
- **Public Embed API**: Separate endpoints for form definitions and submissions

## Database Migration

### Prerequisites

- Backup your database before migrating
- Ensure PostgreSQL server is running
- Node.js 20+ installed

### Step 1: Update Code

```bash
git pull origin main  # or your v2 branch
npm install
```

### Step 2: Run Migration

```bash
npm run db:migrate
```

This creates:
- `fields` table with field definitions
- `FieldType` enum (TEXT, EMAIL, TEXTAREA, SELECT, CHECKBOX, HIDDEN)
- New columns on `forms` table: `successMessage`, `redirectUrl`, `defaultTheme`

### Step 3: Regenerate Prisma Client

```bash
npm run db:generate
```

### Step 4: Rebuild Application

```bash
npm run build
npm run embed:build  # Build the embed.js script
```

## Backwards Compatibility

**v1 forms continue to work** without migration. Forms without field definitions operate in "legacy mode":
- Accept any JSON payload
- No server-side validation
- Direct POST to `/api/v1/submit/{apiKey}/{slug}` still works

To enable v2 features for a form:
1. Navigate to the form in admin UI
2. Add fields using the new "Fields" section
3. Configure success behavior
4. (Optional) Set theme defaults

## Migrating Your Static Sites

### Old Way (v1)

```html
<form id="contact">
  <input type="text" name="name" required>
  <input type="email" name="email" required>
  <textarea name="message" required></textarea>
  <button type="submit">Send</button>
</form>

<script>
document.getElementById('contact').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  await fetch('https://forms.canopyds.co/api/v1/submit/API_KEY/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
});
</script>
```

### New Way (v2)

```html
<div 
  data-can-o-form="contact"
  data-site-api-key="YOUR_API_KEY"
  data-theme='{"primary":"#0ea5e9","radius":8}'
></div>
<script src="https://forms.canopyds.co/embed.js"></script>
```

**Benefits:**
- No manual HTML form writing
- Built-in validation
- Better UX (loading states, error messages)
- Consistent styling
- Success message handling

## Theme Configuration

### Form-Level Defaults

Set default theme in the admin UI under "Embed Appearance":
```json
{
  "fontFamily": "Inter, system-ui",
  "primary": "#005F6A",
  "radius": 10,
  "density": "normal"
}
```

### Per-Embed Overrides

Override theme per embed using `data-theme`:
```html
<div 
  data-can-o-form="contact"
  data-site-api-key="YOUR_API_KEY"
  data-theme='{"primary":"#ef4444","density":"compact"}'
></div>
```

### Theme Precedence

1. `data-theme` attribute (highest priority)
2. Form's `defaultTheme` in database
3. Hard-coded defaults in embed.js

## API Changes

### New Endpoints

**GET** `/api/embed/{siteApiKey}/{formSlug}`
- Returns embed-safe form definition
- Includes fields, validation, theme defaults
- Rate limited, cacheable
- Never exposes admin data

**POST** `/api/embed/{siteApiKey}/{formSlug}`
- Validates submission against field schema
- Returns field-level errors
- Supports legacy forms (no validation if no fields)

### Existing Endpoint (Still Works)

**POST** `/api/v1/submit/{siteApiKey}/{formSlug}`
- Legacy endpoint continues to work
- No validation performed
- Use for backward compatibility

## Field Types Reference

| Type | HTML Element | Validation |
|------|-------------|------------|
| TEXT | `<input type="text">` | min/max length, regex |
| EMAIL | `<input type="email">` | email format |
| TEXTAREA | `<textarea>` | min/max length |
| SELECT | `<select>` | Must match options |
| CHECKBOX | `<input type="checkbox">` | Boolean |
| HIDDEN | `<input type="hidden">` | No validation |

## Deployment Checklist

- [ ] Database backed up
- [ ] Migration run successfully
- [ ] Prisma client regenerated
- [ ] Application rebuilt
- [ ] Embed script built (`npm run embed:build`)
- [ ] `public/embed.js` deployed
- [ ] Test form submissions on staging
- [ ] Update documentation/integration guides
- [ ] Monitor for errors after deployment

## Rollback Plan

If issues arise:

1. **Database**: Restore from backup
2. **Code**: Revert to v1 git commit
3. **Dependencies**: `npm ci` to restore v1 packages

## Testing Checklist

- [ ] Create test form with fields
- [ ] Test embed on static HTML page
- [ ] Verify validation works (required fields, email format)
- [ ] Test success message display
- [ ] Test redirect URL (if configured)
- [ ] Test theme customization
- [ ] Test multiple forms on same page
- [ ] Verify email notifications still work
- [ ] Test spam detection (honeypot)
- [ ] Check rate limiting
- [ ] Verify origin validation

## Support

For issues during migration:
- Check application logs: `docker logs can-o-forms`
- Review database logs: `docker logs can-o-forms-db`
- Test embed in browser console for errors
- Verify API endpoints return expected data

## Example Field Configuration

```javascript
// Text field with validation
{
  name: "name",
  type: "TEXT",
  label: "Your Name",
  required: true,
  validation: {
    minLength: 2,
    maxLength: 100,
    message: "Name must be 2-100 characters"
  }
}

// Email field
{
  name: "email",
  type: "EMAIL",
  label: "Email Address",
  required: true
}

// Select field
{
  name: "interest",
  type: "SELECT",
  label: "How can we help?",
  required: false,
  options: [
    { value: "sales", label: "Sales Inquiry" },
    { value: "support", label: "Technical Support" },
    { value: "other", label: "Other" }
  ]
}
```
