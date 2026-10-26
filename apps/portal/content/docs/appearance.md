---
title: Styling
description: Theme colors, typography, spacing, and hosted-page layout.
icon: Palette
---

Click **Change styling** at the top of the preview on the Edit tab to style a form. You can do this at any point, before or after adding fields. The styling panel takes the place of the editor until you click **Done**, which returns you to where you were.

The panel lists each part of the form you can style, in the order they appear on the form. Click a part of the preview, or its row in the panel, to open its settings. Hovering either one outlines that part in the preview, and the open row's parts stay marked while you change them. All changes autosave and show in the preview as you make them.

Hosted forms list Page, Form, Title, Text, Labels, Fields, and Button. Embedded forms have no Page row.

All colors accept hex input. The color swatch next to each input opens the native picker.

## Page (hosted forms only)

Applies to the form's hosted page at `forms.canopyds.com/f/<form-id>`.

- **Background**: the color behind the form card.
- **Wrap form in a card**: toggle the rounded surface around the form. Turn it off for a flat look.
- **Card Shadow**: None, Light, Medium, Heavy. Only shown when the card is enabled.
- **Content Width**: Narrow (480px), Medium (640px), or Wide (768px).
- **Vertical Alignment**: Top (form sits near the top of the viewport) or Center (form is vertically centered).

## Form

- **Background**: the form's surface color.
- **Corner Radius (px)**: rounds the corners of the card, the inputs, and the button. 0 for square corners.
- **Density**: Compact, Normal, or Comfortable. Controls spacing between fields.

## Title

The form's title, in the header above the fields.

- **Font**: pick a Google Font. Curated heading fonts are listed first. Embedded forms also offer **Inherit from host page**, which uses your website's CSS font; hosted forms don't, since there's no host page to inherit from.
- **Weight**: Regular or Bold. Light is only offered when the selected font has a 300 weight.
- **Color**: leave blank to use the text color.
- **Size**: Small, Medium, Large, or Extra Large.
- **Case**: Normal or Uppercase.

## Text

The description, help text, option labels, and what people type into fields.

- **Font**: the body font. Embedded forms also offer **Inherit from host page**.
- **Size (px)**: 10 to 24.
- **Color**: placeholder text uses this color at reduced opacity.

## Labels

The label above each field. Same settings as Title, set separately: a bold title can sit over regular labels.

## Fields

- **Background**: the color inside inputs, text areas, and dropdowns.
- **Border**: the border color of those inputs.

## Button

- **Text**: the submit button's label (for example, "Send Message" or "Subscribe"). Defaults to "Submit".
- **Color**: the button's background. Its text color is picked automatically for contrast (white on dark colors, dark on light).
- **Width**: Full Width or Auto.
- **Alignment**: Left, Center, or Right. Only shown when Width is Auto.

## Live preview

The preview to the right of the editor updates as you type. The preview mode is locked to the form's type:

- **Hosted forms** preview as the page at `/f/<form-id>`, including the Page-level settings (background, card, width, alignment).
- **Embedded forms** preview as the form rendered inside a generic container, matching what visitors to your site will see.

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

The title and labels are styled separately: `titleWeight`, `titleColor`, and `titleTransform` change only the title, and the `label` keys only the labels. An older `headingFont` key still works and sets both fonts.

**Commonly overridden keys:**

- Typography: `bodyFont`, `fontSize`, `titleFont`, `titleWeight`, `titleSize`, `titleTransform`, `labelFont`, `labelWeight`, `labelSize`, `labelTransform`
- Colors: `text`, `titleColor`, `labelColor`, `background`, `fieldBackground`, `border`, `primary`
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
