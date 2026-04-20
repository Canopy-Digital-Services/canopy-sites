---
title: Appearance
description: Theme colors, typography, spacing, and hosted-page layout.
icon: Palette
---

The **Appearance** accordion on the Edit tab is where you style a form. All changes autosave and are reflected in the preview to the right; toggle the preview between **Embed** (how the form looks inside a host page) and **Page** (how the hosted page looks).

Appearance is organized into five subsections.

## Page

Applies when the form is viewed on its hosted page at `forms.canopyds.com/f/<form-id>`. These settings don't affect the embed.

- **Page Background Color**: the color behind the form card.
- **Wrap form in a card**: toggle the rounded surface around the form. Turn it off for a flat look.
- **Card Shadow**: None, Light, Medium, Heavy. Only shown when the card is enabled.
- **Content Width**: Narrow (480px), Medium (640px), or Wide (768px).
- **Vertical Alignment**: Top (form sits near the top of the viewport) or Center (form is vertically centered).

## Form

Applies to the form itself in both the embed and the hosted page.

- **Background**: the form's inner surface color.
- **Field Background**: the color inside inputs, textareas, and selects.
- **Field Border**: border color for inputs.
- **Border Radius**: pixel radius for inputs and the submit button. 0 for square corners.
- **Density**: Compact, Normal, or Comfortable. Controls spacing between fields.
- **Button Width**: Full Width or Auto.
- **Button Alignment**: Left, Center, or Right. Only shown when Button Width is Auto.

All colors accept hex input. The color swatch next to each input opens the native picker.

## Headings

Covers the form title and all field labels.

- **Font**: pick a Google Font or System Default. Curated heading fonts are surfaced first.
- **Weight**: Regular or Bold. Light is only shown when the selected font has a 300 weight.
- **Color**: a color override for headings. Leave blank to inherit the body text color.
- **Case**: Normal or Uppercase. Applies to field labels.
- **Title Size**: Small, Medium, Large, or Extra Large.
- **Label Size**: Small, Medium, Large, or Extra Large.

## Body

Controls the rest of the form's typography.

- **Font**: the body font. Used for input text, help text, and the description.
- **Base Font Size (px)**: 10 to 24.
- **Text Color**: body copy and input text color. Placeholder text is rendered at reduced opacity of this color.

## Button

- **Button Text**: custom submit button label (for example, "Send Message" or "Subscribe"). Defaults to "Submit".
- **Button Color**: the submit button background color. Button text color is derived automatically for contrast (white on dark backgrounds, dark on light).

## Live preview

The preview to the right of the editor updates as you type. Use the **Embed** / **Page** toggle at the top to switch between:

- **Embed**: the form rendered inside a generic container, matching what visitors to your site will see.
- **Page**: the hosted page at `/f/<form-id>`, including the Page-level settings (background, card, width, alignment).

On mobile or narrow windows, the preview hides and is accessible through the preview tab on the right edge.

## Theme overrides on a specific embed

You can override the saved theme for a single embed without changing the form's default. Add a `data-theme` attribute to the container with a JSON object:

```html
<div
  data-canopy-form="YOUR_FORM_ID"
  data-base-url="https://forms.canopyds.com"
  data-theme='{"primary":"#005F6A","radius":12,"density":"comfortable"}'
></div>
<script src="https://forms.canopyds.com/embed.js" defer></script>
```

Override properties are merged on top of the saved defaults, so you only need to specify what's changing.

**Commonly overridden keys:**

- Typography: `bodyFont`, `headingFont`, `fontSize`, `titleWeight`, `titleSize`, `labelSize`, `labelTransform`
- Colors: `text`, `titleColor`, `background`, `fieldBackground`, `border`, `primary`
- Layout: `radius`, `density`, `buttonWidth`, `buttonAlign`, `buttonText`
- Page surface (hosted page only): `pageBackground`, `cardEnabled`, `cardShadow`, `contentWidth`, `verticalAlign`

Colors accept hex (`#005F6A`), RGB (`rgb(0, 95, 106)`), HSL, or CSS variables.

## CSS custom properties

The embed exposes its theme values as CSS custom properties on the form root, so you can read them in your own stylesheet if needed. The properties are scoped under `.canopy-root` to prevent collisions with your site's CSS.

- `--canopy-bg`, `--canopy-field-bg`, `--canopy-border`
- `--canopy-text`, `--canopy-primary`, `--canopy-button-text`
- `--canopy-radius`
- `--canopy-font`, `--canopy-font-size`

All embed classes are prefixed with `canopy-` (`canopy-root`, `canopy-form`, `canopy-field`, `canopy-input`, `canopy-submit`, `canopy-label`, `canopy-error`).
