# Operator Console

The Operator Console is a platform operator interface for managing accounts on Can-O-Forms. It provides account management capabilities while maintaining strict privacy boundaries—no form content or submission data is ever exposed.

## Overview

The Operator Console (v3.0.0+) allows platform operators to:
- View all accounts with metadata only
- See account statistics (forms count, submissions count)
- Delete accounts using hybrid delete semantics

**Important**: This interface is **operator-only**. Regular users cannot access it.

## Access Requirements

### Operator Identification

Access to the Operator Console is restricted to the platform operator, identified by email address:

- The operator email is set via the `ADMIN_EMAIL` environment variable
- Only users with an email matching `ADMIN_EMAIL` can access the console
- Non-operators are automatically redirected to `/forms` if they attempt to access operator routes

### Accessing the Console

1. Log in with an account that matches `ADMIN_EMAIL`
2. Navigate to `/operator/accounts`
3. You'll see the Operator Console interface

**Note**: If you're not the operator, you'll be redirected to the regular forms dashboard.

## Account Management

### Viewing Accounts

The accounts page displays all active accounts in a table with the following information:

- **Email** - Account owner's email address
- **Created** - Account creation date
- **Last Login** - Last successful login timestamp (or "Never" if no login)
- **Forms** - Number of forms owned by this account
- **Submissions** - Total number of submissions across all forms
- **Actions** - Delete button for account deletion

**Privacy Note**: The console only shows metadata. It does not display:
- Form field definitions
- Submission field values
- Form names or content
- Site domains
- Any user-generated content

### Account Statistics

Counts are computed via database aggregation queries:
- **Forms Count**: Number of forms owned by the account
- **Submissions Count**: Total submissions across all forms owned by the account

These counts are calculated without loading any content, ensuring privacy.

## Deleting Accounts

The Operator Console allows you to delete accounts using a hybrid delete approach.

### Hybrid Delete Process

When you delete an account, the following happens:

1. **Content Purge**: All forms, sites, and submissions are permanently deleted
2. **Password Clear**: User password is cleared (immediate account disable)
3. **Tombstone**: Account is marked as deleted with a `deletedAt` timestamp

**Result**: The account remains in the database for audit purposes but is completely inaccessible and contains no user data.

### How to Delete an Account

1. Navigate to **Operator Console** → **Accounts**
2. Find the account you want to delete
3. Click the **Delete** button in the Actions column
4. Confirm the deletion in the dialog
5. The account and all associated data will be permanently deleted

**Warning**: Account deletion is permanent and cannot be undone. All forms, sites, and submissions will be permanently deleted.

### Self-Deletion Prevention

The operator **cannot delete their own account**. This prevents accidental lockout and ensures the platform always has an operator.

If you attempt to delete your own account, you'll see an error: "Cannot delete your own account".

## Privacy & Security

### Privacy Safeguards

The Operator Console is designed with privacy-first principles:

✅ **Metadata-Only Queries**
- Uses explicit `select` statements
- Only fetches: id, createdAt, email, lastLoginAt
- Never loads form or submission content

✅ **Aggregated Counts Only**
- Forms count via Prisma `_count` (aggregation)
- Submissions count via `groupBy` (aggregation)
- No content is loaded to compute counts

✅ **No Content Exposure**
- Form field definitions are never exposed
- Submission values are never exposed
- Form names, site domains, and other content are hidden

✅ **Deleted Accounts Filtered**
- Deleted accounts (`deletedAt IS NOT NULL`) are excluded from the list
- Only active accounts are shown

### Security Features

✅ **Operator-Only Access**
- `requireOperator()` enforced at layout level
- Server actions verify operator status
- Non-operators redirected to `/forms`

✅ **Self-Deletion Prevention**
- Operator cannot delete own account
- Prevents accidental lockout

✅ **Content Purge on Delete**
- All user data is deleted before tombstone
- No orphaned data remains
- Password cleared for immediate disable

## What's Not Included

The Operator Console is intentionally minimal. The following features are **not included** (and are out of scope for v3):

- ❌ Search functionality
- ❌ Analytics dashboards
- ❌ Bulk actions
- ❌ Role/permission system
- ❌ Impersonation
- ❌ Account disabling without delete
- ❌ Password reset by operator
- ❌ Audit logs
- ❌ Viewing form content
- ❌ Viewing submission data

## Troubleshooting

### Can't Access Operator Console

**Check:**
- Is your email address set as `ADMIN_EMAIL` in environment variables?
- Are you logged in with the correct account?

**Solution:**
- Verify `ADMIN_EMAIL` environment variable is set correctly
- Log out and log back in
- Contact your platform administrator

### Account Not Appearing in List

**Check:**
- Is the account deleted? (Deleted accounts are filtered out)
- Is there a database connection issue?

**Solution:**
- Check database connection
- Verify account exists in database
- Check that `deletedAt` is NULL for active accounts

### Can't Delete Account

**Check:**
- Are you trying to delete your own account?
- Is the account already deleted?

**Solution:**
- You cannot delete your own account (self-deletion prevention)
- Deleted accounts won't appear in the list
- Check browser console for error messages

## Best Practices

1. **Regular Monitoring**: Check the accounts list periodically to monitor platform usage
2. **Account Cleanup**: Delete inactive or abandoned accounts to maintain data hygiene
3. **Privacy First**: Remember that you can only see metadata—never form or submission content
4. **Audit Trail**: Deleted accounts retain tombstone records for audit purposes
5. **Secure Access**: Keep your operator account credentials secure

## Related Documentation

- [Authentication & Account Management](./authentication.md) - User account management
- [Security & Privacy](./security.md) - Security features and best practices
- [Getting Started](./index.md) - Platform overview
