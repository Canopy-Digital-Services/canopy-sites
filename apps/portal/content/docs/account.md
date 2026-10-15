---
title: Account
description: Email, password, and account deletion.
icon: UserCog
---

Manage your account from the **Manage Account** link in the user menu (click your avatar in the top-right corner).

## Signing up

Create an account at `/signup`:

1. Enter your email address.
2. Create a password (minimum 8 characters).
3. Confirm the password.
4. Click **Create account**. You're signed in and taken to the Forms page.

Your email is also the contact address used for email notifications, so use an address you actually read.

## Signing in

Sign in at `/login` with your email and password. Login errors are intentionally generic ("Invalid email or password") to avoid revealing whether an account exists for a given address.

## Email

Your email address is shown on the Account page. It's used for:

- Signing in
- Password reset links
- Receiving email notifications (your address is added as the first recipient automatically when you enable notifications on a form)

Email addresses cannot currently be changed from the Account page.

## Changing your password

On the Account page, fill in:

1. **Current Password**
2. **New Password** (minimum 8 characters)
3. **Confirm New Password**

Click **Change Password**. If the change succeeds, you're signed out of all sessions shortly after, so you can log back in with the new password.

If the current password is wrong, the form shows an error and nothing changes.

## Forgot password

If you can't sign in:

1. Click **Forgot password?** on the login page, or go to `/forgot-password`.
2. Enter your email.
3. You'll see a confirmation message whether or not the address is registered (this prevents someone from probing for accounts).
4. If an account exists, you'll receive an email with a reset link.
5. The link lands on `/reset-password` and is valid for **one hour**. Each link can only be used once.
6. Enter a new password and confirm it. On success you're redirected to the login page.

If the link expired or has already been used, request a new one from the Forgot Password page.

## Deleting your account

Deleting an account removes everything permanently. Before you delete, export any submissions you want to keep (each form has its own CSV/JSON export on the Submissions tab).

1. Go to the Account page.
2. Scroll to **Delete Account**.
3. Click **Delete Account** and confirm in the dialog.

What gets deleted:

- Your user record and password
- Your account
- Every form you own
- Every field and submission on those forms
- Any pending password-reset tokens for your email

There is no recovery. If you want to come back later, sign up again with the same email.

## Security features

A few things worth knowing about how accounts are protected:

- Passwords are hashed with bcrypt before they're stored. Plaintext passwords are never persisted.
- Login attempts are tracked (last successful login, failed attempts) for abuse monitoring. This telemetry doesn't lock accounts on its own.
- Password reset tokens are single-use and expire after one hour.
- Generic error messages on login and password reset prevent email enumeration.
