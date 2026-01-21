# Creating and Managing Forms

Forms represent individual forms on your website. Each form has a unique slug and can be configured with fields, validation rules, email notifications, success behavior, and spam protection.

## Creating a Form

1. Navigate to a site by clicking on it
2. Click **New Form**
3. Fill in the form details:
   - **Name**: A friendly name (e.g., "Contact Form")
   - **Slug**: URL-friendly identifier (e.g., "contact")
   - **Notification Emails**: Comma-separated email addresses
   - **Honeypot Field**: Optional field name for spam detection
4. Click **Create Form**

After creating a form, you'll be taken to the form page where you can add fields using the field builder.

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

## Adding Fields to a Form

Forms in v2 support a visual field builder. To add fields:

1. Click on a form name
2. Click **Edit Form**
3. Scroll to the **Fields** section
4. Click **Add Field** to open the field editor

### Field Types

- **Text** - Single-line text input
- **Email** - Email input with automatic format validation
- **Textarea** - Multi-line text input
- **Select** - Dropdown menu (requires options to be configured)
- **Checkbox** - Single checkbox input
- **Hidden** - Hidden field (not visible to users)

### Field Configuration

For each field, you can configure:

- **Field Name** - Internal identifier (used in submissions)
- **Label** - User-facing label
- **Placeholder** - Hint text shown in empty fields
- **Required** - Whether the field must be filled
- **Validation Rules** (Text/Email/Textarea):
  - Minimum length
  - Maximum length
  - Regex pattern
  - Custom error message
- **Options** (Select only):
  - Add value/label pairs for dropdown choices
  - Reorder options

### Reordering Fields

Use the **Up** and **Down** buttons next to each field to change the order. Fields will appear in this order in the embed.

## Viewing Form Details

Click on a form name to view:
- Form configuration
- Field list
- Integration code (v2 embed script or v1 API)
- List of recent submissions
- Quick actions to edit or view submissions

## Editing a Form

1. Click on a form name
2. Click **Edit Form**

The edit page has three main sections:

### Fields Section
- Add, edit, delete, and reorder fields
- Configure validation rules

### Success Behavior Section
- **Success Message** - Text shown after successful submission (if no redirect is set)
- **Redirect URL** - URL to redirect to after submission (takes precedence over message)

### Embed Appearance Section
Configure default theme for the embed:
- **Font Family** - CSS font-family string (e.g., "Inter, system-ui")
- **Font CSS URL** - URL to font stylesheet (e.g., Google Fonts)
- **Text Color** - Hex color for text
- **Background Color** - Hex color for form background
- **Primary Color** - Accent color (buttons, focus rings)
- **Border Color** - Input border color
- **Border Radius** - Corner radius in pixels
- **Density** - Spacing: "compact", "normal", or "comfortable"

### Form Details
- Update name, slug, notification emails, and honeypot field

Click **Save** on each section to apply changes.

## Integration Helper

Click **Integration** on a form to see ready-to-use code snippets for:

### v2 Embed Script (Recommended)
- Single `<script>` tag embed code
- Works with Figma Sites and static pages
- No HTML form writing required

### v1 API Integration
- HTML form examples
- JavaScript/AJAX submissions
- Fetch API examples

Copy and paste the code directly into your static site.

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
