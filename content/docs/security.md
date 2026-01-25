# Security & Privacy

Can-O-Forms implements multiple layers of security to protect your forms, submissions, and user data. This guide covers all security features and privacy protections.

## Overview

Can-O-Forms security is built on defense-in-depth principles:

- **Privacy-first design** - User data is protected at every layer
- **Account isolation** - Complete data separation between accounts
- **Input validation** - Multi-layer validation (client, server, database)
- **Rate limiting** - Prevents abuse and spam
- **Secure authentication** - Industry-standard password hashing and session management
- **Origin validation** - Domain-based access control

## IP Address Privacy

### IP Hashing

Can-O-Forms **never stores raw IP addresses**. Instead, IP addresses are hashed using SHA-256 before storage.

**How it works:**
1. Client IP is extracted from request headers (`X-Forwarded-For`, `X-Real-IP`)
2. IP is hashed using SHA-256 cryptographic hash function
3. Only the hash is stored in the database
4. Raw IP is discarded immediately

**Benefits:**
- **Privacy protection** - IP addresses cannot be recovered from hashes
- **Spam detection** - Can still identify repeated submissions from same IP
- **Pattern analysis** - Enables abuse detection without exposing user IPs
- **GDPR/CCPA friendly** - Reduces privacy concerns

**Example:**
```
Raw IP: 192.168.1.100
Hashed: a1b2c3d4e5f6... (64 character hex string)
```

**Note**: IP hashing is one-way. The original IP cannot be recovered from the hash.

## Origin Validation

Origin validation ensures that form submissions can only come from authorized domains.

### How It Works

1. **Domain Configuration**: Each site has a configured domain (e.g., `example.com`)
2. **Request Validation**: Every submission is checked against the site's domain
3. **Header Checking**: Uses `Origin` header (or `Referer` as fallback)
4. **Domain Matching**: Validates using flexible matching rules

### Matching Rules

The origin validation supports:

- **Exact match**: `https://example.com` matches `example.com`
- **www variants**: `https://www.example.com` matches `example.com` (and vice versa)
- **Subdomains**: `https://blog.example.com` matches `example.com`
- **Localhost**: Automatically allowed for development/testing
- **Dashboard preview**: Dashboard hostname (from `NEXT_PUBLIC_APP_URL`) allowed for form previews

**Examples:**

Site domain: `example.com`
- ✅ `https://example.com` (exact match)
- ✅ `https://www.example.com` (www variant)
- ✅ `https://blog.example.com` (subdomain)
- ✅ `https://cdn.example.com` (subdomain)
- ✅ `http://localhost` (development)
- ✅ `https://canoforms.canopyds.com` (dashboard preview)
- ❌ `https://other-site.com` (unauthorized)

### Configuration

Set your site domain in the admin:
1. Go to **Sites** → Your site
2. Click **Edit Site**
3. Set **Domain** to your website's domain
   - Don't include `http://` or `https://`
   - Don't include trailing slashes
   - Include subdomain if needed (e.g., `blog.example.com`)

**Important**: Origin validation prevents unauthorized sites from submitting to your forms. Always configure the correct domain.

## Rate Limiting

Rate limiting prevents abuse and spam by limiting the number of requests per IP address.

### Limits

- **GET requests** (form definition): 60 requests per minute per IP
- **POST requests** (form submission): 10 requests per minute per IP

### How It Works

1. **IP Extraction**: Client IP is extracted from request headers
2. **IP Hashing**: IP is hashed (SHA-256) for privacy
3. **Request Tracking**: Timestamps are stored for each request
4. **Limit Check**: If limit exceeded, request is rejected with `429` status
5. **Window Reset**: Limits reset after 1 minute

### Response

When rate limit is exceeded:
- **Status Code**: `429 Too Many Requests`
- **Response**: `{ "error": "Rate limit exceeded" }`
- **Headers**: Standard CORS headers included

### Legitimate Use

These limits are generous for normal use:
- **60 GET/min**: Allows rapid form definition fetching (embed script)
- **10 POST/min**: Prevents spam while allowing legitimate submissions

**Note**: If you're testing and hit rate limits, wait 1 minute or use different IP addresses.

## Payload Size Limits

### Maximum Payload Size

**64KB (65,536 bytes)** maximum per submission.

### Enforcement

The API checks payload size in two ways:
1. **Content-Length header** - Fast rejection before reading body
2. **Actual body size** - Verifies actual payload size

### Response

If payload exceeds 64KB:
- **Status Code**: `413 Payload Too Large`
- **Response**: `{ "error": "Payload too large" }`

### Why This Limit?

- **Prevents abuse** - Stops malicious large payloads
- **Performance** - Keeps API responsive
- **Database efficiency** - Reasonable storage limits

