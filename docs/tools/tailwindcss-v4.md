# Tailwind CSS v4 Documentation

**Installed version:** `tailwindcss` and `@tailwindcss/postcss` in `apps/portal/package.json`, resolved in the root `package-lock.json` (4.1.18 as of 2026-11-14).  
**Official Docs:** https://tailwindcss.com/docs

## Overview

Tailwind CSS v4.0 (January 22, 2025) is a rewrite that moved configuration from JavaScript into CSS. Version 4.1 (April 3, 2025) added text shadows, masks, and more variants.

The class names and behaviors below were checked on 2026-11-15 by compiling them with the installed 4.1.18, and the v3 to v4 changes against the official upgrade guide.

## Changes from Tailwind CSS v3

### Browser Requirements

Safari 16.4+, Chrome 111+, Firefox 128+. v4 depends on `@property` and `color-mix()`.

### Configuration is CSS

There is no `tailwind.config.js`, no `content` array (sources are detected automatically), and no `@tailwind` directives.

**Old (v3):**
```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**New (v4):**
```css
/* globals.css */
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
}
```

The PostCSS plugin is its own package, `@tailwindcss/postcss`, and `autoprefixer` is no longer needed:

```javascript
// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### Renamed Utilities

The old names still compile, with a different meaning: v3's `shadow-sm` written in v4 gives the larger shadow that v3 called `shadow`.

| v3 | v4 |
|----|----|
| `shadow-sm` | `shadow-xs` |
| `shadow` | `shadow-sm` |
| `drop-shadow-sm` | `drop-shadow-xs` |
| `drop-shadow` | `drop-shadow-sm` |
| `blur-sm` | `blur-xs` |
| `blur` | `blur-sm` |
| `backdrop-blur-sm` | `backdrop-blur-xs` |
| `backdrop-blur` | `backdrop-blur-sm` |
| `rounded-sm` | `rounded-xs` |
| `rounded` | `rounded-sm` |
| `outline-none` | `outline-hidden` |
| `ring` | `ring-3` |

- `outline-none` now sets `outline-style: none`. `outline-hidden` is the v3 behavior, which keeps an outline in forced-colors mode.
- `ring` is 1px in `currentColor` (v3: 3px, blue). `ring-3` is the 3px ring.
- Bare `rounded` is a fixed `0.25rem` that ignores the theme. The sized classes (`rounded-sm`, `rounded-md`, ...) read the `--radius-*` tokens. Which to use here is in `docs/UX_PATTERNS.md`.
- `bg-opacity-*`, `text-opacity-*`, and the other opacity utilities are gone (`bg-opacity-50` generates nothing). Use the slash: `bg-black/50`.
- Gradients are `bg-linear-to-r` (`bg-gradient-to-r` still compiles), `bg-linear-45`, `bg-radial`, and `bg-conic`. There is no `bg-gradient-radial` or `bg-gradient-conic`.

### Changed Behavior

- **Border color defaults to `currentColor`** (v3: gray-200). The portal's `@layer base` in `globals.css` applies `border-border` to every element, so a bare `border` gets the token.
- **CSS variables in arbitrary values take parentheses**: `bg-(--brand)`. The v3 form `bg-[--brand]` still compiles, to `background-color: --brand`, which is invalid CSS and fails silently.
- **The important modifier goes last**: `flex!`, `hover:bg-red-500!`. The leading `!flex` is deprecated.
- **Stacked variants apply left to right**: v3's `first:*:pt-0` is `*:first:pt-0`.
- **`hover:` applies only where the device can hover** (`@media (hover: hover)`), so it does nothing on touch.
- **Custom utilities use `@utility`**, not `@layer utilities`, when they should work with variants:

  ```css
  @utility tab-4 {
    tab-size: 4;
  }
  ```
- **`theme()` gives way to the CSS variables**: `var(--color-red-500)`.
- **Buttons have `cursor: default`**, and placeholders are the text color at 50% opacity.
- **`space-x-*`, `space-y-*`, and `divide-*` select `:not(:last-child)`.** Prefer `gap` in a flex or grid layout.
- **`transform-none` no longer resets `rotate-*`, `scale-*`, or `translate-*`**, which are individual properties now: use `scale-none`, and `transition-[opacity,scale]` rather than `transition-[opacity,transform]`.

## Theme Configuration

### `@theme`

Theme variables define design tokens and generate their utilities:

```css
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;    /* bg-primary, text-primary, ... */
  --spacing-xs: 0.5rem;        /* p-xs, m-xs, gap-xs, ... */
  --font-display: 'Inter', sans-serif;  /* font-display */
  --radius-lg: 1rem;           /* rounded-lg */
  --breakpoint-3xl: 120rem;    /* 3xl: variant */
}
```

### `@theme inline`

Use `@theme inline` when a token points at another variable, which is how `globals.css` maps the semantic colors and fonts:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-inter);
}
```

### Custom Variants

```css
@custom-variant dark (&:is(.dark *));
```

### Sources

Detection is automatic. To exclude a path or force classes into the build (4.1):

```css
@source not "./legacy";
@source inline("bg-red-500 text-white");
```

`@source inline()` takes one string, with classes separated by spaces. Two quoted arguments generate nothing.

## New Utilities and Variants

- **Container queries** are built in: `@container` on the parent, `@md:text-lg` on the child.
- **3D transforms**: `rotate-x-45`, `rotate-y-12`, `transform-3d`.
- **`starting:` variant** for enter transitions (`@starting-style`): `starting:opacity-0`.
- **Text shadows** (4.1): `text-shadow-2xs`, `-xs`, `-sm`, `-md`, `-lg`, with a color as `text-shadow-blue-500/50`.
- **Masks** (4.1): `mask-b-from-50%`, `mask-linear-45`, `mask-cover`. There is no `mask-image-gradient-*` or `mask-size-*`.
- **Pointer variants** (4.1): `pointer-coarse:px-6`, `any-pointer-coarse:px-6`.
- **Colored drop shadows** (4.1): `drop-shadow-lg drop-shadow-blue-500`.

## Project-Specific Notes

In `apps/portal` as of 2026-11-14:
- The whole setup is `src/app/globals.css` (`@import "tailwindcss"`, `@theme inline`, `@custom-variant dark`, `@layer base`) plus `postcss.config.mjs` with the `@tailwindcss/postcss` plugin. There is no `tailwind.config.js`.
- The design tokens and the three font families (`--font-sans`, `--font-heading`, `--font-mono`) are set in `globals.css`; the rules for using them are in `docs/UX_PATTERNS.md` and `docs/AGENT_CONTEXT.md` section 9.

## Resources

- **Official Documentation**: https://tailwindcss.com/docs
- **Upgrade Guide**: https://tailwindcss.com/docs/upgrade-guide
- **v4.0 Blog Post**: https://tailwindcss.com/blog/tailwindcss-v4
- **v4.1 Blog Post**: https://tailwindcss.com/blog/tailwindcss-v4-1
- **Theme Variables**: https://tailwindcss.com/docs/theme
