# Creating and Managing Forms

Forms represent individual forms on your website. Each form has a unique slug and can be configured with fields, validation rules, email notifications, success behavior, and spam protection.

## Creating a Form

1. Navigate to **Forms** in the sidebar
2. Click **New Form**
3. Enter a form name (e.g., "Newsletter signup", "Contact form")
4. Click **Create form**

A URL-friendly slug is automatically generated from the form name. After creating a form, you'll be taken to the form editor where you can add fields, configure behavior, and customize appearance.

## Form Configuration

### Form Slug

The slug is automatically generated from your form name and serves as a friendly identifier. It will be:
- Lowercase
- Alphanumeric with hyphens
- Unique within your account
- Descriptive (e.g., "contact", "newsletter", "job-application")

If a slug already exists, a number is automatically appended (e.g., "contact-2"). The slug is used for display purposes and helps you identify forms in the dashboard.

### Form Name

The form name is displayed in the admin dashboard and email notifications. It's a friendly identifier that helps you organize your forms.

## Adding Fields to a Form

Forms support a visual field builder. To add fields:

1. Click on a form name
2. Click **Edit Form**
3. Scroll to the **Fields** section
4. Click **Add Field** to open the field editor

### Field Types

Canopy Forms supports nine field types:

- **Text** - Single-line text input
- **Email** - Email input with automatic format validation
- **Textarea** - Multi-line text input
- **Select** - Dropdown menu (requires options to be configured)
- **Checkbox** - Single checkbox input
- **Phone** - Phone number input with format validation (v3.2.0+)
- **Date** - Date picker input with date range validation (v3.2.0+)
- **Name** - Composite name field with configurable parts (first, last, middle, etc.) (v3.2.0+)
- **Hidden** - Hidden field (not visible to users, useful for tracking, UTM params, etc.)

### Field Configuration

For each field, you can configure:

- **Label** - User-facing label displayed on the form (required)
  - An internal key is automatically generated from the label (e.g., "Email Address" → `email_address`)
  - The internal key is used in submissions and stays stable even if you change the label later
  - You can see the internal key when editing an existing field
- **Placeholder** - Hint text shown in empty fields
- **Required** - Whether the field must be filled before submission
- **Help text** - Optional guidance text displayed below the input field in a muted style (v3.7.2+)
  - Helps users understand what to enter or provides context
  - Appears below the input on the embedded form
  - Available for all field types
- **Validation Rules** (Text/Email/Textarea/Phone/Date only):
  - Format (alphanumeric, numbers only, letters only, URL, postal codes, etc.)
  - Minimum length
  - Maximum length
  - Date ranges (for Date fields)
  - Phone format (lenient/strict for Phone fields)
  - Email domain rules (for Email fields)
- **Options** (Select only):
  - Add value/label pairs for dropdown choices
  - Reorder options using drag-and-drop
  - Option values must be unique (duplicates can’t be saved)

### Validation Defaults & Limits

Canopy Forms automatically applies sensible character limits to all text-based fields to ensure data quality and prevent abuse:

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

### Appearance Section

Configure default theme for the embed. See [Form Appearance & Behavior](./form-customization.md) for detailed information about theme customization.

### After Submission Section

Configure what happens after submission and form limits. This section autosaves changes.

**Security:**
- **Allowed Origins** - Domains that can embed and submit to this form

**After Submission:**
- Choose between showing a confirmation message or redirecting to a URL
- **Show confirmation message** - Display text inline after submission
- **Redirect to URL** - Navigate users to another page after submission

**Notifications:**
- **Notify me on new submission** - Receive email notifications for new submissions
  - Notifications include form name, timestamp, and dashboard link
  - Sent to your account email address
  - Spam submissions do not trigger notifications

**Submission Limits:**
- **Stop accepting after** - Set a date/time to stop accepting submissions
- **Maximum submissions** - Limit total number of submissions (spam not counted)
- Leave empty for unlimited submissions

### Form Details

The form name and After Submission settings auto-save as you make changes.

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

1. Go to the **Forms** list page
2. Find the form you want to delete
3. Click the **trash icon** in the Actions column
4. Confirm the deletion

**Warning**: Deleting a form will permanently delete all fields and submissions associated with it. This action cannot be undone.

## Form Best Practices

- Use descriptive slugs that match the form's purpose
- Use clear, descriptive labels for fields (internal keys are auto-generated)
- Set up email notifications to stay informed of submissions
- Always use honeypot fields for public-facing forms
- Test your forms after integration
- Monitor submissions regularly through the admin dashboard
- Use validation rules to ensure data quality
- Set appropriate character limits for text fields

## Related Documentation

- [Form Appearance & Behavior](./form-customization.md) - Theme customization and styling
- [Email Notifications](./email-notifications.md) - Configure email alerts
- [Integration Guide](./integration.md) - Add forms to your site
- [Submissions](./submissions.md) - View and manage form submissions
