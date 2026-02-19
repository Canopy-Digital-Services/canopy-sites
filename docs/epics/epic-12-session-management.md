# Epic: Session Management (bounded sessions + optional 30-day keep-signed-in)

## Goal
Implement baseline **session management** (idle + absolute timeouts, secure cookies, logout invalidation, and minimal re-auth for sensitive actions). Include an optional **“Keep me signed in for 30 days”** setting.

This replaces the current behavior of **infinite per-device sessions**.

## Non-goals
- No refresh-token rotation system.
- No device fingerprinting or cross-site/session tracking.
- No per-device session management UI (optional stretch: “log out all sessions” API only).

## Assumptions
- Auth uses a **server-side session** (opaque session id stored in cookie; session record stored in DB/Redis).
- App is served over HTTPS.

---

## Requirements

### 1) Replace infinite sessions with expiration policy
- Add two timeouts:
  - **Idle timeout (sliding):** 30 minutes (configurable).
  - **Absolute timeout (fixed):**
    - Default: 7 days
    - If user selects “Keep me signed in for 30 days”: 30 days
- Session terminates when **either** idle timeout or absolute timeout is exceeded.

### 2) Login UX
- On login screen, add checkbox:
  - Label: **“Keep me signed in for 30 days on this device.”**
  - Default unchecked.
- On successful login, set session record and cookie expiry accordingly.

### 3) Cookie security settings (auth session cookie)
Ensure auth cookie is set with:
- `Secure` (HTTPS only)
- `HttpOnly`
- `SameSite=Lax` (use `Strict` only if it doesn’t break your flows)
- `Path=/`
- Avoid setting `Domain` unless required.
- Prefer cookie name prefix `__Host-` if feasible (requires Secure + Path=/ and no Domain).

### 4) Session lifecycle hardening
- Rotate session id on login (new session id each login).
- Logout invalidates the server-side session record.
- Invalidate sessions on password change (if applicable).

### 5) Re-auth for sensitive actions (minimal)
Require re-auth (or “confirm password”) for:
- Changing email/password
- Managing integrations/webhooks
- Billing actions
- Exporting submissions

### 6) Privacy-first constraints
- Do not add fingerprinting.
- Do not persist high-entropy device identifiers.
- Only store what is needed for session enforcement:
  - `user_id`
  - `session_id` (or token hash)
  - `created_at`
  - `last_activity_at`
  - `absolute_expires_at`
  - optional: `revoked_at`

---

## Implementation details

### Data model changes (if needed)
Add/ensure fields on session record:
- `created_at`
- `last_activity_at`
- `absolute_expires_at`
- `revoked_at` (nullable)

### Request middleware
On each authenticated request:
1. Load session by session cookie id.
2. Reject if `revoked_at` set.
3. Reject if `now > absolute_expires_at`.
4. Reject if `now - last_activity_at > idle_timeout`.
5. If valid, update `last_activity_at = now` (throttle updates to once per N minutes to reduce writes).

### Cookie expiry
- Set cookie expiry to match `absolute_expires_at`.
- Do **not** extend cookie expiry beyond absolute expiry.

### Logout
- Delete/invalidate server session.
- Clear cookie.

### Cleanup
- Background cleanup job or TTL policy to delete expired sessions periodically.

---

## Acceptance criteria
- Infinite sessions are eliminated.
- Default sessions expire after **30 minutes idle** OR **7 days absolute**.
- If “Keep me signed in” is checked, absolute expiry is **30 days**.
- Auth cookie has correct security flags.
- Session is rejected when idle/absolute expiry is reached.
- Logout immediately invalidates session.
- Sensitive actions require re-auth.
- No new tracking/fingerprinting data is collected.

---

## Test plan
- Unit tests:
  - idle timeout triggers logout after inactivity.
  - absolute timeout triggers logout even with activity.
  - keep-me-signed-in sets 30-day absolute expiry.
  - revoked session is rejected.
- Integration tests:
  - cookie flags present.
  - logout clears cookie + session.
  - re-auth gate blocks sensitive endpoints until re-auth.

