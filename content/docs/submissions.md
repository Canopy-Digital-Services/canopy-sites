# Managing Submissions

Submissions are the form data entries collected from your forms. Each submission contains the form field values, metadata about the submission, and status information.

## Overview

A **Submission** represents a single form submission containing:
- **Form data**: All field values submitted by the user (as JSON)
- **Metadata**: IP hash, user agent, referrer, origin
- **Status**: NEW, READ, or ARCHIVED
- **Spam flag**: Whether the submission was detected as spam
- **Timestamp**: When the submission was created

**Key features:**
- View all submissions for a form
- Filter by status and spam
- View detailed submission data
- Update submission status
- Mark/unmark spam
- Export submissions (CSV or JSON)

## Viewing Submissions

### Submissions List

1. Navigate to a form's edit page
2. Click **Submissions** in the sidebar (or go to `/forms/{formId}/submissions`)
3. View the list of submissions

**List displays:**
- **Date**: Submission date and time
- **Status**: NEW, READ, or ARCHIVED (with badge)
- **Spam**: SPAM badge if marked as spam
- **Preview**: First two fields with truncated values
- **Actions**: View button to see full details

**Default view:**
- Shows last 50 submissions
- Sorted by date (newest first)
- All statuses and spam/not spam included

### Filtering Submissions

Use the filter buttons to narrow down submissions:

**Status filters:**
- **All**: Show all submissions regardless of status
- **NEW**: Only unread submissions (default status)
- **READ**: Only submissions marked as read
- **ARCHIVED**: Only archived submissions

**Spam filters:**
- **All**: Show spam and non-spam submissions
- **Not Spam**: Only legitimate submissions
- **Spam**: Only spam submissions

**Combining filters:**
- Filters work together (e.g., "NEW" + "Not Spam")
- URL parameters preserve filter state
- Refresh page to maintain filters

## Submission Details

Click **View** on any submission to see full details:

### Form Data

All submitted field values are displayed:
- Field names as labels
- Field values as content
- Complex values (arrays, objects) shown as JSON
- Empty/null values shown as blank

**Example:**
```
name: John Doe
email: john@example.com
message: Hello, I'm interested in...
```

### Metadata

Each submission includes metadata for security and tracking:

**IP Hash:**
- SHA-256 hash of the submitter's IP address
- Privacy-preserving (cannot be reversed)
- Used for rate limiting and abuse detection

**User Agent:**
- Browser/client information
- Example: `Mozilla/5.0 (Windows NT 10.0; Win64; x64)...`

**Referrer:**
- The page URL that referred the submission
- May be `null` if direct access or privacy settings

**Origin:**
- The origin domain of the submission
- Used for origin validation
- Example: `https://example.com`

**Note**: Metadata is collected automatically and cannot be edited.

## Submission Status

Submissions have three possible statuses:

### NEW (Default)

- **When**: Automatically set when submission is created
- **Purpose**: Indicates unread submissions
- **Visual**: Highlighted badge in list
- **Action**: Mark as Read to change status

### READ

- **When**: Manually marked after reviewing
- **Purpose**: Indicates processed submissions
- **Visual**: Secondary badge in list
- **Action**: Mark as New or Archive

### ARCHIVED

- **When**: Manually archived for long-term storage
- **Purpose**: Organize old submissions
- **Visual**: Secondary badge in list
- **Action**: Mark as New or Read

### Changing Status

From the submission detail page:
1. Click the appropriate status button:
   - **Mark as Read**: Change to READ
   - **Archive**: Change to ARCHIVED
   - **Mark as New**: Change back to NEW
2. Status updates immediately
3. Page refreshes to show new status

**Note**: Buttons are disabled if submission already has that status.

## Spam Management

### Automatic Spam Detection

Submissions are automatically marked as spam if:
- Honeypot field is filled (hidden field designed to catch bots)
- Form has honeypot enabled and bot fills the field

**Honeypot fields:**
- Invisible to users
- Bots often fill them
- Legitimate users never see or fill them
- See [Forms](./forms.md) for enabling honeypot

### Manual Spam Marking

You can manually mark submissions as spam or not spam:

1. Open submission details
2. Click **Mark as Spam** or **Not Spam**
3. Status toggles immediately
4. SPAM badge appears/disappears in list

**Use cases:**
- False positives (legitimate submission caught by honeypot)
- False negatives (spam that passed honeypot)
- Manual review and correction

**Note**: Spam status is independent of submission status (NEW/READ/ARCHIVED).

## Exporting Submissions

Export submissions for analysis, backup, or external processing:

### Export Options

1. Go to submissions list page
2. Click **Export** dropdown
3. Choose format:
   - **Export CSV**: Comma-separated values file
   - **Export JSON**: JSON format file

### CSV Export

**Format:**
- One row per submission
- Headers: ID, Date, Status, Is Spam, all form fields, metadata columns
- All submissions exported (not just visible ones)
- Proper CSV escaping for special characters

