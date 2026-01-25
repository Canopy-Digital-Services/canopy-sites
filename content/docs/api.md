# API Reference

Complete reference for the Can-O-Forms API endpoints. The embed API powers the script-based experience, and a separate manual submit endpoint is available for whiteboxed forms.

## Base URL

All API endpoints use the following base URL format:
```
https://canoforms.canopyds.com/api
```

## Authentication

API authentication is done via the **Site API Key**, which is included in the URL path. API keys are unique per site and are automatically generated when you create a site.

**Security Note**: API keys are visible in HTML source code and network requests. This is by design and acceptable because:
- Rate limiting prevents abuse
- Origin validation prevents unauthorized use
- API keys only allow form submissions (not data access)

## Embed API (Recommended)

The embed API is used by the embed script to fetch form definitions and submit forms with validation.

### Get Form Definition

```
GET /api/embed/{siteApiKey}/{formSlug}
```

Returns an embed-safe form definition including fields, validation rules, theme defaults, and success configuration.

**Rate Limit**: 60 requests per minute per IP address

**Headers**:
- `Origin` (optional) - Used for origin validation
- `Referer` (optional) - Used as fallback for origin validation

**Response (200 OK)**:
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
        "maxLength": 100,
        "message": "Name must be between 2 and 100 characters"
      }
    },
    {
      "id": "field2",
      "name": "email",
      "type": "EMAIL",
      "label": "Email Address",
      "required": true,
      "validation": null
    },
    {
      "id": "field3",
      "name": "message",
      "type": "TEXTAREA",
      "label": "Message",
      "placeholder": "Enter your message",
      "required": false,
      "validation": {
        "maxLength": 2000
      }
    }
  ],
  "successMessage": "Thanks for contacting us!",
  "redirectUrl": null,
  "defaultTheme": {
    "primary": "#0ea5e9",
    "radius": 8,
    "density": "normal"
  }
}
```

**Error Responses**:
- `403` - Origin not allowed
- `404` - Site or form not found
- `429` - Rate limit exceeded
- `500` - Internal server error

**Caching**: Responses include `Cache-Control: public, max-age=60, stale-while-revalidate=300` headers for improved performance.

### Submit Form

```
POST /api/embed/{siteApiKey}/{formSlug}
```

Submits form data with server-side validation against field definitions.

**Rate Limit**: 10 requests per minute per IP address

**Headers**:
- `Content-Type: application/json` (required)
- `Origin` (required for cross-origin requests)
- `Referer` (used as fallback when Origin is not available)

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello!"
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "id": "submission-id"
}
```

**Validation Error Response (400 Bad Request)**:
```json
{
  "error": "Validation failed",
  "fields": {
    "email": "Email must be a valid email address.",
    "name": "Name is required."
  }
}
```

**Error Codes**:
- `400` - Validation failed or invalid JSON
- `403` - Origin not allowed
- `404` - Site or form not found
- `413` - Payload too large (exceeds 64KB limit)
- `429` - Rate limit exceeded
- `500` - Internal server error

## Manual Submit API (Advanced)

Use this endpoint when you want to render your own HTML and post submissions directly.

### Endpoint

```
POST /api/submit/{siteApiKey}/{formSlug}
```

### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `siteApiKey` | string | Your site's unique API key |
| `formSlug` | string | The form's unique slug identifier |

### Example URL

```
https://canoforms.canopyds.com/api/submit/abc123-def456-ghi789/contact
```

### Request

**Headers**:

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | Must be `application/json` |
| `Origin` | Yes | Your site's domain (automatically sent by browsers) |

**Body**:

Send form data as JSON. Fields are validated against the form definition.

**Example**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I'd like to get in touch!"
}
```

**Honeypot Field**:

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

### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "id": "submission-id"
}
```

**Validation Error (400 Bad Request)**:
```json
{
  "error": "Validation failed",
  "fields": {
    "email": "Email must be a valid email address."
  }
}
```

**Error Codes**:
- `400` - Validation failed or invalid JSON
- `403` - Origin not allowed
- `404` - Site or form not found
- `413` - Payload too large (exceeds 64KB limit)
- `429` - Rate limit exceeded
- `500` - Internal server error

## Rate Limiting

Can-O-Forms implements IP-based rate limiting to prevent spam and abuse:

- **GET requests** (form definition): 60 requests per minute per IP address
- **POST requests** (form submission): 10 requests per minute per IP address
- **Tracking**: Based on hashed IP address (SHA-256) for privacy
- **Reset**: Limits reset after 1 minute
- **Response**: 429 status code when exceeded

