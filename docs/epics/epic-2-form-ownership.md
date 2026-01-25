# Epic 2: Form Ownership & Metadata

**Version:** v2.3.0  
**Completion Date:** January 24, 2026  
**Status:** ✅ Complete

## Overview

Tied existing forms cleanly to the Account model introduced in v3, formalizing minimal form metadata required for ownership and access control. This epic establishes direct account-based ownership without changing existing form or submission functionality.

## Objectives

- Associate each form with an owning `accountId`
- Associate each form with a `createdByUserId`
- Associate each site with an `accountId` for consistency
- Ensure all form access is scoped to the authenticated account
- Maintain all existing form and submission functionality

## Implementation Summary

### What Was Built

1. **Schema Changes** (`prisma/schema.prisma`)
   - Added `accountId` and `createdByUserId` to `Form` model
   - Added `accountId` to `Site` model
   - Added relations from `Account` to `Site[]` and `Form[]`
   - Added relation from `User` to `createdForms` (via "CreatedForms" relation)
   - Created indexes on new foreign key fields

2. **Migration** (`prisma/migrations/20260124164739_epic_2_form_ownership/migration.sql`)
   - Added columns to `sites` and `forms` tables
   - Populated `accountId` fields from existing `User -> Account` relationships
   - Populated `createdByUserId` from site owners (best proxy for historical data)
   - Created indexes and foreign key constraints
   - Applied via manual SQL execution (cat | docker exec pattern)

3. **Auth Utilities** (`src/lib/auth-utils.ts`)
   - Added `getCurrentAccountId()` helper function
   - Fetches accountId from authenticated user record

4. **Data Access Layer** (`src/lib/data-access/forms.ts`)
   - Updated all ownership checks from `site.userId` to `accountId`
   - `getOwnedForm()` now checks `form.accountId`
   - `getOwnedFormMinimal()` now checks `form.accountId`
   - `getUserForms()` now filters by `accountId`
   - `getUserSites()` now filters by `accountId`
   - `getOwnedSite()` now checks `site.accountId`

5. **Server Actions** (`src/actions/forms.ts`)
   - Updated all actions to use `getCurrentAccountId()` instead of `getCurrentUserId()`
   - `createForm()` now sets both `accountId` and `createdByUserId` on new forms
   - All update/delete actions enforce ownership via `accountId`

6. **Admin UI Routes**
   - Updated forms list page (`src/app/(admin)/forms/page.tsx`)
   - Updated form edit page (`src/app/(admin)/forms/[formId]/edit/page.tsx`)
   - Updated submissions pages (`src/app/(admin)/forms/[formId]/submissions/*`)
   - Updated site management page (`src/app/(admin)/settings/sites/page.tsx`)
   - All now use `getCurrentAccountId()` for ownership checks

7. **API Routes**
   - Updated `/api/user/sites` to use `accountId` filtering
   - Public submission APIs remain unchanged (use `apiKey` as before)

## Technical Decisions

### Why Direct Account Relations?

**Chosen approach:**
- Forms have direct `accountId` foreign key to Account
- Sites have direct `accountId` foreign key to Account
- Bypasses the previous `Form -> Site -> User -> Account` chain

**Rationale:**
- Simpler ownership queries (single WHERE clause instead of JOIN)
- Faster access control checks
- Clearer data model for v3's 1:1 User:Account design
- Maintains backward compatibility (Site -> User relation still exists)

### Why Manual SQL Migration?

**Chosen approach:**
- Created migration SQL file manually
- Applied via `cat migration.sql | docker exec -i canoforms-db psql`

**Alternatives considered:**
- **`prisma migrate dev`**: Failed due to missing prisma.config.ts
- **`prisma db push`**: Failed due to missing prisma.config.ts
- **Adding prisma.config.ts**: Caused build errors (defineConfig not exported)

**Rationale:**
- Project is in hybrid Prisma 7 state (uses v7 packages but old generator)
- DATABASE_URL only available in Docker container environment
- Manual SQL is reliable and production-ready
- Provides full control over data migration logic

### Why Track `createdByUserId`?

**Rationale:**
- Epic 2 requirements explicitly call for creator tracking
- Enables future features like "created by" displays
- Historical data uses site owner as proxy (reasonable assumption)
- No breaking changes to existing functionality

## Files Changed

### Created

- [`prisma/migrations/20260124164739_epic_2_form_ownership/migration.sql`](../../prisma/migrations/20260124164739_epic_2_form_ownership/migration.sql)
  - Complete migration SQL with data population

- [`docs/epics/epic-2-form-ownership.md`](epic-2-form-ownership.md)
  - This document

### Modified

- [`prisma/schema.prisma`](../../prisma/schema.prisma)
  - Added accountId to Site and Form
  - Added createdByUserId to Form
  - Added relations to Account and User

- [`src/lib/auth-utils.ts`](../../src/lib/auth-utils.ts)
  - Added `getCurrentAccountId()` helper

- [`src/lib/data-access/forms.ts`](../../src/lib/data-access/forms.ts)
  - Updated all ownership checks to use accountId

- [`src/actions/forms.ts`](../../src/actions/forms.ts)
  - Updated all actions to use getCurrentAccountId()
  - Added accountId/createdByUserId to createForm()

- [`src/app/(admin)/forms/page.tsx`](../../src/app/(admin)/forms/page.tsx)
- [`src/app/(admin)/forms/[formId]/edit/page.tsx`](../../src/app/(admin)/forms/[formId]/edit/page.tsx)
- [`src/app/(admin)/forms/[formId]/submissions/page.tsx`](../../src/app/(admin)/forms/[formId]/submissions/page.tsx)
- [`src/app/(admin)/forms/[formId]/submissions/[submissionId]/page.tsx`](../../src/app/(admin)/forms/[formId]/submissions/[submissionId]/page.tsx)
- [`src/app/(admin)/forms/[formId]/submissions/export/route.ts`](../../src/app/(admin)/forms/[formId]/submissions/export/route.ts)
- [`src/app/(admin)/settings/sites/page.tsx`](../../src/app/(admin)/settings/sites/page.tsx)
  - All updated to use getCurrentAccountId()

