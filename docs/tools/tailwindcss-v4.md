# Tailwind CSS v4 Documentation

**Last Updated:** January 2025  
**Current Version:** 4.1  
**Official Docs:** https://tailwindcss.com/docs

## Overview

Tailwind CSS v4.0 was released on January 22, 2025, as a ground-up rewrite optimized for performance and modern CSS features. Version 4.1 (released April 3, 2025) added text shadows, mask utilities, and additional features. This represents a fundamental shift from JavaScript-based configuration to CSS-first configuration, with significant performance improvements and new capabilities.

## Critical Changes from Tailwind CSS v3

### Architecture Shift

- **CSS-first configuration**: No more `tailwind.config.js` - everything in CSS
- **New high-performance engine**: 5× faster full builds, 100×+ faster incremental builds
- **Modern CSS features**: Built on cascade layers, `@property`, and `color-mix()`
- **Automatic content detection**: No configuration needed
- **Zero configuration setup**: Single CSS import line

### Minimum Requirements

- **Browsers**: Safari 16.4+, Chrome 111+, Firefox 128+
- **Node.js**: 20+ (for upgrade tool)
- **Modern CSS support**: Uses features not available in older browsers

## Breaking Changes

### 1. Package Structure Changes

**Old (v3):**
```bash
npm install -D tailwindcss postcss autoprefixer
```

**New (v4):**
```bash
# PostCSS setup
npm install -D tailwindcss @tailwindcss/postcss

# Or Vite setup
npm install -D tailwindcss @tailwindcss/vite

# Or CLI
npm install -D @tailwindcss/cli
```

**Key Changes:**
- PostCSS plugin: `@tailwindcss/postcss` (separate package)
- CLI: `@tailwindcss/cli` (separate package)
- Vite plugin: `@tailwindcss/vite` (first-party)

### 2. Configuration: CSS-First Approach

**Old (v3) - JavaScript Config:**
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
      },
    },
  },
  plugins: [],
};
```

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**New (v4) - CSS Config:**
```css
/* globals.css */
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
}
```

**Key Changes:**
- `@tailwind` directives removed
- `@import "tailwindcss"` replaces all directives
- Configuration in `@theme` block
- No `tailwind.config.js` needed

### 3. Content Detection

**Old (v3):**
```javascript
// tailwind.config.js
content: ['./src/**/*.{js,ts,jsx,tsx}'],
```

**New (v4):**
```css
/* Automatic - no configuration needed */
/* Tailwind automatically detects content */
```

Content detection is now **automatic** - no configuration required.

### 4. Browser Requirements

**Breaking:** Tailwind v4 requires modern browsers:
- Safari 16.4+
- Chrome 111+
- Firefox 128+

If you need older browser support, stick with Tailwind v3.4.

## New Features

### CSS-First Configuration with `@theme`

Define design tokens as CSS variables:

```css
@import "tailwindcss";

@theme {
  /* Colors */
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  
  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  
  /* Fonts */
  --font-display: 'Inter', sans-serif;
  
  /* Border radius */
  --radius-lg: 1rem;
}
```

This automatically generates utilities like `bg-primary`, `text-primary`, `p-xs`, etc.

### Inline Theme Configuration

Use `@theme inline` to reference existing CSS variables:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
}
```

### Custom Variants

Create custom variants with `@custom-variant`:

```css
@custom-variant dark (&:is(.dark *));
```

### Container Queries (First-Class)

No plugin needed - container queries are built-in:

```html
<div class="@container">
  <div class="@md:text-lg">Responsive to container</div>
</div>
```

### 3D Transform Utilities

New 3D transform utilities:

```html
<div class="transform-gpu rotate-x-45 rotate-y-12">
  3D transformed element
</div>
```

### Expanded Gradient APIs

Radial and conic gradients:

```html
<div class="bg-gradient-radial from-blue-500 to-purple-500">
  Radial gradient
</div>

<div class="bg-gradient-conic from-blue-500 via-purple-500 to-pink-500">
  Conic gradient
</div>
```

### @starting-style Support

Enter/exit transitions without JavaScript:

```css
@starting-style {
  .fade-in {
    opacity: 0;
  }
}

.fade-in {
  opacity: 1;
  transition: opacity 0.3s;
}
```

### Text Shadows (v4.1)

Finally added after 6 years of requests:

```html
<p class="text-shadow-sm">Small shadow</p>
<p class="text-shadow-md">Medium shadow</p>
<p class="text-shadow-lg">Large shadow</p>
<p class="text-shadow-md text-shadow-blue-500/50">Colored shadow</p>
```

Sizes: `2xs`, `xs`, `sm`, `md`, `lg`

### Mask Utilities (v4.1)

Mask elements with images and gradients:

```html
<div class="mask-image-gradient-to-r mask-size-cover">
  Masked content
</div>
```

### Input Device Targeting (v4.1)

Target touch devices explicitly:

