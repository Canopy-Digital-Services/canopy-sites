# Form Appearance & Behavior

Customize how your forms look and behave when embedded on your site. Can-O-Forms provides comprehensive theming options for typography, colors, layout, and submit button styling.

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
  data-can-o-form="contact"
  data-site-key="YOUR_API_KEY"
  data-theme='{"primary":"#005F6A","radius":12,"density":"comfortable"}'
></div>
<script src="https://canoforms.canopyds.com/embed.js" defer></script>
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

## Success Behavior

Configure what happens after a successful form submission.

### Success Message

Display a message to users after submission:

1. Go to **Behavior** section in form editor
2. Enter your success message (e.g., "Thank you for your submission!")
3. Click **Save Behavior**

The message appears inline where the form was, replacing the form content.

### Redirect URL

Redirect users to another page after submission:

1. Go to **Behavior** section in form editor
2. Enter a redirect URL (e.g., `https://example.com/thanks`)
3. Click **Save Behavior**

**Priority**: If both success message and redirect URL are set, the redirect takes precedence.

**Example Use Cases:**
- Thank you page: `https://example.com/thank-you`
- Confirmation page: `https://example.com/confirm`
- Home page: `https://example.com/`

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

- `--cof-font`: Font family
- `--cof-font-size`: Font size
- `--cof-text`: Text color
- `--cof-bg`: Background color
- `--cof-primary`: Primary color
- `--cof-border`: Border color
- `--cof-radius`: Border radius
- `--cof-button-width`: Button width
- `--cof-button-align`: Button alignment

**Example CSS:**
```css
/* Override form container background */
[data-can-o-form] {
  background: var(--cof-bg);
  padding: 20px;
  border-radius: var(--cof-radius);
}
```

## Scoped Styles

Form styles are scoped using the `.cof-root` class to prevent conflicts with your site's CSS:

- All form styles are prefixed with `.cof-`
- Styles won't affect other elements on your page
- Your site's CSS won't interfere with form styling

**Class Names:**
- `.cof-root` - Form container
- `.cof-form` - Form element
- `.cof-field` - Field wrapper
- `.cof-input`, `.cof-textarea`, `.cof-select` - Input elements
- `.cof-submit` - Submit button
- `.cof-label` - Field labels
- `.cof-error` - Error messages

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