- [`src/app/api/user/sites/route.ts`](../../src/app/api/user/sites/route.ts)
  - Updated to use getCurrentAccountId()

- [`docs/tools/prisma-7.md`](../tools/prisma-7.md)
  - Added project-specific migration patterns
  - Documented manual SQL migration approach
  - Added database command reference

- [`package.json`](../../package.json)
  - Bumped version to 2.3.0

## Database Schema

### Before (Epic 1)

```
Account (id)
   └── User (accountId)
         └── Site (userId)
               └── Form (siteId)
```

### After (Epic 2)

```
Account (id)
   ├── User (accountId)
   ├── Site (accountId, userId)  // Dual ownership for transition
   └── Form (accountId, createdByUserId, siteId)
```

**Ownership resolution:**
- **Primary**: `form.accountId` → Account
- **Creator**: `form.createdByUserId` → User
- **Legacy**: `form.siteId` → `site.userId` → User (still valid, not used)

## Verification & Testing

### Automated Checks

- ✅ Migration applied successfully (ALTER TABLE, UPDATE, CREATE INDEX, Foreign Keys)
- ✅ Existing data populated correctly:
  - 1 form with accountId and createdByUserId populated
  - 1 site with accountId populated
- ✅ Docker build successful
- ✅ Application starts without errors
- ✅ No linter errors

### Manual Verification

**Database Schema:**
```sql
-- Forms table structure verified
\d forms
-- Shows: accountId (NOT NULL), createdByUserId (NOT NULL)
-- Foreign keys to accounts and users confirmed

-- Data verification
SELECT id, name, "accountId", "createdByUserId" FROM forms;
-- Result: All forms have valid accountId and createdByUserId

SELECT id, name, "accountId" FROM sites;
-- Result: All sites have valid accountId
```

**Application Functionality:**
- ✅ Container starts successfully
- ✅ Application logs show no errors
- ✅ Database queries execute without errors
- ✅ Ownership checks simplified (no more JOIN through site table)

## Routes Affected

All admin routes now enforce ownership via `accountId`:

| Route | Change |
|-------|--------|
| `/forms` | Uses accountId for form list filtering |
| `/forms/[formId]/edit` | Checks form.accountId for access |
| `/forms/[formId]/submissions` | Checks form.accountId for access |
| `/forms/[formId]/submissions/[id]` | Checks form.accountId for access |
| `/forms/[formId]/submissions/export` | Checks form.accountId for access |
| `/settings/sites` | Filters sites by accountId |
| `/api/user/sites` | Returns sites by accountId |

**Public APIs (unchanged):**
- `/api/embed/[siteApiKey]/[formSlug]` - Still uses apiKey
- `/api/submit/[siteApiKey]/[formSlug]` - Still uses apiKey

## Breaking Changes

**None.** This epic introduces no breaking changes:

- ✅ Existing forms continue to work
- ✅ Existing submissions continue to work
- ✅ Public submission endpoints unchanged
- ✅ All existing functionality preserved
- ✅ Data access patterns simplified internally

## Performance Impact

**Positive:**
- Form ownership checks are now faster (direct accountId check vs JOIN through sites table)
- Fewer table joins in typical queries
- Better index utilization with accountId indexes

**Neutral:**
- Migration added foreign key constraints (standard practice)
- No change to public submission endpoints (still fast)

## Definition of Done

All acceptance criteria met:

- ✅ Every form has `accountId` populated
- ✅ Every form has `createdByUserId` populated
- ✅ Every site has `accountId` populated
- ✅ Users can only view forms owned by their account
- ✅ Users can only edit forms owned by their account
- ✅ Users can only delete forms owned by their account
- ✅ Form creation sets `accountId` and `createdByUserId` automatically
- ✅ Site creation sets `accountId` automatically
- ✅ Existing form/submission functionality unchanged
- ✅ Public submission endpoints continue to work

## Lessons Learned

1. **Hybrid Prisma 7 State**: Project uses Prisma 7 packages but hasn't fully migrated to new patterns. Manual SQL migrations are reliable workaround.

2. **Docker Environment**: DATABASE_URL only available in container. Must use `docker exec` for all database operations.

3. **Manual SQL > Prisma Migrate**: In hybrid setups, manual SQL migrations via psql are more reliable than Prisma's migration tools.

4. **Migration Data Population**: Can safely populate new foreign keys from existing relationships using UPDATE with JOIN.

5. **Ownership Simplification**: Direct foreign keys (form.accountId) are clearer than traversing relations (form → site → user → account).

6. **Documentation Updates**: Updated Prisma 7 docs with project-specific patterns to prevent future confusion.

## Related Documents

- [v3 Plan](../../v3%20plan.md) - Overall v3 product roadmap
- [CHANGELOG.md](../../CHANGELOG.md) - Version history
- [Epic 0: Email Infrastructure](epic-0-email-infrastructure.md) - Email sending foundation
- [Epic 1: Account & Authentication](epic-1-account-and-authentication.md) - Account model introduction
- [Epic Index](README.md) - All epic completion reports
- [Prisma 7 Documentation](../tools/prisma-7.md) - Migration patterns

---

**Next Epic:** [Epic 3: Submission Ingestion (White-Box Support)](../../v3%20plan.md#epic-3--submission-ingestion-white-box-support)
