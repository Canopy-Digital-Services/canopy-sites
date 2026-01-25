# Epic 5: Submission Review & Export

**Version:** v2.6.0  
**Date:** 2026-01-24  
**Status:** ✅ Complete

## Overview

Epic 5 added JSON export support to the existing submissions management system. The epic was mostly complete at the start, requiring only the addition of JSON export functionality and a UI update to select between export formats.

## Goal

Allow authenticated users to view submissions per form in the UI and export submissions as CSV or JSON.

## Implementation Summary

### Pre-Existing Features (v2.0.0 - v2.5.0)

The following features were already implemented and working:

- **Submissions list UI** at `/forms/[formId]/submissions`
  - Newest-first ordering (`orderBy: { createdAt: "desc" }`)
  - 50-item pagination limit
  - Status and spam filtering
  - Preview of submission data
  - Links to detailed submission view
- **Submission detail view** at `/forms/[formId]/submissions/[submissionId]`
  - Full form data display
  - Metadata display (IP hash, user agent, referrer, origin)
  - Status management actions (Mark as Read/Archived/New)
  - Spam toggle
- **CSV export** at `/forms/[formId]/submissions/export`
  - Dynamic column headers based on form fields
  - Proper CSV escaping and quoting
  - Account-scoped access control

### New Features (v2.6.0)

1. **JSON Export Support**
   - Added `?format=json` query parameter to export route
   - Returns array of submission objects with stable structure
   - Proper content-type headers and filename generation

2. **Export Format Selector UI**
   - Replaced single "Export CSV" button with dropdown menu
   - Options: "Export CSV" and "Export JSON"
   - Uses existing `DropdownMenu` component

## Technical Decisions

### Export Route Design

**Decision:** Use query parameter `?format` instead of separate endpoints

**Rationale:**
- Single route maintains consistency
- Shared authentication and validation logic
- Easier to maintain and test
- Clear intent from URL

**Implementation:**
```typescript
const format = searchParams.get("format") || "csv";

if (format === "json") {
  // JSON export logic
} else {
  // CSV export logic (default)
}
```

### JSON Structure

**Decision:** Use stable, flat structure with explicit meta fields

**Structure:**
```json
{
  "id": "clx...",
  "createdAt": "2026-01-24T17:00:00.000Z",
  "status": "NEW",
  "isSpam": false,
  "data": { /* raw submission data */ },
  "meta": {
    "ipHash": "sha256...",
    "userAgent": "Mozilla/5.0...",
    "referrer": "https://...",
    "origin": "https://..."
  }
}
```

**Rationale:**
- Matches database schema directly
- ISO 8601 timestamps for universal compatibility
- Explicit null values for missing meta fields
- No nested flattening needed
- Easy to parse in any language

### UI Pattern

**Decision:** Use dropdown menu instead of multiple buttons

**Rationale:**
- Cleaner UI with less horizontal space
- Scalable if more export formats are added
- Follows common UX patterns
- Consistent with existing admin UI patterns

## Files Changed

### Modified Files

1. **`src/app/(admin)/forms/[formId]/submissions/export/route.ts`**
   - Added format detection from query parameter
   - Implemented JSON export logic
   - Refactored to share submission fetching
   - Updated error logging to be format-agnostic

2. **`src/app/(admin)/forms/[formId]/submissions/page.tsx`**
   - Added `DropdownMenu` imports
   - Replaced single button with dropdown menu
   - Added ChevronDown icon
   - Two menu items linking to format-specific URLs

### No Schema Changes

No database migrations were required for this epic.

## Security Considerations

### Account Scoping

Both export formats use identical authentication flow:

1. `getCurrentAccountId()` - Enforces authentication, redirects to login if not authenticated
2. `getOwnedForm(formId, accountId)` - Verifies form ownership via direct `accountId` check
3. Returns 404 if form not found or access denied

**Why this is safe:**
- Form ownership is verified before any data is fetched
- Submissions query uses `formId` which is already validated to belong to authenticated account
- No way to access submissions from forms owned by other accounts

### No PII in Exports

Consistent with existing platform privacy approach:
- IP addresses are hashed (SHA-256) before storage
- Raw IP addresses never stored or exported
- User agents, referrers, and origins included for debugging but are standard HTTP headers

## Testing & Verification

### Manual Testing Performed

1. **CSV Export** (existing functionality)
   - ✅ Exported submissions for test form
   - ✅ Verified column headers match form fields
   - ✅ Verified proper CSV escaping
   - ✅ Downloaded file named correctly with date

2. **JSON Export** (new functionality)
   - ✅ Exported submissions for test form
   - ✅ Verified valid JSON structure
   - ✅ Verified all submissions included
   - ✅ Verified meta fields present and correct
   - ✅ Downloaded file named correctly with date

3. **Account Scoping** (security)
   - ✅ Cannot access export route without authentication (redirects to login)
   - ✅ Cannot export submissions for forms owned by other accounts (404)
   - ✅ Can successfully export own form submissions

4. **UI Behavior**
   - ✅ Dropdown renders correctly with both options
   - ✅ CSV export link includes `?format=csv`
   - ✅ JSON export link includes `?format=json`
   - ✅ Dropdown works on mobile and desktop viewports

### Build Verification

- ✅ No linter errors
- ✅ TypeScript compilation successful
- ✅ Docker build completed in ~90 seconds
- ✅ Application started successfully on port 3000

## Code Quality

### Following Existing Patterns

All changes followed established project patterns:

- **Server components** for data fetching
- **Direct account scoping** via `getCurrentAccountId()`
- **Data access helpers** (`getOwnedForm()`) for ownership verification
- **shadcn/ui components** for UI elements
- **Consistent error handling** with appropriate HTTP status codes

### No New Dependencies

- Used existing `DropdownMenu` component from shadcn/ui
- Used existing `ChevronDown` icon from lucide-react
- No new npm packages added

## Future Considerations

### Potential Enhancements (Out of Scope for Epic 5)

1. **Additional Export Formats**
   - Excel/XLSX format
   - XML format
   - TSV format

2. **Export Filtering**
   - Export only filtered submissions (current filters)
   - Date range selection
   - Status/spam filtering in export

3. **Export Scheduling**
   - Automated periodic exports
   - Email delivery of exports

4. **Export Options**
   - Column selection
   - Field ordering
   - Include/exclude metadata

### Why These Were Not Implemented

Epic 5 explicitly excluded:
- Search and filtering
- Analytics or charts
- Data transformations

The implementation focused on basic retrieval and export as specified in the epic scope.

## Definition of Done

All acceptance criteria met:

- ✅ Users can view submissions per form (pre-existing)
- ✅ Users can export submissions as CSV (pre-existing, verified unchanged)
- ✅ Users can export submissions as JSON (new)
- ✅ Access is correctly scoped to authenticated account (verified)

## Related Documentation

- [v3 plan.md](../../v3%20plan.md) - Epic 5 specification
- [CHANGELOG.md](../../CHANGELOG.md) - Version history
- [AGENT_CONTEXT.md](../../AGENT_CONTEXT.md) - Project architecture

## Lessons Learned

### What Went Well

1. **Minimal Scope** - Epic was correctly scoped. Most features already existed.
2. **Existing Patterns** - Following established patterns made implementation fast and consistent.
3. **Shared Logic** - Using shared authentication flow prevented code duplication.
4. **Quick Turnaround** - Implementation completed in ~15 minutes of actual work.

### Process Notes

- Reading existing code first prevented reimplementation
- Checking for linter errors before Docker rebuild saved time
- Following the documentation pattern from previous epics ensured consistency

---

**Epic 5: Complete** ✅
