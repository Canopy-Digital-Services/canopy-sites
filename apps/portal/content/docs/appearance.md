---
title: Styling
description: Theme colors, typography, spacing, and hosted-page layout.
icon: Palette
---

Click **Change styling** at the top of the preview on the Edit tab to style a form. You can do this at any point, before or after adding fields. The styling panel takes the place of the editor until you click **Done**, which returns you to where you were.

The panel lists each part of the form you can style: the page and form first, then the type from most to least prominent (title, labels, text), then the fields and button. Click a part of the preview, or its row in the panel, to open its settings. Hovering either one outlines that part in the preview, and the open row's parts stay marked while you change them. All changes autosave and show in the preview as you make them.

Hosted forms list Page, Form, Title, Labels, Text, Fields, and Button. Embedded forms have no Page row.

Click a color swatch to pick a color. The first time, it opens your computer's color picker, where you can also type a hex value. Once you've set a color anywhere in the form, every swatch shows the colors you've set, so matching the title to the button is one click. Hover over a color to see what uses it, or choose **New color** to open the color picker again.

## Page (hosted forms only)

Applies to the form's hosted page at `forms.canopyds.com/f/<form-id>`.

- **Background**: the color behind the form card.
- **Card**: No card, Flat (a card with no shadow), or a Light, Medium, or Heavy shadow.
- **Width**: Narrow (480px), Medium (640px), or Wide (768px). The preview is narrower than a real page, so it shows Wide filling the preview and the others in proportion.

## Form

- **Background**: the form's surface color.
- **Corners**: Square, Slight, Round, or Rounder. Rounds the card, the inputs, and the button together.
- **Spacing**: Compact, Normal, or Roomy. The space between fields.

## Title

The form's title, in the header above the fields. Its settings sit on one line, like a word processor's toolbar. Hover over a control to see its name.

- **Font**: pick a Google Font. Curated heading fonts are listed first. Until you pick one, the title uses the text font, and the picker shows its name.
- **Color**: the swatch beside the font. Until you pick one, the title uses the text color.
- **Size**: 20, 28, 36, or 48 pixels. 28 is the default.
- **Bold**: turns bold on or off.
- **Alignment**: left or center.

## Labels

The label above each field. The same toolbar as Title, set separately (a bold title can sit over regular labels), without alignment, since labels line up with their fields.

- **Font**: until you pick one, labels use the text font.
- **Color**: until you pick one, labels use the text color.
- **Size**: 16, 18, 20, or 24 pixels. 18 is the default.
- **Bold**: turns bold on or off.

## Text

The description, help text, option labels, and what people type into fields. Same toolbar as Title: font, color, and size.

- **Font**: the body font. Hosted forms use Inter until you pick one. Embedded forms also offer **Inherit from host page**, which uses your website's CSS font.
- **Color**: placeholder text uses this color at reduced opacity.
- **Size**: 14, 16, or 18 pixels. 16 is the default; on iPhones, fields with smaller text zoom in when tapped.

## Fields

- **Background**: the color inside inputs, text areas, and dropdowns.
- **Border**: the border color of those inputs.

## Button

- **Text**: the submit button's label (for example, "Send Message" or "Subscribe"). Defaults to "Submit". The swatch beside it is the text's color. Until you pick one, it's chosen for you so it's easy to read: white on dark buttons, and on light ones your text color, or near-black if your text color is too light.
- **Color**: the button's background.
- **Width**: **Full**, spanning the form, or as wide as its text and placed at the left, center, or right. Hover over an icon to see its name.

The button's text uses the font and size set under **Text**, in semibold.

## Live preview

The preview to the right of the editor updates as you type. The preview mode is locked to the form's type:

- **Hosted forms** preview as the page at `/f/<form-id>`, including the Page-level settings (background, card, width).
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

The title and labels are styled separately: `titleWeight`, `titleColor`, and `titleAlign` change only the title, and the `label` keys only the labels. `titleSize`, `labelSize`, and `fontSize` are numbers of pixels (`"titleSize":36`). An older `headingFont` key still works and sets both fonts.

**Commonly overridden keys:**

- Typography: `bodyFont`, `fontSize`, `titleFont`, `titleWeight`, `titleSize`, `titleAlign`, `labelFont`, `labelWeight`, `labelSize`
- Colors: `text`, `titleColor`, `labelColor`, `background`, `fieldBackground`, `border`, `primary`, `buttonTextColor`
- Layout: `radius`, `density`, `buttonWidth`, `buttonAlign`, `buttonText`
- Page surface (hosted page only): `pageBackground`, `cardEnabled`, `cardShadow`, `contentWidth`

Colors accept hex (`#005F6A`), RGB (`rgb(0, 95, 106)`), HSL, or CSS variables.

## CSS custom properties

The embed exposes its theme values as CSS custom properties on the form root, so you can read them in your own stylesheet if needed. The properties are scoped under `.canopy-root` to prevent collisions with your site's CSS.

- `--canopy-bg`, `--canopy-field-bg`, `--canopy-border`
- `--canopy-text`, `--canopy-primary`, `--canopy-button-text`
- `--canopy-radius`
- `--canopy-font`, `--canopy-font-size`

All embed classes are prefixed with `canopy-` (`canopy-root`, `canopy-form`, `canopy-field`, `canopy-input`, `canopy-submit`, `canopy-label`, `canopy-error`).
