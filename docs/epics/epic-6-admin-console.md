# Epic 6: Admin Console (Operator Only)

**Version:** v3.0.0  
**Date:** 2026-01-24  
**Status:** ✅ Complete

**Note:** This epic completes the v3 platform. All planned v3 features are now implemented.

## Overview

Epic 6 introduces a standalone operator console for platform administration. The console allows the platform operator to view account metadata and delete accounts while maintaining strict privacy boundaries—no form content or submission data is ever exposed.

## Goal

Create a minimal, privacy-respecting admin interface that allows the platform operator to:
- List all accounts with metadata only
- View account statistics (forms count, submissions count)
- Delete accounts using hybrid delete semantics

## Implementation Summary

### 1. Schema Changes

**Added `deletedAt` field to Account model:**

```prisma
model Account {
  id        String    @id @default(cuid())
  createdAt DateTime  @default(now())
  deletedAt DateTime? // Epic 6: tombstone marker for hybrid delete
  
  user      User?
  sites     Site[]
  forms     Form[]
  
  @@map("accounts")
}
```

**Migration:** `20260124175411_epic_6_admin_console/migration.sql`

### 2. Authentication & Authorization

**New helper function** in `src/lib/auth-utils.ts`:

```typescript
export async function requireOperator() {
  const session = await requireAuth();
  
  if (session.user.email !== process.env.ADMIN_EMAIL) {
    redirect("/forms");
  }
  
  return session;
}
```

**Enforcement:**
- `(operator)/layout.tsx` — blocks non-operators from entire console
- Server actions — double-check operator status before destructive operations

**Approach:** Email-based operator identification via `ADMIN_EMAIL` env var. No role field added to User model (keeping schema minimal).

### 3. Data Access Layer

**New file:** `src/lib/data-access/accounts.ts`

**Key functions:**
- `listAccountsMetadata()` — Returns accounts with explicit metadata only
- `getAccountSubmissionsCount()` — Aggregated submission count per account

**Privacy safeguards:**
- Uses explicit `select` statements (cannot accidentally include content)
- Only exposes: id, createdAt, email, lastLoginAt, forms count, submissions count
- Counts computed via Prisma `_count` and `groupBy` (aggregation only)
- Filters out deleted accounts (`where: { deletedAt: null }`)

### 4. Delete Account Action

**New file:** `src/actions/accounts.ts`

**Hybrid delete semantics:**
1. Verify operator status
2. Prevent self-deletion (operator cannot delete own account)
3. Purge all forms and sites (cascade deletes submissions and fields)
4. Clear user password (immediate account disable)
5. Mark account as deleted (tombstone with `deletedAt` timestamp)

**Result:** Account remains in database for audit purposes but is completely inaccessible and contains no user data.

### 5. Operator UI Routes

**New route group:** `src/app/(operator)/`

**Structure:**
```
src/app/(operator)/
  layout.tsx         # Operator-only layout with sidebar
  accounts/
    page.tsx         # List accounts with metadata
    delete-account-button.tsx  # Client component for delete action
```

**Layout features:**
- "Operator Console" branding
- Minimal navigation (Accounts, Sign Out)
- Uses `requireOperator()` guard
- Mirrors existing `(admin)` layout pattern

**Accounts page features:**
- DataTable component with metadata columns
- Delete button per account with confirmation dialog
- Displays: email, created date, last login, forms count, submissions count
- Empty state for zero accounts

### 6. UI Components

**Reused existing patterns:**
- `PageHeader` — page title and description
- `DataTable` — generic table with column configuration
- `ConfirmDialog` — destructive action confirmation
- `Badge` — count display
- `Button` — actions and navigation

**New component:** `delete-account-button.tsx`
- Client component with `useTransition` for loading state
- Calls `deleteAccount()` server action
- Toast notifications for success/error feedback
- Disabled state during deletion

## Technical Decisions

### Operator Identification Strategy

**Decision:** Use email comparison against `ADMIN_EMAIL` env var

**Rationale:**
- No schema changes required (User model stays simple)
- Single operator model (v3 scope: one company, one operator)
- Easy to configure via environment variable
- Explicit and auditable

**Alternatives considered:**
- `isOperator` boolean field — rejected (adds unnecessary schema complexity for single-operator use case)
- Separate operator table — rejected (over-engineered for v3 scope)

### Hybrid Delete Approach

**Decision:** Purge content + retain tombstone

**Implementation:**
```typescript
// 1. Delete all content
await prisma.form.deleteMany({ where: { accountId } });
await prisma.site.deleteMany({ where: { accountId } });

// 2. Clear password (immediate disable)
await prisma.user.update({
  where: { id: account.user!.id },
  data: { password: "" }
});

// 3. Mark deleted (tombstone)
await prisma.account.update({
  where: { id: accountId },
  data: { deletedAt: new Date() }
});
```

**Rationale:**
- Immediate account disable (cleared password)
- Complete content purge (no orphaned data)
- Audit trail (tombstone record with deletion timestamp)
- Prevents accidental account reuse
- Supports future compliance/audit requirements