**Note**: 64KB is generous for typical form submissions. Most forms submit well under 1KB.

## Field Validation & Character Limits

### Three-Layer Validation

1. **HTML maxLength** - Browser-level enforcement
2. **Client-side validation** - Embed script validation
3. **Server-side validation** - API validation (final authority)

### Default Character Limits

Applied automatically when no `maxLength` is configured:

- **TEXT**: 200 characters
- **EMAIL**: 254 characters (RFC 5321 standard)
- **TEXTAREA**: 2,000 characters

### Absolute Maximum Limits

Security guardrails that cannot be exceeded:

- **TEXT**: 500 characters maximum
- **EMAIL**: 320 characters maximum
- **TEXTAREA**: 10,000 characters maximum

**Important**: Even if you configure a higher `maxLength` in field validation, these absolute limits are enforced server-side.

### Validation Rules

Fields are validated according to their configuration:

- **Required fields**: Must be present and non-empty
- **Email format**: Must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Select options**: Value must match one of the configured options
- **Min/Max length**: Enforced if configured
- **Regex patterns**: Validated if configured
- **Custom error messages**: Used if provided

## Honeypot Fields

Honeypot fields are hidden form fields that catch spam bots.

### How It Works

1. **Configure honeypot**: Set a honeypot field name in form settings
2. **Add hidden field**: Include the field in your HTML form with `display: none`
3. **Bot detection**: If the field is filled, submission is marked as spam
4. **Legitimate users**: Never see or fill the field

### Configuration

1. Go to your form → **Edit Form**
2. Set **Honeypot Field** name (e.g., `website`, `url`, `phone`)
3. Add the field to your HTML form:

```html
<input type="text" name="website" style="display: none;" />
```

**Note**: If using the embed script, honeypot fields are handled automatically.

### Best Practices

- Use common field names (e.g., `website`, `url`, `phone`)
- Always hide with CSS (`display: none`)
- Don't mention the field in labels or help text
- Test that legitimate submissions work

## Authentication Security

### Password Hashing

Passwords are hashed using **bcrypt** with 10 rounds:

- **Algorithm**: bcrypt (industry standard)
- **Rounds**: 10 (configurable, 10 is secure default)
- **Storage**: Only hashes are stored, never plaintext passwords

**Security**: Even if the database is compromised, passwords cannot be recovered.

### Session Management

- **JWT Sessions**: Uses NextAuth v5 with JWT-based sessions
- **Secure tokens**: Cryptographically secure session tokens
- **Automatic expiration**: Sessions expire based on NextAuth configuration
- **Sign out**: Explicit sign out clears session

### Password Reset Security

Password reset uses secure token-based flow:

- **Cryptographically secure tokens**: 32 random bytes (hex-encoded)
- **Time-limited**: Tokens expire after 1 hour
- **Single-use**: Tokens are marked as used after successful reset
- **Email delivery**: Tokens only sent to registered email address

**Security features:**
- Tokens cannot be guessed
- Expired tokens are rejected
- Used tokens cannot be reused
- Invalid tokens show generic error (prevents enumeration)

### Login Telemetry

The system tracks login activity for security monitoring:

- **lastLoginAt**: Timestamp of last successful login
- **failedLoginCount**: Number of consecutive failed attempts
- **lastFailedLoginAt**: Timestamp of last failed attempt

**Use cases:**
- Identify suspicious activity
- Monitor account security
- Detect brute force attempts

**Note**: This telemetry doesn't lock accounts in v3, but provides visibility into security events.

### Email Enumeration Prevention

The system prevents attackers from discovering registered emails:

- **Generic error messages**: Same error for invalid email or password
- **Consistent responses**: Password reset always returns success
- **No user disclosure**: Error messages don't reveal if account exists

## Account Isolation

### Direct Account Ownership

Forms and sites are directly owned by accounts (v2.3.0+):

- **Direct relation**: `Form.accountId` → `Account.id`
- **No JOIN chains**: Ownership checks use direct comparison
- **Complete isolation**: Accounts cannot access each other's data

### Data Access Control

All data access is filtered by `accountId`:

- **Forms**: Only forms owned by your account are visible
- **Sites**: Only sites owned by your account are accessible
- **Submissions**: Only submissions for your forms are viewable

**Enforcement:**
- Server actions verify ownership before operations
- Data access helpers filter by `accountId`
- Database queries include ownership checks

### Multi-Tenant Security

- **Complete isolation**: Each account's data is completely separate
- **No cross-account access**: Impossible to access another account's data
- **Direct ownership**: No shared resources or data leakage

## Embed-Safe API

Public API endpoints are designed to never expose admin data:

### What's Exposed

