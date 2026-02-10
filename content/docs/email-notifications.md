# Email Notifications

Canopy Forms can send email notifications when forms receive new submissions. This guide covers how to configure and manage email notifications for your forms.

## Overview

Canopy Forms supports two types of email notifications:

1. **Per-Form Account Notifications** (v2.5.0+) - Privacy-focused notifications sent to the account owner
2. **Legacy Custom Recipients** - Notifications sent to custom email addresses (backward compatibility)

Both notification types:
- Are sent only for non-spam submissions
- Are sent asynchronously (fire-and-forget)
- Don't block form submission if email fails
- Require SMTP configuration to be enabled

## Per-Form Account Notifications (Recommended)

The recommended way to receive notifications is using the per-form toggle. This sends a privacy-focused notification to your account email address.

### Enabling Notifications

1. Navigate to your form
2. Click **Edit Form**
3. Scroll to the **After Submission** section
4. Check the **"Notify me on new submission"** checkbox
5. Changes save automatically

**What happens:**
- You'll receive an email notification when someone submits this form
- Notifications are sent to your account email address (the one you used to sign up)
- Notifications are only sent for legitimate submissions (not spam)

### Notification Content

Account owner notifications are **privacy-focused** and include:

- **Form name** - Which form received the submission
- **Timestamp** - When the submission was received
- **Dashboard link** - Direct link to view all submissions for this form

**What's NOT included:**
- Submission field values (name, email, message, etc.)
- Submission metadata (IP hash, user agent, etc.)
- Full submission data

This privacy-focused design ensures sensitive data isn't sent via email. You'll need to log into the dashboard to view the actual submission data.

### Example Notification

```
New form submission received.

Form: Contact Form
Date: 1/24/2026, 2:30:45 PM

View submissions: https://forms.canopyds.com/forms/clx123/submissions

---
This is an automated notification from Canopy Forms.
```

## Legacy Custom Recipients

The legacy `notifyEmails` field allows you to specify custom email addresses to receive notifications. This feature is maintained for backward compatibility.

**Note**: The legacy system includes full submission data in the email, which is less privacy-focused than the per-form toggle.

### Legacy Notification Content

Legacy notifications include:

- **Site name** - Which site the form belongs to
- **Form name** - Which form received the submission
- **Timestamp** - When the submission was received
- **Full submission data** - All form field values as JSON
- **Dashboard link** - Direct link to view the specific submission

**Example:**
```
New form submission received on My Website

Form: Contact Form
Date: 1/24/2026, 2:30:45 PM

Submission Data:
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello!"
}

View in dashboard: https://forms.canopyds.com/forms/clx123/submissions/clx456

---
This is an automated notification from Canopy Forms.
```

## Spam Handling

Email notifications are **never sent for spam submissions**:

- If a submission is marked as spam (honeypot field filled), no notification is sent
- This prevents spam from cluttering your inbox
- Spam submissions are still stored in the database for review

## Configuration Requirements

### SMTP Configuration

Email notifications require SMTP configuration. The platform operator must configure:

- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port (typically 587 for STARTTLS)
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `SMTP_FROM` - Sender email address (optional, defaults to SMTP_USER)

**If SMTP is not configured:**
- Form submissions still work normally
- No email notifications are sent
- A warning is logged: "SMTP not configured, cannot send email"
- No error is shown to the user

### Email Delivery

- **Asynchronous**: Emails are sent in the background (fire-and-forget)
- **Non-blocking**: Email failures don't prevent form submission
- **No retry**: Failed emails are logged but not automatically retried
- **No delivery confirmation**: There's no way to verify if an email was delivered

## When Notifications Are Sent

Notifications are triggered when:

1. ✅ A form submission is successfully validated and stored
2. ✅ The submission is **not** marked as spam
3. ✅ The form has notifications enabled (per-form toggle) or has `notifyEmails` configured
4. ✅ SMTP is properly configured

