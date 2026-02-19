# Epic 11: Enhanced Appearance Controls

**Version**: v4.3.0
**Date**: 2026-02-18
**Status**: ✅ Complete

---

## Summary

Reorganized the Appearance section from a flat scrolling list into a structured layout with always-visible global controls and four collapsible subsections. Added five new styling controls for form title and field labels.

---

## New Controls

| Subsection | Control | Values | Default | CSS Variable |
|---|---|---|---|---|
| Title Style | Size | S / M / L / XL | M | `--canopy-title-size` |
| Title Style | Weight | Regular / Semibold / Bold | Semibold | `--canopy-title-weight` |
| Title Style | Color | hex + color picker | *(inherit text color)* | `--canopy-title-color` |
| Labels | Weight | Normal / Medium / Semibold | Medium | `--canopy-label-weight` |
| Labels | Transform | Normal / Uppercase | Normal | `--canopy-label-transform` |

---

## Layout After This Epic

```
Appearance card (outer collapsible — unchanged)
  ├── Colors grid (5 pickers: Form BG, Field BG, Border, Text, Button) — always visible
  ├── Border Radius + Density row — always visible
  ├── [Typography ▶] collapsed → Body Font / Heading Font / Base Size
  ├── [Title Style ▶] collapsed → Size / Weight / Color
  ├── [Labels ▶] collapsed → Weight / Transform
  └── [Submit Button ▶] collapsed → Width / Align / Text
```

Collapsed subsection headers show summary chips for non-default values.

---

## Files Changed

### `embed/src/theme.ts`

- Added 5 new fields to `ThemeTokens`: `titleSize`, `titleWeight`, `titleColor`, `labelWeight`, `labelTransform`
- `applyTheme()` sets 5 new CSS variables using size/weight lookup maps
- `--canopy-title-color` is removed (not just set to empty) when no color is configured, so the cascade falls through to `--canopy-text`

### `embed/src/styles.ts`

- `.canopy-title`: `font-size` and `font-weight` now use CSS variables with existing values as fallbacks; `color` falls through to `--canopy-title-color` → `--canopy-text`
- `.canopy-label`: `font-weight` uses `--canopy-label-weight`; `text-transform` added using `--canopy-label-transform`

### `src/components/forms/appearance-section.tsx`

- Added `SubSection` helper component (local, not exported) wrapping Radix `Collapsible`
- Added `Chip` helper component for summary badges
- Added state for 5 new fields + 4 subsection open-states
- `hasChanges` check and save payload extended with new fields
- New fields saved only when non-default (avoids cluttering the stored JSON)
- Global controls (colors, radius, density) moved above the collapsible subsections

### `package.json`

- Version bumped: `4.2.0` → `4.3.0`

---

## Design Decisions

- **No per-element font family**: Global Body/Heading pickers are sufficient; per-title or per-label font pickers would add complexity with little benefit.
- **Defaults not stored**: When `titleSize` is `"md"` (the default), it is not written to the JSON blob. This keeps the stored theme minimal and backward-compatible.
- **Title color opt-in**: An empty `titleColor` means "inherit from text color". The CSS variable is removed entirely (not set to empty) so the CSS cascade works naturally.
- **Subsections start collapsed**: Keeps the panel short for users who only need the global controls.

---

## Verification Checklist

1. Open Appearance card → Colors/Radius/Density visible immediately (no scroll needed)
2. Expand Typography → Body/Heading font pickers and base size work as before
3. Expand Title Style → Set size XL, weight Bold, custom color → save triggers → embed reflects changes
4. Expand Labels → Set Uppercase → field labels in embed show `text-transform: uppercase`
5. Collapse each subsection → chips show non-default values
6. Reload the form editor page → all values persist (loaded from DB JSON)
7. `npm run embed:build` → no TypeScript errors