**Columns:**
- `ID`: Submission unique identifier
- `Date`: ISO 8601 timestamp
- `Status`: NEW, READ, or ARCHIVED
- `Is Spam`: "Yes" or "No"
- Form field columns (dynamic based on form fields)
- `IP Hash`: Hashed IP address
- `User Agent`: Browser user agent string
- `Referrer`: Referrer URL
- `Origin`: Origin domain

**Filename**: `{form-slug}-submissions-{date}.csv`

**Example:**
```csv
ID,Date,Status,Is Spam,name,email,message,IP Hash,User Agent,Referrer,Origin
"abc123","2026-01-24T10:30:00Z","NEW","No","John Doe","john@example.com","Hello","abc...","Mozilla/5.0...","https://example.com/contact","https://example.com"
```

### JSON Export

**Format:**
- Array of submission objects
- Pretty-printed JSON (2-space indentation)
- All submissions exported
- Complete data structure

**Structure:**
```json
[
  {
    "id": "abc123",
    "createdAt": "2026-01-24T10:30:00.000Z",
    "status": "NEW",
    "isSpam": false,
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "message": "Hello"
    },
    "meta": {
      "ipHash": "abc...",
      "userAgent": "Mozilla/5.0...",
      "referrer": "https://example.com/contact",
      "origin": "https://example.com"
    }
  }
]
```

**Filename**: `{form-slug}-submissions-{date}.json`

### Export Limitations

- **No filtering**: Exports all submissions (not just filtered view)
- **No pagination**: All submissions in one file
- **Large forms**: May take time for forms with many submissions
- **Browser download**: File downloads via browser (no email)

## How Submissions Are Created

### Submission Process

1. **User submits form**: Via embed script or manual API
2. **Validation**: Server validates all fields (required, types, patterns)
3. **Spam check**: Honeypot field checked if enabled
4. **Metadata collection**: IP hash, user agent, referrer, origin collected
5. **Storage**: Submission saved to database with status "NEW"
6. **Email notifications**: Sent if enabled (and not spam)
7. **Response**: Success response returned to client

### Security Checks

Before creating submission:
- ✅ Origin validation (domain must match site domain)
- ✅ Rate limiting (prevents abuse)
- ✅ Payload size limit (64KB maximum)
- ✅ Field validation (required, types, patterns)
- ✅ Honeypot check (if enabled)

### Submission Data Structure

**Form data (`data` field):**
- JSON object with field names as keys
- Values match submitted form field values
- Arrays/objects preserved for complex fields
- Example: `{ "name": "John", "email": "john@example.com" }`

**Metadata (`meta` field):**
- JSON object with submission metadata
- Always includes: `ipHash`, `userAgent`, `referrer`, `origin`
- Some fields may be `null` if unavailable

## Best Practices

### Organizing Submissions

1. **Review regularly**: Check NEW submissions frequently
2. **Mark as READ**: After processing, mark as read
3. **Archive old**: Archive submissions older than needed
4. **Filter effectively**: Use status and spam filters to focus

### Spam Management

1. **Enable honeypot**: Use honeypot fields for automatic detection
2. **Review spam**: Check spam folder for false positives
3. **Manual correction**: Toggle spam status when needed
4. **Monitor patterns**: Look for spam patterns to improve detection

### Export Strategy

1. **Regular exports**: Export periodically for backup
2. **Before deletion**: Export before bulk operations
3. **Format choice**: Use CSV for spreadsheets, JSON for applications
4. **Data retention**: Keep exports for compliance/records

### Privacy Considerations

1. **IP hashing**: IP addresses are hashed (not stored in plain text)
2. **Metadata**: Review metadata before sharing exports
3. **GDPR/CCPA**: Export and delete submissions as needed
4. **Data minimization**: Only export what you need

## Troubleshooting

### Submissions Not Appearing

**Check:**
- Is the form receiving submissions? (test with a submission)
- Are you viewing the correct form?
- Are filters hiding submissions?

**Solution:**
- Test form submission
- Verify form ID matches
- Clear filters (set to "All")

### Can't Change Status

**Check:**
- Are you logged in?
- Do you own the form?
- Is the submission page loading correctly?

**Solution:**
- Verify authentication
- Check form ownership
- Refresh the page

### Export Not Working

**Check:**
- Are there submissions to export?
- Is the form accessible?
- Is the browser blocking downloads?

**Solution:**
- Verify submissions exist
- Check form ownership
- Check browser download settings
- Try different browser

### Spam Detection Issues

**False positives (legitimate marked as spam):**
- Check honeypot field name
- Verify honeypot is properly hidden
- Manually mark as "Not Spam"

**False negatives (spam not detected):**
- Enable honeypot if not enabled
- Consider additional spam protection
- Manually mark as spam

### Missing Metadata

**Check:**
- Some metadata may be `null` (normal)
- Referrer often missing (privacy settings)
- Origin should always be present

**Solution:**
- `null` values are expected in some cases
- Check browser privacy settings
- Verify origin validation is working

## Related Documentation

- [Forms](./forms.md) - Creating forms and enabling honeypot
- [Email Notifications](./email-notifications.md) - Receiving submission alerts
- [API Reference](./api.md) - Submission API endpoints
- [Security & Privacy](./security.md) - IP hashing and privacy features
- [Integration Guide](./integration.md) - Embedding forms
