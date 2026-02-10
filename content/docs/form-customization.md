# Form Appearance & Behavior

Customize how your forms look and behave when embedded on your site. Canopy Forms provides comprehensive theming options for typography, colors, layout, and submit button styling.

## Overview

Form appearance is controlled through the **default theme** configured in the form editor. You can also override the theme per embed using the `data-theme` attribute. Themes use CSS custom properties (CSS variables) for flexible styling.

## Configuring Form Appearance

1. Navigate to your form
2. Click **Edit Form**
3. Scroll to the **Appearance** section
4. Configure your theme settings
5. Click **Save Appearance**

Changes are saved as the form's default theme and apply to all embeds unless overridden.

## Typography

### Font Family

Choose from popular Google Fonts or use a custom font:

**Google Fonts Available:**
- System Default (inherits from your site)
- Inter
- Roboto
- Open Sans
- Lato
- Montserrat
- Poppins
- Raleway
- Nunito
- Playfair Display
- Merriweather
- Ubuntu
- Urbanist
- Custom

**Using Custom Fonts:**
1. Select **Custom** from the font dropdown
2. Enter your font family (e.g., `'My Font', sans-serif`)
3. Optionally provide a CSS URL to load the font (e.g., Google Fonts URL)

**Example:**
```
Font Family: 'My Custom Font', sans-serif
Font CSS URL: https://fonts.googleapis.com/css2?family=My+Custom+Font:wght@400;600&display=swap
```

### Font Size

Set the base font size for the form (10-24 pixels).

- **Default**: 14px
- **Range**: 10px - 24px
- Affects all text in the form (labels, inputs, buttons)

## Colors & Layout

### Primary Color

The primary color is used for:
- Submit button background
- Required field indicators (asterisks)
- Focus outlines on inputs
- Links and interactive elements

**Format**: Hex color code (e.g., `#0ea5e9`)

**Default**: `#0ea5e9` (blue)

### Border Radius

Controls the corner rounding for inputs, buttons, and form elements.

- **Default**: 8px
- **Range**: 0px (square) to any positive value
- Higher values create more rounded corners

### Density

Controls the spacing between form fields:

- **Compact**: 8px gap between fields (tighter spacing)
- **Normal**: 16px gap between fields (default)
- **Comfortable**: 24px gap between fields (more breathing room)

**Default**: Normal

## Submit Button

### Button Width

- **Full Width**: Button spans 100% of the form width
- **Auto**: Button width fits the content

**Default**: Full Width

### Button Alignment

Only applies when button width is set to **Auto**:

- **Left**: Button aligned to the left
- **Center**: Button centered
- **Right**: Button aligned to the right

**Default**: Left

### Button Text

Customize the submit button text.

- **Default**: "Submit"
- **Custom**: Any text you want (e.g., "Send Message", "Subscribe", "Get Started")

**Example**: Set button text to "Send Message" for a contact form.

## Theme Overrides (Per Embed)

You can override the default theme for specific embeds using the `data-theme` attribute. This is useful when you want different styling for the same form on different pages.

### Using data-theme

Add a `data-theme` attribute to your embed container with a JSON object:

```html
<div 
  data-canopy-form="contact"
  data-site-key="YOUR_API_KEY"
  data-theme='{"primary":"#005F6A","radius":12,"density":"comfortable"}'
></div>
<script src="https://forms.canopyds.com/embed.js" defer></script>
```

### Override Behavior

Theme overrides are merged with the default theme:
1. Default theme is applied first
2. Override values replace matching properties
3. Properties not in the override keep their default values

**Example:**
```html
<!-- Default theme: primary=#0ea5e9, radius=8, density=normal -->
<!-- Override: primary=#005F6A, radius=12 -->
<!-- Result: primary=#005F6A, radius=12, density=normal -->
```

### Available Override Properties

All theme properties can be overridden:

```json
{
  "fontFamily": "Inter, sans-serif",
  "fontSize": 16,
  "fontUrl": "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap",
  "text": "#18181b",
  "background": "#ffffff",
  "primary": "#0ea5e9",
  "border": "#e4e4e7",
  "radius": 8,
  "density": "normal",
  "buttonWidth": "full",
  "buttonAlign": "left",
  "buttonText": "Submit"
}
```

**Note**: Color values can be hex codes (`#0ea5e9`), RGB (`rgb(14, 165, 233)`), HSL (`hsl(200, 90%, 48%)`), or CSS variables (`var(--my-color)`).

## Default Theme Values

If you don't configure a theme, these defaults are used:

```json
{
  "fontFamily": "inherit",
  "fontSize": 14,
  "text": "#18181b",
  "background": "#ffffff",
  "primary": "#0ea5e9",
  "border": "#e4e4e7",
  "radius": 8,
  "density": "normal",
  "buttonWidth": "full",
  "buttonAlign": "left"
}
```

## After Submission Behavior

Configure what happens after a successful form submission. Settings autosave as you make changes.

### Choosing Message or Redirect

In the **After Submission** section of the form editor, use the radio buttons to choose:

**Show confirmation message:**
- Display a custom message inline where the form was
- Message replaces the form content after submission
- Example: "Thank you for your submission! We'll be in touch soon."