**Alternatives considered:**
- Hard delete — rejected (no audit trail)
- Soft delete only — rejected (retains user content)

### Submissions Count Query

**Decision:** Batch query with `groupBy` + merge

**Implementation:**
```typescript
const submissionCounts = await prisma.submission.groupBy({
  by: ["formId"],
  _count: true,
  where: { form: { accountId: { in: accountIds } } }
});
// Merge counts into account results
```

**Rationale:**
- Single query for all accounts (avoids N+1)
- Aggregation only (no content loaded)
- Efficient for multiple accounts

**Alternatives considered:**
- Per-account queries — rejected (N+1 problem)
- Raw SQL — rejected (Prisma type safety preferred)

### Route Group Naming

**Decision:** Use `(operator)` instead of `(admin)`

**Rationale:**
- Clear semantic distinction from user-facing admin UI
- Aligns with "platform operator" terminology in Epic 6 spec
- Prevents confusion with existing `(admin)` route group (user dashboard)

## Files Created/Modified

### Created Files
- `prisma/migrations/20260124175411_epic_6_admin_console/migration.sql`
- `src/lib/data-access/accounts.ts`
- `src/actions/accounts.ts`
- `src/app/(operator)/layout.tsx`
- `src/app/(operator)/accounts/page.tsx`
- `src/app/(operator)/accounts/delete-account-button.tsx`

### Modified Files
- `prisma/schema.prisma` — Added `deletedAt` to Account model
- `src/lib/auth-utils.ts` — Added `requireOperator()` function

## Privacy & Security Compliance

### Privacy Safeguards Implemented

✅ **Metadata-only queries**
- Explicit `select` statements in all data access functions
- No form field definitions exposed
- No submission values exposed
- No uploaded files exposed (none exist yet, but safeguard in place)

✅ **Aggregated counts only**
- Forms count via Prisma `_count`
- Submissions count via `groupBy` aggregation
- No content loaded to compute counts

✅ **Operator-only access**
- `requireOperator()` enforced in layout
- Server actions verify operator status
- Non-operators redirected to `/forms`

✅ **Self-deletion prevention**
- Operator cannot delete own account
- Prevents accidental lockout

✅ **Content purge on delete**
- All forms, sites, submissions deleted before tombstone
- No orphaned user data

### Out of Scope (Intentionally Excluded)

❌ Search functionality  
❌ Analytics dashboards  
❌ Bulk actions  
❌ Role/permission system  
❌ Impersonation  
❌ Account disabling without delete  
❌ Password reset by operator  
❌ Audit logs  
❌ User-facing pages

## Testing & Verification

### Manual Testing Steps

1. **Operator access:**
   - Log in as user matching `ADMIN_EMAIL`
   - Navigate to `/operator/accounts`
   - Verify accounts list displays
   - Verify counts are correct

2. **Non-operator access:**
   - Log in as regular user
   - Attempt to visit `/operator/accounts`
   - Verify redirect to `/forms`

3. **Account deletion:**
   - Click delete button on account
   - Verify confirmation dialog appears
   - Confirm deletion
   - Verify account removed from list
   - Verify forms/submissions purged in database
   - Verify tombstone record exists (deletedAt set)

4. **Self-deletion prevention:**
   - Attempt to delete operator's own account
   - Verify error message displayed

### Database Verification

```sql
-- Check tombstone record exists
SELECT id, "createdAt", "deletedAt" FROM accounts WHERE "deletedAt" IS NOT NULL;

-- Verify forms purged
SELECT COUNT(*) FROM forms WHERE "accountId" = '<deleted-account-id>';

-- Verify submissions purged (via cascade)
SELECT COUNT(*) FROM submissions s
JOIN forms f ON s."formId" = f.id
WHERE f."accountId" = '<deleted-account-id>';

-- Verify password cleared
SELECT password FROM users WHERE "accountId" = '<deleted-account-id>';
```

## Future Considerations

### Potential Enhancements (Not in v3 Scope)

- **Audit log:** Track operator actions with timestamps
- **Account disabling:** Temporary disable without delete
- **Bulk operations:** Delete multiple accounts at once
- **Search/filtering:** Find accounts by email/date
- **Analytics:** Platform-wide usage statistics
- **Role system:** Multiple operator roles with different permissions
- **Account recovery:** Un-delete within grace period

### Technical Debt

None identified. Implementation follows established patterns and maintains consistency with existing codebase.

## Conclusion

Epic 6 successfully delivers a minimal, privacy-respecting operator console. The implementation:

- Maintains strict privacy boundaries (metadata only, no content)
- Uses hybrid delete for compliance and auditability
- Follows existing architectural patterns
- Requires minimal schema changes
- Provides essential account management capabilities

The operator console is fully functional and ready for production use. All v3 epics are now complete.

---

**Related Documentation:**
- [v3 Plan](../../v3%20plan.md) — Product requirements
- [Epic README](./README.md) — Epic tracking
- [AGENT_CONTEXT.md](../../AGENT_CONTEXT.md) — Development guidelines
