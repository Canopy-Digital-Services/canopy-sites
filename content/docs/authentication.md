# Authentication & Account Management

Canopy Forms uses email and password authentication with self-service signup and password reset. This guide covers how to create an account, log in, reset your password, and understand the account model.

## Overview

Canopy Forms authentication system (v2.2.0+):
- **Email + Password** - Simple, secure authentication
- **Self-Service Signup** - Create your account directly from the web UI
- **Password Reset** - Secure token-based reset flow via email
- **Login Telemetry** - Tracks login attempts for security monitoring
- **Account Model** - Internal construct that organizes your sites and forms

## Creating an Account (Sign Up)

1. Navigate to the **Sign Up** page (`/signup`)
2. Enter your email address
3. Create a password (minimum 8 characters)
4. Confirm your password
5. Click **Create account**

**What happens:**
- An account is automatically created for you
- A user record is created and linked to your account
- You are automatically signed in
- You are redirected to the forms dashboard

**Requirements:**
- Email must be unique (not already registered)
- Password must be at least 8 characters
- Passwords must match in both fields

**Note**: The account is an internal organizational unit. You won't see it directly in the UI—it's used behind the scenes to group your sites, forms, and submissions.

## Logging In

1. Navigate to the **Login** page (`/login`)
2. Enter your email address
3. Enter your password
4. Click **Sign in**

**After successful login:**
- You are redirected to the forms dashboard (`/forms`)
- Your last login time is recorded
- Any failed login attempts counter is reset

**If login fails:**
- You'll see a generic error message: "Invalid email or password"
- The failed login attempt is tracked
- You can try again or use the password reset flow

**Security**: Generic error messages prevent email enumeration attacks. The system doesn't reveal whether an email exists in the system.

## Password Reset

If you've forgotten your password, you can reset it using the secure token-based flow.

### Step 1: Request Password Reset

1. Navigate to the **Forgot Password** page (`/forgot-password`)
2. Enter your email address
3. Click **Send reset link**

**What happens:**
- A cryptographically secure token is generated (32 bytes, hex-encoded)
- The token is stored in the database with a 1-hour expiration
- An email is sent to your address with a reset link
- You'll see a success message (even if the email doesn't exist, to prevent enumeration)

**Email includes:**
- A reset link with the token as a query parameter
- Instructions that the link expires in 1 hour
- A note that you can ignore the email if you didn't request it

### Step 2: Reset Your Password

1. Click the reset link in your email (or copy and paste it)
2. You'll be taken to the **Reset Password** page (`/reset-password?token=...`)
3. The system validates the token:
   - Checks if the token exists
   - Verifies it hasn't been used
   - Confirms it hasn't expired
4. Enter your new password (minimum 8 characters)
5. Confirm your new password
6. Click **Reset password**

**What happens:**
- Your password is hashed using bcrypt
- The old password is replaced
- The reset token is marked as used (single-use enforcement)
- You are redirected to the login page with a success message

**Token Security:**
- Tokens are cryptographically secure (32 random bytes)
- Tokens expire after 1 hour
- Tokens can only be used once
- Invalid or expired tokens show a clear error message

**If the token is invalid:**
- You'll see an error message explaining why
- You can request a new reset link
- Old tokens cannot be reused

## Account Model

The **Account** is an internal construct that represents your workspace:

- **Automatic Creation**: Created when you sign up
- **One User Per Account**: In v3, exactly one user per account
- **Not Exposed in UI**: You won't see "Account" in the interface
- **Organizational Unit**: Groups your sites, forms, and submissions
- **Direct Ownership**: Forms and sites are directly owned by your account (v2.3.0+)

**Why it exists:**
- Provides a clean separation between authentication (User) and data organization (Account)
- Enables future features like team accounts (not in v3)
- Simplifies ownership checks and data access

You don't need to manage your account directly—it's handled automatically by the system.

## Security Features

### Password Security

- **Hashing**: Passwords are hashed using bcrypt (10 rounds)
- **Never Stored Plaintext**: Your password is never stored in plain text
- **Minimum Length**: 8 characters required
- **No Complexity Requirements**: Simple length requirement for usability

### Login Telemetry

The system tracks login activity for security monitoring:

- **lastLoginAt**: Timestamp of your last successful login
- **failedLoginCount**: Number of consecutive failed login attempts
- **lastFailedLoginAt**: Timestamp of your last failed login attempt

**How it works:**
- Failed login attempts increment the counter
- Successful login resets the counter to 0
- This data helps identify suspicious activity

**Note**: This telemetry is for security monitoring only. It doesn't lock accounts or require additional verification in v3.

### Email Enumeration Prevention

The system prevents attackers from discovering which emails are registered:

- **Generic Error Messages**: Login and password reset show the same error regardless of whether the email exists
- **Consistent Responses**: Password reset always returns success, even if the email doesn't exist
- **No User Disclosure**: Error messages don't reveal whether an account exists

### Password Reset Security

- **Secure Tokens**: Cryptographically secure random tokens (32 bytes)
- **Time-Limited**: Tokens expire after 1 hour
- **Single-Use**: Tokens are marked as used after successful reset
- **Email Delivery**: Tokens are only sent via email to the registered address

## Session Management

- **JWT Sessions**: Uses NextAuth v5 with JWT-based sessions
- **Automatic Expiration**: Sessions expire based on NextAuth configuration
- **Sign Out**: Use the "Sign out" button in the navigation to end your session

## Troubleshooting

### Can't Log In

**Check:**
- Email address is correct (case-sensitive)
- Password is correct
- You're using the correct account

**Solution:**
- Use the "Forgot password?" link to reset your password
- Make sure you're not using a different email address

### Didn't Receive Password Reset Email

**Check:**
- Email address is correct
- Check your spam/junk folder
- Wait a few minutes (email delivery can be delayed)

**Solution:**
- Request a new reset link
- Verify your email address is correct
- Check your email provider's spam filters

### Reset Link Expired

**Solution:**
- Request a new password reset link
- Reset links expire after 1 hour for security

### Reset Link Already Used

**Solution:**
- Request a new password reset link
- Each link can only be used once for security

## Best Practices

1. **Use a Strong Password**: Choose a password that's at least 8 characters and unique to Canopy Forms
2. **Keep Your Email Updated**: Your email is used for password resets and notifications
3. **Don't Share Your Password**: Keep your password private
4. **Use Password Reset**: If you forget your password, use the reset flow instead of creating a new account
5. **Check Login Activity**: Be aware of your login telemetry to spot suspicious activity

## Related Documentation

- [Getting Started](./index.md) - Overview of Canopy Forms
- [Security & Privacy](./security.md) - Security features and best practices
- [Forms](./forms.md) - Creating and managing forms