Legitimate users are unlikely to hit these limits. Consider the limits when testing or during development.

## Origin Validation

Submissions are validated against the site's configured domain to prevent unauthorized use:

1. **Cross-origin requests**: Must include `Origin` header matching site's domain
2. **Same-origin requests**: Uses `Referer` header as fallback when browser doesn't send `Origin`
3. **Subdomain support**: Subdomains are automatically allowed (e.g., `cdn.example.com` matches `example.com`)
4. **www variants**: Both `example.com` and `www.example.com` are supported
5. **Localhost**: Automatically allowed for development/testing
6. **Dashboard preview**: The dashboard hostname (from `NEXT_PUBLIC_APP_URL`) is automatically allowed for form previews

**Examples**:

Site domain: `example.com`
- ✅ `https://example.com` (exact match)
- ✅ `https://www.example.com` (www variant)
- ✅ `https://blog.example.com` (subdomain)
- ✅ `http://localhost` (development/testing)
- ✅ `https://canoforms.canopyds.com` (dashboard preview)
- ❌ `https://other-site.com`

## CORS Headers

All API endpoints include CORS headers to allow cross-origin requests:

- `Access-Control-Allow-Origin`: Request origin or `*`
- `Access-Control-Allow-Methods`: `GET, POST, OPTIONS` (embed) or `POST, OPTIONS` (submit)
- `Access-Control-Allow-Headers`: `Content-Type`
- `Access-Control-Max-Age`: `86400` (24 hours) for preflight requests

**OPTIONS requests** are supported for CORS preflight checks.

## Payload Limits

**Maximum payload size**: 64KB (65,536 bytes) per submission

The API checks payload size in two ways:
1. `Content-Length` header (fast rejection)
2. Actual request body size

If the payload exceeds 64KB, the API returns `413 Payload Too Large`.

## Field Validation

### Validation Rules

Fields are validated according to their configuration:

- **Required fields**: Must be present and non-empty
- **Email fields**: Must match email format (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- **Select fields**: Value must match one of the configured options
- **Min/Max length**: Enforced if configured in field validation
- **Regex pattern**: Validated if configured in field validation
- **Custom error messages**: Used if provided in field validation

### Character Limits

**Default limits** (applied when no maxLength is configured):
- **TEXT**: 200 characters
- **EMAIL**: 254 characters (RFC 5321 standard)
- **TEXTAREA**: 2,000 characters

**Absolute maximum limits** (security guardrails):
- **TEXT**: 500 characters
- **EMAIL**: 320 characters
- **TEXTAREA**: 10,000 characters

These limits are enforced even if you configure a higher `maxLength` in field validation.

## Security Considerations

### IP Hashing

For privacy, Can-O-Forms stores a hash (SHA-256) of the submitter's IP address rather than the actual IP. This allows:
- Identifying repeated submissions from the same user
- Detecting potential spam patterns
- Maintaining user privacy

### Metadata Collection

Can-O-Forms automatically collects metadata:
- **IP Address**: Hashed (SHA-256) for privacy
- **User Agent**: Browser/device information
- **Referrer**: Page where form was submitted
- **Origin**: Domain where form was submitted

This metadata is used for spam detection and analytics.

### HTTPS

Always use HTTPS in production to:
- Encrypt form data in transit
- Protect against man-in-the-middle attacks
- Ensure Origin header integrity

## Testing

### Development Environment

For local testing, you may need to:
1. Temporarily set your site domain to `localhost` or `localhost:3000`
2. Use browser extensions to modify Origin headers
3. Test with production domain once deployed

### Example cURL Request

```bash
curl -X POST https://canoforms.canopyds.com/api/submit/YOUR_API_KEY/contact \
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
fetch('https://canoforms.canopyds.com/api/submit/YOUR_API_KEY/contact', {
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
- CSV/JSON export

## Public API Surface

- **Embed API** - `/api/embed/...` - Used by the embed script (GET + POST)
- **Manual Submit API** - `/api/submit/...` - Direct POST submissions for whiteboxed HTML

Both APIs share the same validation logic, rate limiting, and security features.

## Related Documentation

- [Integration Guide](./integration.md) - How to integrate forms with your site
- [Forms](./forms.md) - Creating and configuring forms
- [Security & Privacy](./security.md) - Security features and best practices