```html
<button class="pointer-coarse:px-6 pointer-coarse:py-3">
  Larger on touch devices
</button>
```

Variants: `pointer-*` and `any-pointer-*`

### Drop Shadow Colors (v4.1)

Colored drop shadows:

```html
<div class="drop-shadow-lg drop-shadow-blue-500">
  Colored drop shadow
</div>
```

## Migration Guide

### Automated Migration

Use the official upgrade tool:

```bash
npx @tailwindcss/upgrade
```

**Requirements:**
- Node.js 20+
- Run in a new branch
- Review diff carefully

The tool automatically:
- Updates dependencies
- Migrates configuration
- Updates template files

### Manual Migration Steps

#### Step 1: Update Dependencies

```bash
npm uninstall tailwindcss postcss autoprefixer
npm install -D tailwindcss @tailwindcss/postcss
```

#### Step 2: Update PostCSS Config

**Old (v3):**
```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**New (v4):**
```javascript
// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

#### Step 3: Update CSS File

**Old (v3):**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**New (v4):**
```css
@import "tailwindcss";
```

#### Step 4: Migrate Configuration

**Old (v3) - tailwind.config.js:**
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
      },
    },
  },
};
```

**New (v4) - In CSS:**
```css
@theme {
  --color-primary: #3b82f6;
}
```

#### Step 5: Remove Config File

Delete `tailwind.config.js` (or keep it empty if needed for tooling).

## Common Patterns

### Theme Configuration

```css
@import "tailwindcss";

@theme {
  /* Custom colors */
  --color-brand: #3b82f6;
  --color-brand-dark: #2563eb;
  
  /* Custom spacing */
  --spacing-section: 4rem;
  
  /* Custom fonts */
  --font-heading: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  
  /* Custom breakpoints */
  --breakpoint-3xl: 1920px;
}
```

### Inline Theme (Reference CSS Variables)

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### Custom Variants

```css
@custom-variant dark (&:is(.dark *));
@custom-variant hover-focus (&:hover:focus);
```

### Layer Custom Styles

```css
@import "tailwindcss";

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary text-white px-4 py-2 rounded;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

### Content Source Control (v4.1)

Ignore specific paths:

```css
@source not "node_modules/**";
```

Safelist specific utilities:

```css
@source inline("bg-red-500", "text-white");
```

## Performance Improvements

- **5× faster** full builds
- **100×+ faster** incremental builds
- **10-15% smaller** bundle sizes
- **Faster dev refreshes** with automatic theme updates

## Project-Specific Notes

This project (Can-O-Forms) currently:
- ✅ Using Tailwind CSS v4
- ✅ Using `@import "tailwindcss"` correctly
- ✅ Using `@theme inline` for theme configuration
- ✅ Using `@tailwindcss/postcss` plugin
- ✅ No `tailwind.config.js` (CSS-first approach)
- ✅ Using `@custom-variant` for dark mode
- ✅ Using `@layer base` for global styles

## Troubleshooting

### "Cannot find module 'tailwindcss'"

**Cause:** Using v3 package structure

**Solution:** Install `@tailwindcss/postcss`:
```bash
npm install -D @tailwindcss/postcss
```

### Styles not applying

**Cause:** Old `@tailwind` directives or missing import

**Solution:** Replace with:
```css
@import "tailwindcss";
```

### Custom colors not working

**Cause:** Using old config file instead of `@theme`

**Solution:** Define in CSS:
```css
@theme {
  --color-custom: #ff0000;
}
```

### Content not detected

**Cause:** v3 required explicit content paths

**Solution:** v4 detects automatically - no config needed. If issues persist, use `@source` directive.

### Browser compatibility issues

**Cause:** v4 requires modern browsers

**Solution:** Use Tailwind v3.4 if you need older browser support, or add polyfills.

## Resources

- **Official Documentation**: https://tailwindcss.com/docs
- **Upgrade Guide**: https://tailwindcss.com/docs/upgrade-guide
- **v4.0 Blog Post**: https://tailwindcss.com/blog/tailwindcss-v4
- **v4.1 Blog Post**: https://tailwindcss.com/blog/tailwindcss-v4-1
- **Theme Variables**: https://tailwindcss.com/docs/configuration

## Quick Reference

### Installation

```bash
# PostCSS
npm install -D tailwindcss @tailwindcss/postcss

# Vite
npm install -D tailwindcss @tailwindcss/vite

# CLI
npm install -D @tailwindcss/cli
```

### Basic Setup

```css
/* globals.css */
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
}
```

### PostCSS Config

```javascript
// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### Migration Command

```bash
npx @tailwindcss/upgrade
```

---

**For AI Agents:** If you encounter code using `@tailwind base/components/utilities` directives or `tailwind.config.js` files, these are Tailwind v3 patterns. In v4, use `@import "tailwindcss"` and configure via `@theme` in CSS. Content detection is automatic - no configuration needed. The PostCSS plugin is now `@tailwindcss/postcss` (separate package).
