# API Reference

Complete reference for the Can-O-Forms API endpoints. The embed API powers the script-based experience, and a separate manual submit endpoint is available for whiteboxed forms.

## Embed API (Recommended)

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

### Submit Form

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
https://canoforms.example.com/api/submit/abc123-def456/contact
```

## Request

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | Must be `application/json` |
| `Origin` | Yes | Your site's domain (automatically sent by browsers) |

### Body

Send form data as JSON. Fields are validated against the form definition.

**Example**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I'd like to get in touch!"
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

### Validation Error (400 Bad Request)

```json
{
  "error": "Validation failed",
  "fields": {
    "email": "Email must be a valid email address."
  }
}
```

## Rate Limiting

Can-O-Forms implements IP-based rate limiting to prevent spam:

- **Limit**: 10 submissions per minute per IP address
- **Tracking**: Based on hashed IP address
- **Reset**: Limits reset after 1 minute
- **Response**: 429 status code when exceeded

Legitimate users are unlikely to hit this limit. Consider the limit when testing.

## Origin Validation

Submissions are validated against the site's configured domain:

1. **Cross-origin requests**: Must include `Origin` header matching site's domain
2. **Same-origin requests**: Uses `Referer` header as fallback when browser doesn't send `Origin`
3. Subdomains and www variants are automatically supported

**Examples**:

Site domain: `example.com`
- ✅ `https://example.com` (exact match)
- ✅ `https://www.example.com` (www variant)
- ✅ `https://blog.example.com` (subdomain)
- ✅ `http://localhost` (development/testing)
- ❌ `https://other-site.com`

**Note**: The dashboard preview (e.g., `canoforms.canopyds.com`) is automatically allowed for testing forms in the admin panel.

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
curl -X POST https://canoforms.example.com/api/submit/YOUR_API_KEY/contact \
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
fetch('https://canoforms.example.com/api/submit/YOUR_API_KEY/contact', {
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

## Public API Surface

- **Embed API** - `/api/embed/...` - Used by the embed script (GET + POST)
- **Manual Submit API** - `/api/submit/...` - Direct POST submissions for whiteboxed HTML