- Form field definitions (name, type, label, validation)
- Form configuration (success message, redirect URL, theme)
- Submission endpoints

### What's NOT Exposed

- Account owner information
- Notification email addresses
- Form creator information
- Internal IDs or metadata
- Submission data (only accepts, never returns)

**Security**: Public endpoints are safe to embed on any website without exposing sensitive information.

## Privacy-First Admin

### Operator Console Privacy

The operator console (v3.0.0+) maintains strict privacy boundaries:

✅ **Metadata-only queries**
- Only exposes: email, createdAt, lastLoginAt
- Forms count and submissions count (aggregated)
- No form or submission content

❌ **Never exposed**
- Form field definitions
- Submission field values
- Form names or content
- Site domains
- Any user-generated content

**Design**: Operators can manage accounts without ever seeing user content.

## CORS (Cross-Origin Resource Sharing)

### CORS Headers

All API endpoints include CORS headers:

- `Access-Control-Allow-Origin`: Request origin or `*`
- `Access-Control-Allow-Methods`: `GET, POST, OPTIONS`
- `Access-Control-Allow-Headers`: `Content-Type`
- `Access-Control-Max-Age`: `86400` (24 hours) for preflight

### OPTIONS Requests

Preflight requests are supported:
- **Method**: OPTIONS
- **Response**: 204 No Content with CORS headers
- **Purpose**: Browser CORS preflight checks

### Security

CORS works with origin validation:
- CORS headers allow cross-origin requests
- Origin validation ensures only authorized domains can submit
- Together, they provide both functionality and security

## HTTPS Requirements

### Production

**Always use HTTPS in production** to:
- Encrypt form data in transit
- Protect against man-in-the-middle attacks
- Ensure Origin header integrity
- Meet security best practices

### Development

Localhost is allowed for development:
- `http://localhost` is automatically allowed
- `http://127.0.0.1` is automatically allowed
- Useful for local testing

**Note**: Set your site domain to `localhost` for local development.

## Security Best Practices

### For Form Owners

1. **Use HTTPS**: Always use HTTPS in production
2. **Configure domains correctly**: Set accurate site domains
3. **Enable honeypot fields**: Add honeypot protection to public forms
4. **Monitor submissions**: Regularly review submissions for spam
5. **Use strong passwords**: Choose secure passwords for your account
6. **Keep email updated**: Your email is used for password resets

### For Platform Operators

1. **Secure ADMIN_EMAIL**: Keep `ADMIN_EMAIL` environment variable secure
2. **Monitor accounts**: Regularly review accounts in operator console
3. **Review security logs**: Check login telemetry for suspicious activity
4. **HTTPS everywhere**: Ensure all traffic uses HTTPS
5. **Environment security**: Protect environment variables and secrets

### For Developers

1. **Validate on server**: Never trust client-side validation alone
2. **Use origin validation**: Always configure site domains correctly
3. **Respect rate limits**: Don't bypass rate limiting in tests
4. **Test security**: Verify origin validation and rate limiting work
5. **Keep dependencies updated**: Regularly update npm packages

## Compliance & Privacy

### GDPR Considerations

- **IP hashing**: IP addresses are hashed (not stored raw)
- **Data minimization**: Only necessary data is collected
- **Account isolation**: Complete data separation
- **Right to deletion**: Accounts can be deleted (hybrid delete)

### CCPA Considerations

- **Privacy by design**: Privacy protections built into architecture
- **Data isolation**: Complete account separation
- **Minimal data collection**: Only necessary metadata collected

### Data Retention

- **Submissions**: Stored until account deletion
- **Accounts**: Tombstone records retained for audit (deleted accounts)
- **No automatic deletion**: Data persists until manually deleted

## Security Architecture

### Defense in Depth

Can-O-Forms uses multiple security layers:

1. **Network**: HTTPS encryption
2. **Origin**: Domain validation
3. **Rate limiting**: Abuse prevention
4. **Input validation**: Client + server validation
5. **Authentication**: Secure password hashing
6. **Authorization**: Account-based access control
7. **Privacy**: IP hashing, metadata-only queries

### Security Boundaries

- **Public API**: Origin validation, rate limiting, payload limits
- **Admin UI**: Authentication required, account isolation
- **Operator Console**: Operator-only, metadata-only access
- **Database**: Account-based filtering, hashed IPs

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** create a public issue
2. Contact the platform operator directly
3. Provide details about the vulnerability
4. Allow time for the issue to be addressed

**Responsible disclosure** helps protect all users.

## Related Documentation

- [API Reference](./api.md) - API security features
- [Authentication & Account Management](./authentication.md) - Auth security
- [Operator Console](./operator-console.md) - Privacy-first admin
- [Troubleshooting](./troubleshooting.md) - Security-related issues