**Timing:**
- Notifications are sent immediately after submission is stored
- There may be a slight delay (seconds) due to asynchronous processing
- Email delivery depends on your SMTP provider

## Managing Notifications

### Enable/Disable Per Form

1. Go to the form's edit page
2. Open the **After Submission** section
3. Toggle the **"Notify me on new submission"** checkbox
4. Changes save automatically

### Disable All Notifications

- Uncheck the notification toggle on all your forms
- Or disable SMTP configuration (notifications won't be sent)

### Multiple Forms

Each form has its own notification setting. You can:
- Enable notifications for important forms (e.g., contact, support)
- Disable notifications for high-volume forms (e.g., newsletter signups)
- Mix and match based on your needs

## Troubleshooting

### Not Receiving Notifications

**Check:**
1. Is the notification toggle enabled for the form?
2. Is SMTP properly configured?
3. Check your spam/junk folder
4. Verify your account email address is correct
5. Was the submission marked as spam?

**Solution:**
- Verify SMTP configuration with your platform operator
- Check server logs for email errors
- Test with a simple form submission
- Verify your email address in account settings

### Receiving Too Many Notifications

**Solution:**
- Disable the notification toggle for high-volume forms
- Use the dashboard to review submissions in batches
- Consider using the legacy `notifyEmails` only for critical forms

### Notifications Include Spam

**Check:**
- Is your honeypot field configured correctly?
- Are spam submissions being marked correctly in the dashboard?

**Solution:**
- Review spam detection settings
- Spam submissions should not trigger notifications
- Check that honeypot fields are properly hidden in your HTML

### Email Format Issues

**Current limitations:**
- Notifications are sent as plain text
- No HTML formatting
- No custom templates

**Future enhancements:**
- HTML email templates may be added in future versions
- Custom email templates are planned

## Privacy & Security

### Privacy-Focused Design

The per-form notification system (v2.5.0+) is designed with privacy in mind:

- **No submission data in emails** - Field values are excluded
- **Minimal metadata** - Only form name, timestamp, and link
- **Forces dashboard access** - You must log in to view submission details
- **Reduces email risk** - Less sensitive data in email systems

### Email Security

- **SMTP authentication** - Uses secure SMTP credentials
- **STARTTLS** - Encrypted email transmission
- **No plaintext passwords** - SMTP passwords are stored securely
- **Single recipient** - Account notifications go only to your registered email

### Best Practices

1. **Use per-form toggle** - Prefer the privacy-focused account notifications
2. **Review in dashboard** - Always review submissions in the secure dashboard
3. **Secure your email** - Use strong passwords and 2FA on your email account
4. **Monitor spam** - Regularly review spam submissions in the dashboard
5. **Limit legacy notifications** - Use legacy `notifyEmails` sparingly due to data inclusion

## Comparison: Per-Form vs Legacy

| Feature | Per-Form Toggle | Legacy notifyEmails |
|---------|----------------|---------------------|
| **Recipient** | Account owner email | Custom email addresses |
| **Submission Data** | ❌ Excluded (privacy-focused) | ✅ Included (full JSON) |
| **Configuration** | Simple toggle | Email list configuration |
| **Privacy** | ✅ High | ⚠️ Lower (data in email) |
| **Recommended** | ✅ Yes | ⚠️ For backward compatibility |

## Future Enhancements

Planned improvements (not in v3):

- **Multiple recipients** - Add custom email addresses alongside account notifications
- **Email templates** - Customizable email subject and body
- **Delivery tracking** - Log email send attempts and retry failed sends
- **Digest emails** - Daily/weekly summaries instead of per-submission
- **HTML emails** - Rich formatting for notifications
- **Unsubscribe options** - Manage notification preferences

## Related Documentation

- [Forms](./forms.md) - Creating and managing forms
- [Submissions](./submissions.md) - Viewing and managing submissions
- [Security & Privacy](./security.md) - Security features and best practices