**Redirect to URL:**
- Navigate users to another page after submission
- Useful for thank you pages, confirmation flows, or marketing funnels
- Example URLs:
  - Thank you page: `https://example.com/thank-you`
  - Confirmation page: `https://example.com/confirm`
  - Home page: `https://example.com/`

**Note**: You must explicitly choose one option. Switching between options automatically clears the non-selected field.

## Submission Limits

Restrict when or how many times your form can be submitted. Both limits are optional.

### Stop Accepting After Date/Time

Set a deadline after which the form will no longer accept submissions:

1. Go to **After Submission** section → **Submission Limits**
2. Select a date and time in the **Stop accepting after** field
3. Changes save automatically

When the deadline passes, users who attempt to submit will see: "This form is no longer accepting submissions"

**Use cases:**
- Event registrations with deadlines
- Limited-time offers or promotions
- Seasonal forms (e.g., holiday contest entries)
- Applications with closing dates

### Maximum Number of Submissions

Limit the total number of submissions your form will accept:

1. Go to **After Submission** section → **Submission Limits**
2. Enter a number in the **Maximum submissions** field
3. Changes save automatically

When the limit is reached, users who attempt to submit will see: "This form has reached its maximum number of submissions"

**Important**: Spam submissions (caught by honeypot) are not counted toward this limit, so legitimate users aren't blocked by bot activity.

**Use cases:**
- First-come-first-served registrations (e.g., "First 100 registrations")
- Limited beta access signups
- Giveaways or contests with entry limits
- Capacity-limited events

**Tip**: Leave both fields empty for unlimited submissions (default behavior).

## Theme Examples

### Minimal Dark Theme

```json
{
  "primary": "#ffffff",
  "text": "#ffffff",
  "background": "#1a1a1a",
  "border": "#333333",
  "radius": 4,
  "density": "compact"
}
```

### Branded Theme

```json
{
  "fontFamily": "Poppins, sans-serif",
  "fontSize": 16,
  "primary": "#005F6A",
  "radius": 12,
  "density": "comfortable",
  "buttonText": "Get Started"
}
```

### Compact Newsletter Form

```json
{
  "density": "compact",
  "buttonWidth": "auto",
  "buttonAlign": "center",
  "buttonText": "Subscribe",
  "radius": 6
}
```

## CSS Custom Properties

Themes are applied using CSS custom properties (CSS variables). You can target these in your own CSS if needed:

- `--canopy-font`: Font family
- `--canopy-font-size`: Font size
- `--canopy-text`: Text color
- `--canopy-bg`: Background color
- `--canopy-primary`: Primary color
- `--canopy-border`: Border color
- `--canopy-radius`: Border radius
- `--canopy-button-width`: Button width
- `--canopy-button-align`: Button alignment

**Example CSS:**
```css
/* Override form container background */
[data-canopy-form] {
  background: var(--canopy-bg);
  padding: 20px;
  border-radius: var(--canopy-radius);
}
```

## Scoped Styles

Form styles are scoped using the `.canopy-root` class to prevent conflicts with your site's CSS:

- All form styles are prefixed with `.canopy-`
- Styles won't affect other elements on your page
- Your site's CSS won't interfere with form styling

**Class Names:**
- `.canopy-root` - Form container
- `.canopy-form` - Form element
- `.canopy-field` - Field wrapper
- `.canopy-input`, `.canopy-textarea`, `.canopy-select` - Input elements
- `.canopy-submit` - Submit button
- `.canopy-label` - Field labels
- `.canopy-error` - Error messages

## Best Practices

1. **Match Your Brand**: Use your brand colors for primary color
2. **Readability**: Ensure sufficient contrast between text and background
3. **Consistency**: Use the same theme across related forms
4. **Test on Mobile**: Verify themes look good on all screen sizes
5. **Use Overrides Sparingly**: Prefer default theme for consistency, use overrides for special cases
6. **Font Loading**: For custom fonts, ensure the font URL loads quickly
7. **Button Text**: Use clear, action-oriented button text

## Troubleshooting

### Theme Not Applying

**Check:**
- Did you click "Save Appearance"?
- Is the embed using the correct form?
- Are there CSS conflicts on your page?

**Solution:**
- Verify theme is saved in the form editor
- Check browser console for errors
- Use browser dev tools to inspect CSS variables

### Font Not Loading

**Check:**
- Is the font URL correct?
- Is the font family name correct?
- Are there CORS issues with the font URL?

**Solution:**
- Test the font URL in a browser
- Verify font family syntax (e.g., `'Font Name', sans-serif`)
- Use Google Fonts for reliable font loading

### Colors Not Showing

**Check:**
- Is the color format correct (hex, RGB, etc.)?
- Are there CSS conflicts?

**Solution:**
- Use hex color codes for best compatibility
- Check browser dev tools for computed styles
- Verify CSS variables are being set

### Button Not Styling Correctly

**Check:**
- Is button width set correctly?
- Is alignment only used with auto width?

**Solution:**
- Set button width to "auto" before using alignment
- Verify button text is set if you want custom text
- Check that primary color is set for button background

## Related Documentation

- [Forms](./forms.md) - Creating and managing forms
- [Integration Guide](./integration.md) - Adding forms to your site
- [API Reference](./api.md) - API endpoint details
