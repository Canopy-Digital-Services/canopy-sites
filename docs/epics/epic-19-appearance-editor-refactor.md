# Epic 19: Appearance Editor Refactor

## Status: Complete (v4.9.0)

## Summary

Restructured the Appearance editor from a two-level collapse (outer collapsible Card with inner subsections) into 4 always-visible collapsed groups with summary chips. Added a `pageBackground` theme token for hosted form pages.

## Changes

### New Section Layout

```
Appearance  (always-open Card, no outer collapse)
├─ Page        [swatch]                    ← NEW section
├─ Colors      [swatch] [swatch] [swatch]
├─ Layout      radius 8 · compact · auto btn
└─ Text        Inter · 14px · title L · UPPERCASE
```

### Page (hosted-only)
- Page Background Color (new `pageBackground` token)
- Helper text: "Applied when the form is hosted as a standalone page."

### Colors (6 color pickers in one grid)
- Form Background, Field Background, Field Border, Text Color, Button Color
- Title Color (moved from old Title Style subsection)

### Layout (spatial/sizing)
- Border Radius, Density
- Button Width, Button Alignment (conditional on auto width)

### Text (typography + text content)
- Body Font, Heading Font, Base Font Size
- Title sub-area (separator + heading): Size, Weight
- Labels sub-area: Weight, Transform
- Button Text sub-area

## Files Modified

| File | Change |
|------|--------|
| `embed/src/theme.ts` | Added `pageBackground?: string` to `ThemeTokens` type |
| `public/embed.js` | Rebuilt with updated type |
| `src/components/forms/appearance-section.tsx` | Full restructure into Page/Colors/Layout/Text groups |
| `src/components/forms/hosted-form-page.tsx` | Reads `pageBackground` from theme, applies to page wrapper |

## Commits

1. `feat(embed): add pageBackground token to ThemeTokens` — theme.ts + embed.js
2. `refactor(appearance): restructure editor into Page/Colors/Layout/Text groups` — appearance-section.tsx
3. `feat(hosted): apply pageBackground color to hosted form pages` — hosted-form-page.tsx
