# Managing Submissions

View, organize, and export form submissions through the Can-O-Forms admin dashboard.

## Viewing Submissions

To view submissions for a form:

1. Navigate to **Sites**
2. Click on a site
3. Click on a form
4. Click **Submissions**

You'll see a list of all submissions with:
- Submission date and time
- Status (NEW, READ, ARCHIVED)
- Spam flag indicator
- Preview of submission data

## Submission Details

Click on any submission to view:

- **Full submission data**: All form fields and values
- **Metadata**:
  - IP hash (privacy-preserving identifier)
  - User agent (browser/device)
  - Referrer URL
  - Origin domain
- **Status**: Current status of the submission
- **Actions**: Update status or delete

## Submission Status

Each submission has one of three statuses:

| Status | Description | Use Case |
|--------|-------------|----------|
| **NEW** | Unread submission | Default for new submissions |
| **READ** | Acknowledged submission | Mark as reviewed |
| **ARCHIVED** | Old/processed submission | Move to archive after handling |

### Updating Status

1. Click on a submission
2. Click the status button (e.g., "Mark as Read")
3. The status updates immediately

Use statuses to organize your workflow:
- NEW: Submissions requiring attention
- READ: Submissions you've reviewed
- ARCHIVED: Completed or old submissions

## Spam Protection

### Spam Indicators

Submissions marked as spam show a warning icon and are flagged in the list. Spam is detected when:
- The honeypot field is filled
- Rate limits are exceeded (multiple submissions from same IP)

### Viewing Spam

Spam submissions are stored but clearly marked. You can:
- Review to check for false positives
- Delete spam in bulk
- Archive spam submissions

## Exporting Submissions

Export submissions to CSV for backup or analysis:

1. Navigate to a form's submissions page
2. Click **Export to CSV**
3. A CSV file will download containing:
   - Submission ID
   - Timestamp
   - Status
   - Spam flag
   - All form fields (flattened)
   - Metadata

### CSV Format Example

```csv
id,createdAt,status,isSpam,name,email,message,ipHash,userAgent
cm123...,2024-01-15T10:30:00Z,NEW,false,John Doe,john@example.com,Hello!,hash123...,Mozilla/5.0...
```

## Deleting Submissions

### Single Deletion

1. Click on a submission
2. Click **Delete**
3. Confirm the deletion

### Bulk Deletion

Currently, submissions must be deleted individually. For bulk operations, use the export feature to back up data first, then delete through the UI.

**Warning**: Deletion is permanent and cannot be undone.

## Submission Metadata

### IP Hash

For privacy, Can-O-Forms stores a hash of the submitter's IP address rather than the actual IP. This allows you to:
- Identify repeated submissions from the same user
- Detect potential spam patterns
- Maintain user privacy

### User Agent

The browser and device information helps you understand:
- Which devices your users are using
- Browser compatibility issues
- Potential bot submissions (unusual user agents)

### Referrer

The page URL where the form was submitted from. Useful for:
- Tracking which pages generate submissions
- Verifying submissions come from your site
- Understanding user journey

### Origin

The domain where the submission originated. Used for:
- Security validation
- Preventing unauthorized submissions
- Tracking subdomain usage

## Best Practices

1. **Regular Review**: Check new submissions daily or set up email notifications
2. **Status Management**: Use statuses to track your workflow
3. **Spam Monitoring**: Review spam-flagged submissions periodically
4. **Regular Exports**: Export submissions regularly for backup
5. **Archiving**: Archive old submissions to keep active lists manageable
6. **Security**: Monitor unusual patterns in metadata (multiple submissions, strange origins)

## Email Notifications

If configured, you'll receive email notifications for new submissions containing:
- Form name and site
- Submission timestamp
- All form field data
- Link to view in admin dashboard

Configure notification emails in the form settings.
