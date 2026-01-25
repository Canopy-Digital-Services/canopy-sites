# Creating and Managing Forms

Forms represent individual forms on your website. Each form has a unique slug and can be configured with fields, validation rules, email notifications, success behavior, and spam protection.

## Creating a Form

1. Navigate to **Forms** in the sidebar
2. Click **New Form**
3. Fill in the form details:
   - **Name**: A friendly name (e.g., "Contact Form")
   - **Slug**: URL-friendly identifier (e.g., "contact")
   - **Site**: Select which site this form belongs to
4. Click **Create Form**

After creating a form, you'll be taken to the form editor where you can add fields, configure behavior, and customize appearance.

## Form Configuration

### Form Slug

The slug is used in the API endpoint URL. It should be:
- Lowercase
- Alphanumeric with hyphens
- Unique within the site
- Descriptive (e.g., "contact", "newsletter", "job-application")

**Example**: A form with slug `contact` will submit to:
```
/api/submit/{siteApiKey}/contact
```

### Form Name

The form name is displayed in the admin dashboard and email notifications. It's a friendly identifier that helps you organize your forms.

## Adding Fields to a Form

Forms support a visual field builder. To add fields:

1. Click on a form name
2. Click **Edit Form**
3. Scroll to the **Fields** section
4. Click **Add Field** to open the field editor

### Field Types

Can-O-Forms supports six field types:

- **Text** - Single-line text input
- **Email** - Email input with automatic format validation
- **Textarea** - Multi-line text input
- **Select** - Dropdown menu (requires options to be configured)
- **Checkbox** - Single checkbox input
- **Hidden** - Hidden field (not visible to users, useful for tracking, UTM params, etc.)

### Field Configuration

For each field, you can configure:

- **Field Name** - Internal identifier (used in submissions, must be unique per form)
- **Label** - User-facing label displayed on the form
- **Placeholder** - Hint text shown in empty fields
- **Required** - Whether the field must be filled before submission
- **Validation Rules** (Text/Email/Textarea only):
  - Minimum length
  - Maximum length
  - Regex pattern
  - Custom error message
- **Options** (Select only):
  - Add value/label pairs for dropdown choices
  - Reorder options using Up/Down buttons

### Validation Defaults & Limits

Can-O-Forms automatically applies sensible character limits to all text-based fields to ensure data quality and prevent abuse:

**Default Character Limits** (when you don't set a maximum):
- **Text fields**: 200 characters
- **Email fields**: 254 characters (RFC 5321 standard)
- **Textarea fields**: 2,000 characters

**Absolute Maximum Limits** (enforced server-side for security):
- **Text fields**: 500 characters maximum
- **Email fields**: 320 characters maximum
- **Textarea fields**: 10,000 characters maximum

**How It Works**:
- If you don't set a maximum length, the default applies automatically
- If you set a custom maximum, it will be enforced (up to the absolute limit)
- Textareas automatically size themselves based on the character limit
- Limits are enforced at three levels: browser (HTML), client-side validation, and server-side validation
- Textarea resize handles are disabled to maintain consistent appearance

### Reordering Fields

Use the **Up** and **Down** buttons next to each field in the field list to change the order. Fields will appear in this order in the embed and manual submit forms.

## Viewing Form Details

Click on a form name to view:
- Form configuration
- Field list
- Integration code (embed script or manual submit API)
- List of recent submissions
- Quick actions to edit or view submissions

## Editing a Form

1. Click on a form name
2. Click **Edit Form**

The edit page has three main sections:

### Fields Section

- Add, edit, delete, and reorder fields
- Configure validation rules
- Set field types and options

### Behavior Section

Configure what happens after submission:

- **Success Message** - Text shown after successful submission (if no redirect is set)
- **Redirect URL** - URL to redirect to after submission (takes precedence over message)
- **Email Notifications** - Toggle to receive email notifications when this form is submitted (v2.5.0+)
  - When enabled, you'll receive a minimal notification with form name, timestamp, and dashboard link
  - Notifications are sent to your account email address
  - Spam submissions do not trigger notifications

**Note**: The legacy `notifyEmails` field is still supported for backward compatibility, but the per-form toggle is the recommended approach.

### Appearance Section

Configure default theme for the embed. See [Form Appearance & Behavior](./form-customization.md) for detailed information about theme customization.

### Form Details

The form name is auto-saved as you type. You can also update the slug and site association from the form editor.

Click **Save** on each section to apply changes.

## Form Settings

### Honeypot Field (Spam Protection)

A honeypot field is a hidden form field that helps catch spam bots. If a bot fills in this field, the submission is marked as spam.

**How it works**:
1. Configure a honeypot field name in the form settings (e.g., "website" or "url")
2. Add a hidden input field to your HTML form (if using manual submit API)
3. Use CSS to hide it from users: `display: none;`
4. Legitimate users won't fill it, but bots will

**Example** (for manual submit API):
```html
<input type="text" name="website" style="display: none;" />
```

**Note**: If you're using the embed script, the honeypot field is automatically handled for you.

## Integration Helper

Click **Integrate** on a form to see ready-to-use code snippets for:

### Embed Script (Recommended)
- Single `<script>` tag embed code
- Works with Figma Sites and static pages
- No HTML form writing required

### Manual Submit API
- HTML form examples
- JavaScript/AJAX submissions
- Fetch API examples

Copy and paste the code directly into your static site. See the [Integration Guide](./integration.md) for detailed instructions.

## Deleting a Form

1. Click on a form name
2. Click **Delete Form**
3. Confirm the deletion

**Warning**: Deleting a form will permanently delete all fields and submissions associated with it. This action cannot be undone.

## Form Best Practices

- Use descriptive slugs that match the form's purpose
- Set up email notifications to stay informed of submissions
- Always use honeypot fields for public-facing forms
- Test your forms after integration
- Monitor submissions regularly through the admin dashboard
- Use validation rules to ensure data quality
- Keep field names lowercase and use hyphens (e.g., "first-name" not "firstName")
- Set appropriate character limits for text fields

## Related Documentation

- [Form Appearance & Behavior](./form-customization.md) - Theme customization and styling
- [Email Notifications](./email-notifications.md) - Configure email alerts
- [Integration Guide](./integration.md) - Add forms to your site
- [Submissions](./submissions.md) - View and manage form submissions
