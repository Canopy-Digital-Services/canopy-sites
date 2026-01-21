# API Reference

Complete reference for the Can-O-Forms API endpoints. Can-O-Forms v2 includes both the embed API (for script-based embeds) and the legacy v1 submission API.

## v2 Embed API (Recommended)

The embed API is used by the embed script to fetch form definitions and submit forms with validation.

### Get Form Definition

```
GET /api/embed/{siteApiKey}/{formSlug}
```

Returns an embed-safe form definition including fields, validation rules, theme defaults, and success configuration.

**Example Response:**
```json
{
  "formId": "clx123abc",
  "slug": "contact",
  "fields": [
    {
      "id": "field1",
      "name": "name",
      "type": "TEXT",
      "label": "Your Name",
      "placeholder": "Enter your name",
      "required": true,
      "validation": {
        "minLength": 2,
        "maxLength": 100
      }
    },
    {
      "id": "field2",
      "name": "email",
      "type": "EMAIL",
      "label": "Email Address",
      "required": true
    }
  ],
  "successMessage": "Thanks for contacting us!",
  "redirectUrl": null,
  "defaultTheme": {
    "primary": "#0ea5e9",
    "radius": 8
  }
}
```

**Security:**
- Rate limited (60 requests per minute)
- Origin validated
- Never exposes admin data (notifyEmails, owner info)

### Submit Form (v2)

```
POST /api/embed/{siteApiKey}/{formSlug}
```

Submits form data with server-side validation against field definitions.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "id": "submission-id"
}
```

**Validation Error Response (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "fields": {
    "email": "Email must be a valid email address.",
    "name": "Name is required."
  }
}
```

### CORS Headers

Both embed endpoints include CORS headers to allow cross-origin requests:
- `Access-Control-Allow-Origin`: Request origin or `*`
- `Access-Control-Allow-Methods`: GET, POST, OPTIONS
- `Access-Control-Allow-Headers`: Content-Type

## v1 Submission API (Legacy)

The v1 API accepts submissions without field validation. Useful for backwards compatibility or custom integrations.

### Endpoint

```
POST /api/v1/submit/{siteApiKey}/{formSlug}
```

### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `siteApiKey` | string | Your site's unique API key |
| `formSlug` | string | The form's unique slug identifier |

### Example URL

```
https://canoforms.example.com/api/v1/submit/abc123-def456/contact
```

## Request

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | Must be `application/json` |
| `Origin` | Yes | Your site's domain (automatically sent by browsers) |

### Body

Send form data as JSON. All fields are accepted and stored as-is.

**Example**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I'd like to get in touch!",
  "phone": "555-1234"
}
```

### Honeypot Field

If your form has a honeypot field configured, include it in the request body. If filled, the submission will be marked as spam.

**Example with honeypot**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello!",
  "website": ""
}
```

## Response

### Success (200 OK)

```json
{
  "success": true,
  "id": "submission-id"
}
```

The submission is stored in the database and email notifications are sent (if configured).

### Error Responses

#### Invalid Site or Form (404 Not Found)

```json
{
  "error": "Site or form not found"
}
```

**Causes**:
- Invalid API key
- Invalid form slug
- Form deleted

#### Invalid Origin (403 Forbidden)

```json
{
  "error": "Invalid origin"
}
```

**Causes**:
- Request origin doesn't match site's configured domain
- Missing Origin header
- Domain mismatch (including subdomains)

#### Rate Limit Exceeded (429 Too Many Requests)

```json
{
  "error": "Rate limit exceeded"
}
```

**Causes**:
- Too many submissions from the same IP in a short time
- Default: 10 submissions per hour per IP

#### Invalid Request (400 Bad Request)

```json
{
  "error": "Invalid request body"
}
```

**Causes**:
- Malformed JSON
- Empty request body
- Invalid Content-Type header

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Internal server error"
}
```

**Causes**:
- Database connection issues
- SMTP configuration errors (email sending)
- Server configuration problems

## Rate Limiting

Can-O-Forms implements IP-based rate limiting to prevent spam:

- **Limit**: 10 submissions per hour per IP address
- **Tracking**: Based on hashed IP address
- **Reset**: Limits reset after 1 hour
- **Response**: 429 status code when exceeded

Legitimate users are unlikely to hit this limit. Consider the limit when testing.

## Origin Validation

Submissions are validated against the site's configured domain:

1. Request must include `Origin` header
2. Origin must match site's domain
3. Subdomains are validated separately

**Examples**:

Site domain: `example.com`
- ✅ `https://example.com`
- ✅ `http://example.com`
- ❌ `https://blog.example.com` (unless configured)
- ❌ `https://other-site.com`

Site domain: `blog.example.com`
- ✅ `https://blog.example.com`
- ❌ `https://example.com`

## Security Considerations

### API Key Visibility

API keys are included in the endpoint URL and will be visible in:
- HTML source code
- Browser developer tools
- Network requests

This is by design and acceptable because:
- Rate limiting prevents abuse
- Origin validation prevents unauthorized use
- API keys only allow form submissions (not data access)

### HTTPS

Always use HTTPS in production to:
- Encrypt form data in transit
- Protect against man-in-the-middle attacks
- Ensure Origin header integrity

### Metadata Collection

Can-O-Forms automatically collects metadata:
- **IP Address**: Hashed (SHA-256) for privacy
- **User Agent**: Browser/device information
- **Referrer**: Page where form was submitted
- **Origin**: Domain where form was submitted

This metadata is used for spam detection and analytics, but IP addresses are hashed to protect user privacy.

## Testing

### Development Environment

For local testing, you may need to:

1. Temporarily set your site domain to `localhost` or `localhost:3000`
2. Use browser extensions to modify Origin headers
3. Test with production domain once deployed

### Example cURL Request

```bash
curl -X POST https://canoforms.example.com/api/v1/submit/YOUR_API_KEY/contact \
  -H "Content-Type: application/json" \
  -H "Origin: https://your-site.com" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "Test submission"
  }'
```

### Example Fetch Request

```javascript
fetch('https://canoforms.example.com/api/v1/submit/YOUR_API_KEY/contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    message: 'Test submission'
  })
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

## Webhooks

Webhooks are not currently supported in Can-O-Forms. Form submissions can be accessed via:
- Email notifications (configured per form)
- Admin dashboard
- CSV export

## API Versioning

Can-O-Forms supports multiple API versions simultaneously:

- **v2 Embed API** - `/api/embed/...` - Used by embed script, includes validation
- **v1 Submission API** - `/api/v1/submit/...` - Legacy API, no validation

Both APIs remain available for backwards compatibility. The embed script uses the v2 API automatically. Manual integrations can use either API endpoint.
