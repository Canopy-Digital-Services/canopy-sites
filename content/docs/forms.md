# Creating and Managing Forms

Forms represent individual forms on your website. Each form has a unique slug and can be configured with email notifications and spam protection.

## Creating a Form

1. Navigate to a site by clicking on it
2. Click **New Form**
3. Fill in the form details:
   - **Name**: A friendly name (e.g., "Contact Form")
   - **Slug**: URL-friendly identifier (e.g., "contact")
   - **Notification Emails**: Comma-separated email addresses
   - **Honeypot Field**: Optional field name for spam detection
4. Click **Create Form**

## Form Configuration

### Form Slug

The slug is used in the API endpoint URL. It should be:
- Lowercase
- Alphanumeric with hyphens
- Unique within the site
- Descriptive (e.g., "contact", "newsletter", "job-application")

**Example**: A form with slug `contact` will submit to:
```
/api/v1/submit/{siteApiKey}/contact
```

### Notification Emails

Enter one or more email addresses (comma-separated) to receive notifications when the form is submitted.

**Example**: 
```
admin@example.com, support@example.com
```

**Requirements**:
- Valid SMTP configuration in your Can-O-Forms environment
- Verified sender email address

### Honeypot Field

A honeypot field is a hidden form field that helps catch spam bots. If a bot fills in this field, the submission is marked as spam.

**How it works**:
1. Add a hidden input field to your HTML form
2. Set the field name here (e.g., "website" or "url")
3. Use CSS to hide it from users: `display: none;`
4. Legitimate users won't fill it, but bots will

**Example**:
```html
<input type="text" name="website" style="display: none;" />
```

## Viewing Form Details

Click on a form name to view:
- Form configuration
- Integration code
- List of recent submissions
- Quick actions to edit or view submissions

## Editing a Form

1. Click on a form name
2. Click **Edit Form**
3. Update any details
4. Click **Save Changes**

## Integration Helper

Click **Integration** on a form to see ready-to-use code snippets for:
- HTML forms
- JavaScript/AJAX submissions
- Fetch API examples

Copy and paste these directly into your static site.

## Deleting a Form

1. Click on a form name
2. Click **Delete Form**
3. Confirm the deletion

**Warning**: Deleting a form will permanently delete all submissions. This action cannot be undone.

## Form Best Practices

- Use descriptive slugs that match the form's purpose
- Set up notification emails to stay informed of submissions
- Always use honeypot fields for public-facing forms
- Test your forms after integration
- Monitor submissions regularly through the admin dashboard
