# Epic 13 — Account Dashboard Scaffold

**Status**: ✅ Complete
**Version**: v4.5.0
**Date**: 2026-02-20

## Summary

Added a user account management surface with an interactive sidebar menu and a dedicated dashboard page at `/account`.

## What Was Built

### Interactive Account Menu
- Converted `UserAccountFooter` from a static display to a `DropdownMenu` trigger
- Menu opens upward (`side="top"`) with two items: **Manage Account** and **Sign Out**
- Replaced standalone `SignOutButton` in both admin and operator layouts
- Works on desktop sidebar and mobile drawer

### Account Dashboard (`/account`)
- **Email section**: Read-only display of the user's email address
- **Password section**: Fully functional password change form with:
  - "Reward early, punish late" validation (errors shown on blur or submit)
  - Current password verification against database
  - New password minimum 8 characters + confirmation match
  - Success toast with session invalidation notice
  - Server-side error display (e.g., "Current password is incorrect")
- **Delete Account section**: Placeholder with disabled destructive button

### Server Actions (`src/actions/auth.ts`)
- `signOutAction()`: Wraps `signOut()` for use from client components
- `changePassword(formData)`: Validates current password, hashes new password, sets `passwordChangedAt` to trigger automatic session invalidation within ~5 minutes

## Files Changed

| File | Change |
|------|--------|
| `src/actions/auth.ts` | Added `signOutAction` and `changePassword` exports |
| `src/components/patterns/user-account-footer.tsx` | Converted to client component with DropdownMenu |
| `src/app/(admin)/layout.tsx` | Removed `SignOutButton` component |
| `src/app/operator/layout.tsx` | Removed `SignOutButton` component |
| `src/app/(admin)/account/page.tsx` | **New** — thin server component |
| `src/components/account/account-dashboard.tsx` | **New** — client component with all sections |

## Technical Notes

- No schema changes required
- Password change leverages Epic 12's `passwordChangedAt` mechanism for session invalidation
- `UserAccountFooter` is now a client component (was server-renderable before)
- The operator's "Manage Account" link goes to `/account` under the `(admin)` layout group, which works because both layouts share the same authentication
