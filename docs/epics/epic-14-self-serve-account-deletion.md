# Epic 14: Self-Serve Account Deletion

**Status**: 📋 Planned
**Target version**: v4.6.0

---

## Objective

Allow users to permanently delete their own account from the `/account` dashboard. The "Delete Account" button added in Epic 13 is currently a disabled placeholder — this epic wires it up.

---

## Scope

### What gets built

1. **`deleteSelfAccount()` server action** in `src/actions/accounts.ts`
2. **Wired delete button** in `AccountDashboard` — replaces the disabled placeholder with a `ConfirmDialog`
3. **Post-deletion flow**: sign out + redirect to `/login` with a query param so the login page can show a confirmation message

### What does NOT change

- No schema changes — the hybrid-delete pattern (purge content, blank password, `deletedAt` tombstone) from Epic 6 is reused as-is
- No new UI components
- Operator console is unaffected

---

## Implementation Plan

### Step 1: `deleteSelfAccount()` server action

Add to `src/actions/accounts.ts`:

1. Call `requireAuth()` to get the current session
2. Look up `user.accountId` from the DB
3. Guard: if account already has `deletedAt`, return early (shouldn't happen, but safe)
4. Run the same hybrid-delete sequence as the existing operator action:
   - `prisma.form.deleteMany({ where: { accountId } })` — cascades to submissions and fields
   - `prisma.user.update(... { password: "" })` — prevents future credential login
   - `prisma.account.update(... { deletedAt: new Date() })` — tombstone
5. Call `signOut({ redirectTo: "/login?deleted=1" })`

The operator's `deleteAccount()` action is **not reused directly** — it calls `requireOperator()` and has self-deletion prevention. A separate action with `requireAuth()` is cleaner and avoids coupling.

### Step 2: Wire up the delete button in `AccountDashboard`

In `src/components/account/account-dashboard.tsx`, update `DeleteAccountSection`:

- Remove `disabled` from the button
- Wrap in `ConfirmDialog`:
  - `title`: "Delete Account"
  - `description`: "This will permanently delete your account, all your forms, and all submissions. This cannot be undone."
  - `destructive={true}`
  - `onConfirm`: calls `deleteSelfAccount()`, handles loading state
- Show a loading state on the confirm button while the action runs (use `useTransition`)
- On error: show an inline error message below the button

### Step 3: Login page confirmation message

In `src/app/(auth)/login/page.tsx`:

- Read `?deleted=1` from `searchParams`
- If present, render a dismissible success banner above the login form: "Your account has been deleted."
- No new component needed — a simple conditional `<p>` or small `<div>` with appropriate styling

---

## Files to Modify

| File | Change |
|------|--------|
| `src/actions/accounts.ts` | Add `deleteSelfAccount()` server action |
| `src/components/account/account-dashboard.tsx` | Wire `DeleteAccountSection` with `ConfirmDialog` + `useTransition` |
| `src/app/(auth)/login/page.tsx` | Show confirmation banner when `?deleted=1` is present |
| `docs/epics/epic-14-self-serve-account-deletion.md` | Rewrite as completion report |
| `docs/epics/README.md` | Add epic 14 row |
| `CHANGELOG.md` | Add version entry |
| `package.json` | Bump to v4.6.0 |

---

## Commit Strategy

| # | Message | Files |
|---|---------|-------|
| 1 | `feat(epic-14): add deleteSelfAccount server action` | `src/actions/accounts.ts` |
| 2 | `feat(epic-14): wire account deletion in dashboard with confirm dialog` | `account-dashboard.tsx` |
| 3 | `feat(epic-14): show deletion confirmation on login page` | `login/page.tsx` |
| 4 | `docs(epic-14): update docs, changelog, and bump to v4.6.0` | docs, CHANGELOG, package.json |

---

## Verification

1. `npm run build` — must pass
2. `npm run lint` — must pass
3. Browser smoke test:
   - Click "Delete Account" → confirm dialog appears with correct warning text
   - Cancel → dialog closes, nothing happens
   - Confirm → loading state on button → redirected to `/login?deleted=1`
   - Login page shows "Your account has been deleted." banner
   - Attempting to log in with the deleted account's credentials → fails (password is blanked)
   - Operator console: deleted account shows tombstone (`deletedAt` set) and no forms/submissions

---

## Notes

- The `ConfirmDialog` component's `onConfirm` is synchronous — we'll need to either extend it to accept an async handler or manage the async flow outside (via `useTransition` calling a wrapper that fires `deleteSelfAccount()`)
- `signOut` with `redirectTo` inside a server action causes a `NEXT_REDIRECT` throw, which is the correct Next.js mechanism — the client will follow the redirect automatically
- The operator console's account list will still show the tombstone row — this is correct and expected behavior from Epic 6
