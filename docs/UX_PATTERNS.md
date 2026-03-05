# UX Patterns & Component Guidelines

This document defines the UI/UX conventions for the Canopy Forms admin interface. **Read this before building any new UI components or modifying existing ones.**

---

## Table of Contents

1. [Component Library Overview](#component-library-overview)
2. [Color System](#color-system)
3. [Never Use Browser Native Dialogs](#never-use-browser-native-dialogs)
4. [Button Patterns](#button-patterns)
5. [Icon Usage](#icon-usage)
6. [Typography](#typography)
7. [Graphics & Brand Assets](#graphics--brand-assets)
8. [Tooltips](#tooltips)
9. [Toast Notifications](#toast-notifications)
10. [Confirmation Dialogs](#confirmation-dialogs)
11. [Sortable Lists (Drag-to-Reorder)](#sortable-lists-drag-to-reorder)
12. [High-Density List Pattern](#high-density-list-pattern)
13. [Required Field Indicators](#required-field-indicators)
14. [Layout Patterns](#layout-patterns)
15. [Card layout and primary actions](#card-layout-and-primary-actions)
16. [Form Inputs](#form-inputs)
17. [Empty States](#empty-states)

---

## Component Library Overview

This project uses **shadcn/ui** components built on Radix UI primitives with Tailwind CSS styling.

**Component locations:**
- **Base UI components**: `src/components/ui/` (button, input, dialog, etc.)
- **Layout patterns**: `src/components/patterns/` (top-nav-layout, page-header, etc.)
- **Feature components**: `src/components/` (confirm-dialog, field-list, etc.)

**Key dependencies:**
- `radix-ui` - Accessible UI primitives (unified package; all `src/components/ui/` components import from here)
- `lucide-react` - Icon library
- `class-variance-authority` - Variant management
- `tailwind-merge` + `clsx` - Class name utilities (via `cn()` helper)
- `@dnd-kit/*` - Drag-and-drop functionality
- `sonner` - Toast notifications

---

## Color System

This project uses a semantic color system built on Tailwind CSS v4 with CSS variables defined in `src/app/globals.css`.

### Brand Colors

The application uses three brand colors with specific semantic roles:

| Color | Hex | Usage |
|-------|-----|-------|
| **Main Teal** | `#005F6A` | Primary actions, buttons, links, headings, brand emphasis |
| **Highlight Green** | `#5FD48C` | Success states, positive feedback, CTAs |
| **Pop Coral** | `#FF6B5A` | Destructive actions, error states, warnings, critical alerts |

### Semantic CSS Variables

Colors are defined as CSS variables using oklch color space for better color manipulation:

```css
:root {
  --primary: oklch(0.38 0.07 195);           /* Main Teal #005F6A */
  --primary-foreground: oklch(0.985 0 0);    /* White text on teal */
  --destructive: oklch(0.68 0.21 25);        /* Pop Coral #FF6B5A */
  --success: oklch(0.75 0.15 155);           /* Highlight Green #5FD48C */
  --success-foreground: oklch(0.145 0 0);    /* Dark text on green */
  /* ... other semantic variables */
}
```

### Using Colors in Components

**Always use semantic color utilities** rather than hardcoding colors:

```tsx
// ✅ Good - uses semantic utilities
<Button className="bg-primary text-primary-foreground">Save</Button>
<Button variant="destructive">Delete</Button>
<p className="text-success">Form submitted successfully</p>

// ❌ Bad - hardcoded colors
<Button className="bg-[#005F6A] text-white">Save</Button>
<div style={{ color: '#FF6B5A' }}>Error</div>
```

### Available Semantic Tokens

| Token | Tailwind Class | Usage |
|-------|----------------|-------|
| `primary` | `bg-primary`, `text-primary` | Primary brand actions |
| `primary-foreground` | `text-primary-foreground` | Text on primary backgrounds |
| `destructive` | `bg-destructive`, `text-destructive` | Dangerous/delete actions |
| `success` | `bg-success`, `text-success` | Success states, positive feedback |
| `success-foreground` | `text-success-foreground` | Text on success backgrounds |
| `muted` | `bg-muted`, `text-muted` | Subtle backgrounds |
| `muted-foreground` | `text-muted-foreground` | Secondary text |
| `accent` | `bg-accent`, `text-accent` | Subtle highlights |
| `border` | `border`, `border-border` | Standard borders |

### Component Variants

Most UI components automatically use semantic colors through their variants:

```tsx
// Button variants
<Button variant="default">Uses --primary</Button>
<Button variant="destructive">Uses --destructive</Button>

// Badge variants
<Badge variant="default">Uses --primary</Badge>
<Badge variant="destructive">Uses --destructive</Badge>

// Alert variants
<Alert variant="default">Standard</Alert>
<Alert variant="destructive">Uses destructive color</Alert>
```

### Embed Forms

Embedded forms use a separate theming system (`embed/src/theme.ts`). The type system uses two groups:

- **`ThemeDefaults`** — tokens that have a default value (e.g. `background`, `primary`, `radius`). `DEFAULT_THEME` must provide all of these. To add a new token with a default: add it to `ThemeDefaults` + add the value to `DEFAULT_THEME`.
- **`ThemeOverrides`** — optional tokens with no default (e.g. `bodyFont`, `titleColor`, `pageBackground`). To add a new optional token: add it to `ThemeOverrides`. No other changes needed.
- **`ThemeTokens`** = `Partial<ThemeDefaults> & ThemeOverrides` — the public type used by consumers. All fields are optional since stored themes only include tokens the user has set.

Default values:

```typescript
// ThemeDefaults — DEFAULT_THEME values
background:      "#ffffff"   // Form container background  (--canopy-bg)
fieldBackground: "#ffffff"   // Input/textarea background  (--canopy-field-bg)
primary:         "#005F6A"   // Button background / focus rings (--canopy-primary)
border:          "#e4e4e7"   // Input borders               (--canopy-border)
text:            "#18181b"   // Labels and body copy        (--canopy-text)
// Derived automatically — not a stored key:
// --canopy-button-text  white or #18181b, chosen via WCAG luminance of primary
// ::placeholder         var(--canopy-text) at 0.5 opacity (CSS only)
```

**Hosted-only tokens** (in `ThemeOverrides`, read by page wrappers, ignored by embed script):
```typescript
pageBackground?: string                    // Page background color — falls back to bg-muted/40
cardEnabled?: boolean                      // Wrap form in a card (default: true)
cardShadow?: "none" | "sm" | "md" | "lg"  // Card shadow: none/light/medium/heavy (default: "md")
contentWidth?: "sm" | "md" | "lg"         // Max width: 480/640/768px (default: "md")
verticalAlign?: "top" | "center"          // Vertical position on page (default: "top")
```

Shared extraction via `extractPageTheme()` in `src/lib/page-theme.ts` — used by `hosted-form-page.tsx`, `live-preview-panel.tsx`, and `form-view-page.tsx`.

Status-message colors are hardcoded in `embed/src/styles.ts` (not user-configurable):
```typescript
success: "#5FD48C"    // Highlight Green
error:   "#FF6B5A"    // Pop Coral
```

### Appearance Editor Structure

The Appearance section in the form editor (`appearance-section.tsx`) is an always-open Card with 5 collapsible SubSection rows. Each row shows summary chips when collapsed. There is no third nesting tier — all SubSections are peers. Colors are co-located with the element they affect rather than grouped into a separate section.

```
Appearance  (always-open Card)
├─ Page        [swatch]                            ← hosted-only settings
├─ Form        [swatch] [swatch] [swatch] · radius 8  ← surfaces, borders, spacing
├─ Headings    Montserrat · Semibold · [swatch]    ← title + label shared style
├─ Body        Lato · 14px · [swatch]              ← body font, size + text color
└─ Button      Submit · [swatch]                   ← button text + color
```

- **Page**: Page Background Color (hosted pages only), with helper text
- **Form**: Background, Field Background, Field Border (3 color pickers), Border Radius, Density, Button Width, Button Alignment (conditional)
- **Headings**: Font, Weight, Color, Label Transform, Title Size — applied to both the form title and all field labels as one shared style
- **Body**: Font (body typeface), Base Font Size (px), Text Color
- **Button**: Button Text (custom submit label), Button Color

**Heading/label style**: The form title and all field labels share one heading style (`headingFont`, `titleWeight`, `titleColor`). Label transform (uppercase) is label-specific and lives in Headings. Title Size is title-specific (labels always render at body font size).

**Font pickers**: Body and Headings each use the `FontPicker` component (`src/components/ui/font-picker.tsx`) with different curated lists. The **Body** font uses `variant="body"` (default), which shows `CURATED_FONTS` from `src/lib/google-fonts.ts` (sans, serif, mono options suited to body text). The **Headings** font uses `variant="heading"`, which shows `CURATED_HEADING_FONTS` (display/expressive typefaces). In both cases the user can search to filter over the full Google Fonts catalogue; the variant only changes the default scrollable list when not searching.

**Font previews**: Each option in the curated list renders in its own typeface. When the picker opens, the curated list is loaded via `src/lib/load-google-fonts.ts`, which injects a single combined `fonts.googleapis.com/css2` stylesheet into `document.head` (deduplicated — each family is only requested once per session). The currently selected font is also loaded eagerly on mount so the closed trigger button renders in the correct typeface. Search results do not load fonts — users typing a specific name already know what they want.

Each color control is a native color-picker swatch + hex text input; the hex input normalizes to `#rrggbb` on blur.

### Dark Mode Status

**Light mode only**: The current color system is optimized for light mode. Dark mode CSS variables exist in `globals.css` but have not been updated with brand colors. If dark mode support is added in the future, ensure:
- Brand colors maintain sufficient contrast in dark mode
- Test all interactive states (hover, focus, active)
- Consider providing dark-mode-specific brand color variants

### Color Contrast

All brand color combinations meet WCAG AA accessibility standards:

- Main Teal (`#005F6A`) + white text: ✅ AAA compliant
- Pop Coral (`#FF6B5A`) + white text: ✅ AA compliant
- Highlight Green (`#5FD48C`) + dark text: ✅ AA compliant

---

## Never Use Browser Native Dialogs

**Critical rule: Never use browser native dialogs.** They create unstyled, inconsistent experiences.

| Never Use | Use Instead |
|-----------|-------------|
| `window.alert()` | `toast.error()` or `toast.info()` |
| `window.confirm()` | `ConfirmDialog` component |
| `window.prompt()` | Custom dialog with input |

---

## Button Patterns

Buttons use the `Button` component from `src/components/ui/button.tsx`.

### Variants

| Variant | Usage |
|---------|-------|
| `default` | Primary actions (Save, Submit, Create). Also the "safe" choice when paired with a destructive alternative. |
| `destructive` | Dangerous actions when there is a single confirm/cancel choice (e.g., Delete / Cancel) |
| `outline` | Secondary actions (Cancel, Back) |
| `ghost` | Tertiary/icon-only actions in toolbars |
| `secondary` | Alternative secondary styling |
| `link` | Text-style actions. Use with `text-destructive` to de-emphasize a dangerous option next to a safer primary. |

### Sizes

| Size | Usage |
|------|-------|
| `default` | Standard buttons |
| `sm` | Compact areas, table rows |
| `lg` | Hero actions, prominent CTAs |
| `icon` | Icon-only buttons (square, 36px) |
| `icon-sm` | Small icon buttons (32px) - **use for action icons in lists** |
| `icon-lg` | Large icon buttons (40px) |

### Examples

```tsx
// Primary action
<Button>Save Changes</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Secondary action
<Button variant="outline">Cancel</Button>

// Icon-only button in a list row
<Button variant="ghost" size="icon-sm">
  <Trash2 className="h-4 w-4" />
</Button>
```

---

## Icon Usage

Icons come from `lucide-react`. Standard icon size is `h-4 w-4` (16px).

### Common Icons

| Icon | Import | Usage |
|------|--------|-------|
| `GripVertical` | `lucide-react` | Drag handles for reorderable lists |
| `Trash2` | `lucide-react` | Delete/remove actions |
| `Pencil` | `lucide-react` | Edit actions |
| `Plus` | `lucide-react` | Add/create actions |
| `X` | `lucide-react` | Close/dismiss |
| `Check` | `lucide-react` | Success/confirm |
| `AlertCircle` | `lucide-react` | Warnings/errors |

### Icon Button Pattern

Always use `ghost` variant with `icon-sm` size for icon-only action buttons:

```tsx
<Button variant="ghost" size="icon-sm">
  <Pencil className="h-4 w-4" />
</Button>
```

---

## Typography

This project uses a two-typeface system optimized for readability and brand consistency.

### Typeface Choices

| Typeface | Usage | Tailwind Utility |
|----------|-------|------------------|
| **Inter** | Body text, UI elements, descriptions, buttons | `font-sans` (default) |
| **Urbanist** | Headings, titles, page headers, section labels | `font-heading` |
| **Geist Mono** | Code blocks, monospace content | `font-mono` |

### Implementation

Fonts are loaded via `next/font/google` in `src/app/layout.tsx` and mapped to Tailwind v4 design tokens in `src/app/globals.css`:

```css
@theme inline {
  --font-sans: var(--font-inter);
  --font-heading: var(--font-urbanist);
  --font-mono: var(--font-geist-mono);
}
```

**Inter** is applied by default to `<body>`, so all UI elements inherit it automatically. Only headings need explicit `font-heading` classes.

### When to Use `font-heading`

Apply `font-heading` to all semantic headings and titles:

**✅ Always use on:**
- Page titles (`<h1>` in PageHeader, docs pages)
- Section headings (`<h2>`, `<h3>` in SettingsSection, Markdown)
- Card/component titles (EmptyState, modal headers)
- Navigation/sidebar titles (admin console, operator console)

**❌ Don't use on:**
- Body text, paragraphs, descriptions
- Buttons, form labels, input text
- Table content, list items
- Toast messages, error text

### Examples

```tsx
// Page header with Urbanist
<h1 className="text-3xl font-heading font-semibold tracking-tight">
  Forms
</h1>

// Section label with Urbanist
<h3 className="text-sm font-heading font-semibold">
  Email Notifications
</h3>

// Body text uses Inter automatically (no class needed)
<p className="text-sm text-muted-foreground">
  Configure when to send emails
</p>

// Code blocks use Geist Mono
<code className="font-mono text-sm">
  npm install
</code>
```

### Font Weights

Both typefaces support variable weights. Common usage:

| Weight | Class | Usage |
|--------|-------|-------|
| 400 (Regular) | `font-normal` | Body text (Inter default) |
| 500 (Medium) | `font-medium` | Field labels, form inputs |
| 600 (Semibold) | `font-semibold` | Card titles, section headings within panels (`CardTitle`, `SettingsSection`, `SubSection`) |
| 700 (Bold) | `font-bold` | Page headings, high emphasis (`PageHeader`) |

### Heading Hierarchy

The admin UI uses a four-level typographic hierarchy. Maintain size and weight separation between levels:

| Level | Example | Classes | Size |
|-------|---------|---------|------|
| Page title | "Forms", "Account" | `text-3xl font-heading font-semibold` | 30px |
| Card title | "Header", "Fields", "Appearance" | `text-xl text-primary font-heading font-semibold` | 20px |
| Section heading | "Page", "Colors", "Email Notifications" | `text-base font-heading font-semibold` (+ `text-primary` in panels) | 16px |
| Field label | "Form Background", "Redirect URL" | `text-sm font-medium` | 14px |

Card titles are separated from section headings by **size** (20px vs 16px) and **color** (primary teal). Section headings use `text-primary` in collapsible panels (e.g. Appearance subsections) so they read clearly above field labels. Urbanist renders slightly smaller than Inter at the same point size, so card and section headings use larger sizes (20px, 16px) to keep hierarchy obvious.

### Component Patterns Using Typography

These shared components already apply `font-heading` correctly:
- `PageHeader` - page titles (`text-3xl font-heading font-semibold`)
- `CardTitle` - card titles (`text-xl text-primary font-heading font-semibold`)
- `SettingsSection` - section headings (`text-sm font-heading font-semibold`)
- `EmptyState` - empty state titles (`text-lg font-heading font-semibold`)
- `Markdown` - h1/h2/h3 renderers

When creating new title/heading components, follow this pattern.

---

## Graphics & Brand Assets

This project distinguishes between **icons** (UI affordances) and **brand graphics** (logos/wordmarks) or **content graphics** (docs screenshots).

### Icons vs Logos

- **Icons**: Always use `lucide-react` for UI icons (edit, delete, drag handles, etc.). Do not introduce new icon packs for convenience.
- **Logos / wordmarks**: Treat as **brand assets**, not icons.

### Where graphics live

**Rule: Anything referenced by URL in the app must live in `public/`.**

Recommended structure:

- `public/brand/` — logos, wordmarks, favicons, brand-only assets
- `public/docs-assets/` — screenshots and images used by documentation pages

Avoid placing images in `content/` unless you are intentionally treating them as source content loaded via filesystem (they will not be automatically served by Next.js).

### How to render brand assets

- **SVG logos**: Prefer serving from `public/…` and rendering with a plain `<img src="/brand/..." />` for simplicity and consistency (no SVGR assumptions).
- **Raster images** (png/jpg/webp): Prefer `next/image` for responsive sizing and optimization.

### Asset naming (important)

- **Avoid spaces in filenames referenced by URL**. Browsers will URL-encode them (`%20`), which is easy to get wrong and harder to grep.
- If design files have spaces (e.g. exported from Inkscape), keep them for editing, but also add a **URL-safe copy** in `public/brand/` (lowercase, hyphenated).

### App brand mark (use this, don’t rebuild it)

To keep the logo + wordmark consistent across the app, use the shared `BrandMark` component:

- **Component**: `src/components/brand-mark.tsx`
- **Asset**: `public/brand/forms-logo-combined.svg`

This is used for:

- **Auth cards** (login/signup/forgot/reset): logo sits inside the card header; page-specific copy lives in the card content.
- **Admin sidebar header**: compact logo in the nav header.

### Accessibility rules (required)

- **Decorative images** (purely visual; redundant with nearby text): use `alt=""`
- **Meaningful images** (convey content not otherwise present): use a descriptive `alt="..."`
- Never rely on color alone to communicate meaning (use text, icons, or status labels too).

### Theming note

If/when dark mode is enabled, brand assets must remain legible:

- Prefer logos that work on both light and dark backgrounds, or provide a light/dark variant.
- Avoid hardcoding background rectangles behind logos unless required.

### Favicons / browser tab icon (Next.js App Router)

Use Next.js App Router icon files (not manual `<link rel="icon">` tags in pages):

- `src/app/icon.svg` — primary app icon (scales cleanly)
- `src/app/favicon.ico` — legacy fallback for older browsers

---

## Tooltips

**Always add tooltips to icon-only buttons** for accessibility and discoverability.

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon-sm">
      <Trash2 className="h-4 w-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Delete item</TooltipContent>
</Tooltip>
```

### Important: Ref Forwarding with `asChild`

When using `<TooltipTrigger asChild>` with components that need refs (like drag handles), apply props directly to the element:

```tsx
// ✅ Correct - props applied directly to button
<TooltipTrigger asChild>
  <button {...dragHandleProps}>
    <GripVertical className="h-4 w-4" />
  </button>
</TooltipTrigger>

// ❌ Wrong - wrapper component breaks ref forwarding
<TooltipTrigger asChild>
  <DragHandle dragHandleProps={dragHandleProps} />
</TooltipTrigger>
```

---

## Toast Notifications

Use the `useToast` hook for all user feedback notifications.

```tsx
import { useToast } from "@/hooks/use-toast";

function MyComponent() {
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      toast.success("Changes saved");
    } catch (error) {
      toast.error("Failed to save changes");
    }
  };
}
```

### Available Methods

| Method | Usage |
|--------|-------|
| `toast.success(message)` | Success feedback |
| `toast.error(message)` | Error feedback |
| `toast.info(message)` | Informational messages |
| `toast.warning(message)` | Warning messages |
| `toast.loading(message)` | Loading state (returns ID for dismiss) |

### Convenience Helpers

```tsx
const { showSaving, showSaved, showError } = useToast();

showSaving();        // "Saving..."
showSaved();         // "Saved"
showError();         // "Something went wrong"
```

---

## Confirmation Dialogs

Use `ConfirmDialog` for simple confirm/cancel actions. For dialogs where the user chooses between a safe and a dangerous option, see [Destructive Actions with Data Retention](#destructive-actions-with-data-retention) below.

```tsx
import { ConfirmDialog } from "@/components/confirm-dialog";

<ConfirmDialog
  title="Delete Form"
  description="This will permanently delete the form and all submissions. This action cannot be undone."
  onConfirm={handleDelete}
  destructive={true}
  trigger={
    <Button variant="ghost" size="icon-sm">
      <Trash2 className="h-4 w-4" />
    </Button>
  }
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | string | Dialog title |
| `description` | string | Explanation text |
| `onConfirm` | () => void | Callback when confirmed |
| `trigger` | ReactNode | Element that opens the dialog |
| `destructive` | boolean | Use destructive button styling |

### Dialog Footer Hierarchy: Safe vs. Dangerous Choices

When a dialog presents competing actions with different risk levels (not just confirm/cancel), use **visual weight and position** to guide the user toward the safer choice:

1. **Safe action rightmost with primary variant** — the strongest visual weight lands in the natural endpoint of left-to-right scanning
2. **Dangerous action as `link` variant + `text-destructive`** — present but low visual weight; the user must consciously choose it
3. **Cancel isolated left** — `mr-auto` on the cancel button creates a two-group layout: escape (left) vs. decisions (right)
4. **Let design do the persuading** — avoid redundant warning text ("are you sure?"); the layout and visual hierarchy should be sufficient

```
[ Cancel ]                    Dangerous option    [ Safe option ]
   outline,                     link variant,        default (primary)
   mr-auto (pushed left)        text-destructive     variant, rightmost
```

> **Do not use `variant="destructive"` (filled red button) when a safer alternative is present.** The filled destructive button is for single-action confirmations (Delete / Cancel) where there is no competing safe choice. When two actions compete, de-emphasize the dangerous one with `link` + `text-destructive` instead.

### Destructive Actions with Data Retention

Apply the footer hierarchy above when a destructive action may affect persisted user data (e.g., deleting a field that has submission data). Instead of `ConfirmDialog`, build a custom dialog that:

- Is controlled via `open`/`onOpenChange` (opened programmatically, no trigger)
- Checks for affected data asynchronously on mount (shows spinner while loading)
- If **no data exists**: falls back to simple confirmation (Cancel / Delete)
- If **data exists**: shows the count and offers a safe option (keep data) and a dangerous option (purge data), using the footer hierarchy above

**Reference implementation:** `DeleteFieldDialog` (`src/components/delete-field-dialog.tsx`)

---

## Sortable Lists (Drag-to-Reorder)

**Never use Up/Down buttons for reordering.** Always use drag-and-drop.

Use the `SortableList` component from `src/components/ui/sortable-list.tsx`.

### Standard Layout

```
[drag handle] [content] [edit] [delete]
     ⋮⋮        Item 1      ✎      🗑
```

- **Left**: Drag handle (`GripVertical` icon)
- **Middle**: Item content
- **Right**: Action buttons (edit, delete as icon buttons)

### Two Interaction Patterns

#### Pattern 1: Drag Handle Only (Default)
Apply `dragHandleProps` to a dedicated handle button. Best for lists with many interactive elements.

```tsx
<SortableList
  items={items}
  onReorder={(ids) => handleReorder(ids)}
  renderItem={({ item, dragHandleProps }) => (
    <div className="flex items-center gap-2">
      <button {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1">{item.name}</span>
      <Button onClick={() => edit(item.id)}>Edit</Button>
    </div>
  )}
/>
```

#### Pattern 2: Drag Anywhere on Row (High Density)
Apply `dragHandleProps` to the entire row for faster interaction. Best for simple inventory lists.

```tsx
<SortableList
  items={items}
  onReorder={(ids) => handleReorder(ids)}
  renderItem={({ item, dragHandleProps }) => (
    <div
      {...dragHandleProps}
      className="flex items-center gap-2 py-2 px-3 border-b cursor-grab active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      <span className="flex-1">{item.label}</span>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          edit(item.id);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        Edit
      </Button>
    </div>
  )}
/>
```

**Important:** When using drag-anywhere, add `stopPropagation` to both `onClick` and `onPointerDown` for clickable elements to prevent drag initiation.

### Key Points

1. **Items must have stable `id` properties** - don't use array indices
2. **Apply `dragHandleProps` directly to an element** - don't wrap in components
3. **Use `transition: { idle: true }`** - prevents double animation on release (already configured)
4. **Always include a `GripVertical` icon** - visual affordance even if entire row is draggable
5. **Movement is vertical-only** - horizontal dragging is disabled

### For Non-Persistent Items

When items don't have database IDs (like select options), generate stable IDs in component state:

```tsx
const optionsWithIds = useMemo(
  () => options.map((opt, index) => ({
    id: `option-${index}`,
    ...opt,
  })),
  [options]
);
```

---

## High-Density List Pattern

For inventory-style lists where users need to scan many items quickly (e.g., field lists, option lists), use a high-density layout:

### Design Principles

1. **Reduce visual weight**: Single border container with row separators, not individual cards
2. **Tight spacing**: Target ~40-44px row height with `py-2` padding
3. **Clear hierarchy**: Label dominates, metadata is muted and compact
4. **Always-visible actions**: Keep edit/delete buttons visible (avoid hover-reveal with drag-and-drop)
5. **Single-line content**: Avoid multi-line layouts when possible

### Example Structure

```tsx
<SortableList
  items={items}
  onReorder={onReorder}
  className="border rounded-md space-y-0"
  renderItem={({ item, dragHandleProps }) => (
    <div
      {...dragHandleProps}
      className="flex items-center gap-2 py-2 px-3 border-b border-border/50 last:border-b-0 hover:bg-muted/50 cursor-grab active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-[15px]">{item.label}</span>
          <span className="text-xs text-muted-foreground/60">{item.type}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-0.5 shrink-0">
        <Button variant="ghost" size="icon-sm" onClick={(e) => {
          e.stopPropagation();
          onEdit(item.id);
        }} onPointerDown={(e) => e.stopPropagation()}>
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )}
/>
```

### Key Styling Details

- **Container**: Apply to SortableList: `className="border rounded-md space-y-0"`
- **Remove default spacing**: `space-y-0` overrides SortableList's default `space-y-2`
- **Row separator**: `border-b border-border/50 last:border-b-0` (faint, skip last)
- **Row padding**: `py-2 px-3` (tight density, ~40-44px rows)
- **Hover background**: `hover:bg-muted/50` (subtle row feedback)
- **Actions**: Always visible, right-aligned with `shrink-0`

### Why Always-Visible Actions

Hover-revealed actions conflict with drag-and-drop:
- CSS `:hover` states can persist incorrectly during DOM manipulation
- Touch devices don't support hover
- Adds state complexity without clear benefit

Always-visible actions are simpler, more reliable, and more discoverable.

### When to Use

- ✅ Inventory lists (fields, options, items in a set)
- ✅ Simple data with 2-3 properties per item
- ✅ Lists where users need to scan quickly
- ❌ Complex items with rich metadata

---

## Required Field Indicators

Use a **red asterisk** for required field indicators across the application.

### In Lists and Forms

```tsx
<span className="font-medium">
  {field.label}
  {field.required && <span className="text-red-500 ml-0.5">*</span>}
</span>
```

### Styling Rules

- **Color**: `text-red-500` (consistent red)
- **Spacing**: `ml-0.5` (minimal gap after label)
- **Position**: Immediately after label text, before any metadata

### Don't Use

- ❌ Badge component (`<Badge>Required</Badge>`) - too heavy
- ❌ Text indicators (`(required)`) - adds visual noise
- ❌ Icons other than asterisk - reduces scan speed

### Rationale

Asterisks are:
- Universally recognized convention
- Minimal visual weight
- Fast to scan
- Consistent with form best practices

---

## Layout Patterns

### Editor Layout Max-Width

For form editors and configuration interfaces, constrain content width to improve ergonomics and reduce horizontal scanning.

**Standard max-width: 640px**

```tsx
// Apply to the main content container
const main = (
  <div className="space-y-6 max-w-[640px] mx-auto">
    <FieldsSection />
    <AppearanceSection />
    <AfterSubmissionSection />
  </div>
);

// Also apply to header for alignment
const header = (
  <div className="max-w-[640px] mx-auto">
    <div className="flex items-center justify-between gap-4">
      <Input value={formName} onChange={...} />
      <div className="flex items-center gap-2 shrink-0">
        <Button>Preview</Button>
        <Button>Integrate</Button>
      </div>
    </div>
  </div>
);
```

**Benefits:**
- Reduces eye travel distance
- Improves focus and readability
- Creates consistent visual rhythm
- Easier to scan vertically

**When to use:**
- ✅ Form builders and editors
- ✅ Settings pages with vertical sections
- ✅ Configuration interfaces
- ❌ Data tables (need horizontal space)
- ❌ Dashboards with multiple columns

### Page Header

```tsx
import { PageHeader } from "@/components/patterns/page-header";

<PageHeader
  title="Forms"
  description="Manage your forms"
  actions={<Button>Create Form</Button>}
/>
```

Optional `backHref` prop renders an ArrowLeft icon link before the title for back-navigation:

```tsx
<PageHeader
  title={form.name}
  description="Submissions"
  backHref={`/forms/${formId}`}
/>
```

### Empty State

```tsx
import { EmptyState } from "@/components/patterns/empty-state";
import { FileText } from "lucide-react";

<EmptyState
  icon={<FileText className="h-12 w-12 text-muted-foreground" />}
  title="No forms yet"
  description="Create your first form to get started."
  action={<Button>Create Form</Button>}
/>
```

### Editor Layout

```tsx
import { EditorLayout } from "@/components/patterns/editor-layout";

<EditorLayout
  header={<PageHeaderContent />}
  main={<FormFields />}
  panel={<LivePreviewPanel />}
/>
```

The `header` prop is optional. When provided, it renders **full-width above the two-column split** with `px-4 md:px-8 pt-4 md:pt-8` padding and `max-w-7xl mx-auto` centering — matching `PageContent`'s layout exactly. This ensures headers align consistently when navigating between standard pages (view, submissions) and the editor. The `main` area uses matching `px-4 md:px-8` horizontal padding so content aligns with the header.

**Panel behavior (Epic 17)**:
- On `lg+`: The panel renders as a sidebar (`w-[400px]` on lg, `w-[480px]` on xl) with a `border-l border-border/50` separator and no background — the embed renders directly without admin-UI card chrome so the preview is an honest representation of the embedded form
- The `EditorLayout` outer div uses `h-full` so the editor fills its flex parent (the `flex-1 min-h-0` main area under the top nav). The panel column is `h-full overflow-y-auto` so it scrolls independently while the editor column scrolls independently.
- On `<lg`: The panel slot is hidden via `hidden lg:flex`. A fixed **side handle tab** on the right edge of the viewport (`lg:hidden`) opens the preview in a `RightPanel` Sheet. The handle uses an `Eye` icon with vertical "Preview" text, styled with `bg-background/90 backdrop-blur-sm` to match the header's glass effect.

### FormContext (Unified State)

The form editor uses a `FormProvider` context that holds all form state and provides granular updaters with auto-save:

```tsx
import { FormProvider, useFormContext } from "@/components/forms/form-context";

// Wrap editor in provider
<FormProvider initialForm={form}>
  <FormEditorInner />
</FormProvider>

// In any child component
const { state, saveStatus, updateHeader, updateTheme } = useFormContext();
```

**Save groups** — changes auto-save after 1s debounce per group:
| Group | Fields | Server action |
|-------|--------|---------------|
| basics | `name` | `updateFormBasics` |
| header | `title`, `description` | `updateFormHeader` |
| theme | `defaultTheme` | `updateFormAppearance` |
| afterSubmission | success/redirect/email/origins/stop/max | `updateAfterSubmission` |

Field operations (create/update/delete/reorder) call server actions **immediately**, not through auto-save.

### LivePreviewPanel

Always-on preview that renders the form using the actual embed renderer:

```tsx
import { LivePreviewPanel } from "@/components/forms/live-preview-panel";
```

- Loads `embed.js` script, creates a `CanopyForm` instance via `window.CanopyForms.CanopyForm`
- Calls `renderFromDefinition()` with a projection of `FormState` → embed `FormDefinition`
- Re-renders on state change with 150ms debounce
- Visual design: no admin-UI chrome — the embed container renders directly below a small "PREVIEW" label. No card wrapper, no background. What the user sees is exactly what gets embedded on their site.

### Settings Section

```tsx
import { SettingsSection } from "@/components/patterns/settings-section";

<SettingsSection
  title="Email Notifications"
  description="Configure when to send emails"
>
  {/* Form controls */}
</SettingsSection>
```

### Top Nav Layout

```tsx
import { TopNavLayout } from "@/components/patterns/top-nav-layout";
import { UserMenu } from "@/components/patterns/user-menu";

<TopNavLayout
  logo={<Link href="/forms"><BrandMark size="sm" /></Link>}
  navItems={<>
    <Link href="/forms"><Button variant="ghost" size="sm">Forms</Button></Link>
    <Link href="/docs"><Button variant="ghost" size="sm">Help</Button></Link>
  </>}
  userMenu={<UserMenu email={session.user?.email} />}
>
  {children}
</TopNavLayout>
```

**Purpose**: Provides a responsive top navigation bar with logo, nav links, and user menu. Replaces the old sidebar layout.

**Props**:
- `logo` (required): Brand mark or title, shown left in the nav bar
- `navItems` (required): Nav links, shown beside the logo on desktop; in drawer on mobile
- `userMenu` (required): User account trigger (avatar dropdown), shown right on desktop; bottom of drawer on mobile
- `children` (required): Main page content

**Behavior**:
- **Desktop (md+)**: Horizontal nav bar (h-14, border-b, bg-muted/40). Logo left, nav items beside it, user menu right.
- **Mobile (<md)**: Logo left, hamburger button right. Hamburger opens a left-sliding Sheet drawer containing logo, nav items, and user menu.
- **Main content**: `flex-1 min-h-0 flex flex-col overflow-auto`. Each page adds its own spacing via `PageContent` or `EditorLayout`.

**Accessibility**:
- Hamburger button includes `aria-label="Open navigation menu"` and a tooltip
- Drawer includes escape key support and a visually hidden title

**Used in**: Admin console layout (`src/app/(admin)/layout.tsx`) and Operator console layout (`src/app/operator/layout.tsx`)

### PageContent

Standard padding + max-width wrapper for admin pages that are **not** full-bleed editors.

```tsx
import { PageContent } from "@/components/patterns/page-content";

export default function SomePage() {
  return (
    <PageContent>
      <PageHeader title="Forms" ... />
      <DataTable ... />
    </PageContent>
  );
}
```

Provides `p-4 md:p-8` padding and `max-w-7xl mx-auto` centering. Use this on every admin page **except** the form editor, which uses `EditorLayout` directly.

**Do not** wrap the form editor (`/forms/[formId]/edit`) in `PageContent` — `EditorLayout` fills its parent with `h-full`. Its header slot mirrors `PageContent`'s padding and centering so headers align consistently across pages.

### View Page with Preview

Detail/view pages that show a preview of an entity (e.g. form) with layout toggle. Pattern:

```tsx
<PageContent>
  <PageHeader
    title={entity.name}
    description="metadata summary"
    backHref="/forms"
    actions={<>action buttons (Edit, Submissions, etc.)</>}
  />
  <Tabs value={mode} onValueChange={setMode}>
    <TabsList>
      <TabsTrigger value="embed"><Monitor /> Embed</TabsTrigger>
      <TabsTrigger value="page"><AppWindow /> Page</TabsTrigger>
    </TabsList>
    <TabsContent value="embed">
      <div className="border rounded-lg bg-background p-6 min-h-[400px]">
        <FormPreview form={form} mode="embed" />
      </div>
    </TabsContent>
    <TabsContent value="page">...</TabsContent>
  </Tabs>
</PageContent>
```

- **Route**: `/forms/[formId]` — primary entry point from list (Eye icon)
- **Edit** is a secondary action (outline button) linking to `/forms/[formId]/edit`
- Preview modes control width: embed (`max-w-lg`) vs page (`max-w-2xl`)
- Uses `FormPreview` component which loads the embed script via `useEmbedScript` hook

### User Menu

```tsx
import { UserMenu } from "@/components/patterns/user-menu";

<UserMenu email={session.user?.email} />
```

**Purpose**: Compact avatar button in the top nav bar that opens an account dropdown.

**Design**:
- **Trigger**: 32px circle with user initials (`bg-muted`). No email text visible — keeps the nav bar uncluttered.
- **Dropdown**: Opens downward (`side="bottom" align="end"`). Shows email (display only), Manage Account link, Sign Out action.
- **Fallback**: Shows "?" for missing/invalid emails.

**Implementation details**:
- Client component (`"use client"`) for dropdown interactivity
- Initials derived from first 2 alphanumeric chars of email local part, uppercased
- Menu items: Manage Account → `/account`; Sign Out → `signOutAction()` server action

**Usage**: Pass as `userMenu` prop to `TopNavLayout`.

---

## Card layout and primary actions

Use the `Card` component from `src/components/ui/card.tsx` for content in discrete sections (auth flows, settings blocks, submission detail). When a card has a **primary action at the bottom** (submit, save, delete, or action toolbar), put that action in **CardFooter** so spacing and structure stay consistent across the app.

### When to use CardFooter

- Auth forms (login, signup, forgot password, reset password): submit button in footer
- Settings/account cards with a primary action (e.g. Change Password, Delete Account)
- Cards that are mainly an action toolbar (e.g. submission Actions: Mark as Read, Archive, etc.)

### Structure

- **Card** → **CardHeader** (optional), **CardContent** (body), **CardFooter** (optional, for bottom actions).
- When using CardFooter, keep the primary button(s) there, not in CardContent.
- CardFooter has default top padding for separation from content; do not add `pt-*` at call sites unless you need to override.

### Forms that submit from the footer

For auth or settings, the submit button must stay inside the form. Wrap both CardContent and CardFooter in the same `<form>` so the button in the footer is the form submit:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Password</CardTitle>
    <CardDescription>Change your password.</CardDescription>
  </CardHeader>
  <form onSubmit={handleSubmit} noValidate>
    <CardContent className="space-y-4">
      {/* fields, server error */}
    </CardContent>
    <CardFooter>
      <Button type="submit" disabled={isLoading}>
        Change Password
      </Button>
    </CardFooter>
  </form>
</Card>
```

For auth flows where the user can abandon the task (e.g. forgot password), put the **cancel** action in the footer **below** the primary CTA so the primary action comes first. Use a secondary-style control (e.g. `<Button variant="outline" asChild><Link href="...">Cancel</Link></Button>`) and label it "Cancel" so it's clear the user is abandoning the flow, not following a post-success step.

Reference implementation: Account Password card in `src/components/account/account-dashboard.tsx`; forgot-password cancel pattern in `src/app/(auth)/forgot-password/page.tsx`.

---

## Form Inputs

Use standard shadcn/ui form components:

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<div className="space-y-2">
  <Label htmlFor="name">Name</Label>
  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
</div>
```

### Checkbox

Use the `Checkbox` component for boolean toggles within forms.

```tsx
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

<div className="flex items-center gap-2">
  <Checkbox
    id="myOption"
    checked={value}
    onCheckedChange={(checked) => setValue(checked === true)}
  />
  <Label htmlFor="myOption" className="text-sm font-normal cursor-pointer">
    Option label
  </Label>
</div>
```

**Notes:**
- `onCheckedChange` receives `boolean | "indeterminate"` — use `checked === true` to safely narrow to `boolean`
- Pair with `<Label>` using matching `id`/`htmlFor` and `cursor-pointer` so the label is clickable
- Use `font-normal` on the Label to distinguish it from a field label (which uses the default `font-medium`)

### Help Text

Use `<p className="text-xs text-muted-foreground">` for descriptive hints placed directly below an input or group of inputs. Use `<p className="text-sm text-muted-foreground">` for broader descriptive text at the page or section level (page headers, settings section descriptions, empty states).

```tsx
<div className="space-y-2">
  <Label htmlFor="param-name">Parameter Name</Label>
  <Input id="param-name" ... />
  <p className="text-xs text-muted-foreground">
    The name of the URL parameter to read (without the ? or &).
  </p>
</div>
```

When a hint applies to a group of inputs (e.g. a grid of two related fields), place it below the group rather than repeating it under each input.

### Spacing Convention

- Use `space-y-2` for label + input pairs
- Use `space-y-4` between form sections
- Use `gap-2` or `gap-3` for inline elements

### Inline Validation Messages (Admin UI Only)

**Note:** This pattern is for the admin interface only. Public embed forms use HTML5 native validation (see "Embed Form Validation" section).

When a configuration is invalid (but the UI can still render), prefer **inline validation** plus disabling the primary action.

**Prefer simple text errors** (no toast, no boxed alerts) that appear **on blur** to avoid interrupting the typing flow:

- Use `text-destructive` class for error text
- Keep the message close to the offending controls (immediately before the inputs)
- Gate validation display behind `onBlur` of relevant inputs (set a "touched" flag)
- Disable the primary save action while invalid

Example:

```tsx
const [showValidation, setShowValidation] = useState(false);

// In your input:
<Input
  onBlur={() => setShowValidation(true)}
  // ...
/>

// Before the input list:
{showValidation && hasError && (
  <p className="text-sm text-destructive">
    Options must be unique. Choose a different name.
  </p>
)}
```

For **severe** or **complex** validation issues requiring explanation, use `Alert` with `variant="destructive"` (but prefer simple text for common cases).

### Auth/Admin Form Validation

**All auth and admin forms use custom inline validation** with the "reward early, punish late" pattern. This provides better UX than native browser validation popups.

#### Strategy: "Reward Early, Punish Late"

This approach, based on Baymard Institute and Nielsen Norman Group research, provides optimal UX:

- **Punish late**: Errors only appear after a field is blurred ("touched") or the form is submitted
- **Reward early**: Once an error is shown, it clears immediately on change when the input becomes valid
- **Never trap focus**: User can always navigate freely between fields
- **Show all errors after submit**: Display all field errors simultaneously (not one at a time)

#### Implementation Pattern

```tsx
// State
const [touched, setTouched] = useState<Record<string, boolean>>({});
const [submitted, setSubmitted] = useState(false);

// Derived errors (computed every render, not stored in state)
const errors = {
  email: !email ? "Email is required" : !/\S+@\S+\.\S+/.test(email) ? "Enter a valid email address" : "",
  password: !password ? "Password is required" : password.length < 8
    ? `Password must be at least 8 characters. (Your current entry is only ${password.length})`
    : "",
};

// Helper: show error if field is touched or form has been submitted
const showError = (field: keyof typeof errors) =>
  (touched[field] || submitted) && errors[field];

// In JSX:
<form noValidate onSubmit={handleSubmit}>
  <Input
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    onBlur={() => setTouched(t => ({ ...t, password: true }))}
    aria-invalid={!!showError("password")}
  />
  {showError("password") && (
    <p className="text-sm text-destructive">{errors.password}</p>
  )}
</form>
```

#### Key Rules

1. **Always add `noValidate` to forms** - disables all native browser validation
2. **Remove native validation attributes** - no `required`, `minLength`, `pattern`, etc.
3. **Never use `setCustomValidity()` or `reportValidity()`** - these are for embed forms only
4. **Compute errors as derived values** - don't store in state; recalculate each render
5. **Use `aria-invalid` attribute** - Input component has built-in destructive border styling
6. **Show inline errors with `text-destructive`** - below the field, not in popups
7. **Track touched state per field** - on blur, mark field as touched
8. **Set submitted flag on submit** - show all errors when user attempts submission
9. **Check for errors before server call** - return early if validation fails
10. **Keep server errors separate** - use different state variable for API errors

#### Example Messages

- **Required**: `"Email is required"`, `"Password is required"`
- **Format**: `"Enter a valid email address"`
- **Length with context**: `"Password must be at least 8 characters. (Your current entry is only X)"`
- **Mismatch**: `"Passwords do not match"`

#### Admin UI vs Embed Forms

| Context | Validation Approach |
|---------|-------------------|
| **Auth pages** (login, signup, reset) | Custom inline validation with touched/submitted pattern |
| **Admin UI** (form builder, settings) | Custom inline validation with touched/submitted pattern |
| **Embed forms** (public-facing) | HTML5 native validation popups via `setCustomValidity()` |

The split exists because:
- **Admin UI**: We control the entire environment, so custom validation provides better UX
- **Embed forms**: Injected into third-party sites, so native popups are lightweight and consistent

All auth pages (login, signup, forgot-password, reset-password) follow this pattern. See these files for reference:
- `src/app/(auth)/signup/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`

### Keyboard Shortcuts with Validation

When adding keyboard shortcuts (like Enter to add new items), **disable them when validation errors are present**:

```tsx
<Input
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Only allow action if no validation errors
      if (!hasValidationErrors) {
        handleAddItem();
      }
    }
  }}
/>
```

This prevents users from compounding errors by adding more items before fixing existing issues.

---

## Embed Form Validation

The embed script (for public-facing forms) uses a different validation approach than the admin UI:

### HTML5 Native Validation

**The embed script uses native browser validation popups via the HTML5 Constraint Validation API.**

- Custom validation logic runs in JavaScript (`embed/src/validation.ts`)
- Error messages are set using `setCustomValidity()` on input elements
- Native browser popups display via `reportValidity()`
- Visual consistency across all validation types (required, email format, custom rules)

### Key Implementation Details

**One error at a time:**
- Shows native popup on the first invalid field
- Focuses that field automatically
- User fixes it and resubmits to see next error
- Status message shows total count: "Please fix N field(s) to continue."

**Auto-clearing validation:**
- Validation state clears when user starts typing in any field
- Uses `input` event listener: `input.addEventListener("input", () => input.setCustomValidity(""))`

**Error messages in native popups:**
- Default error messages appear in browser's native popup
- Example: "Please enter a valid email address" (not "must be a valid email address")
- Consistent with HTML5 validation UX patterns
- Note: As of v3.7.2, custom validation messages were removed in favor of standardized messages

**Special handling:**
- NAME fields (composite) show popup on first visible part input
- DROPDOWN "Other" inputs clear validation when typing starts
- CHECKBOXES (multi-select) validate that at least one checkbox is checked when required; server-side also validates submitted values against the field's option list
- NUMBER fields validate numeric input, optional integer-only check, and min/max bounds (both client and server)
- Server-side validation errors also use native popups

### Error Display Styling

Inline error text (`.canopy-error`) is **hidden visually** but kept in DOM:
- Uses screen-reader-only CSS (positioned absolutely, 1px size, clipped)
- Maintains accessibility for assistive technologies
- Native popups are the primary error display

### Why This Approach?

1. **Visual consistency** - No mix of native popups and custom inline errors
2. **Platform conventions** - Users expect browser validation behavior
3. **No layout shift** - Popups don't push content around
4. **Built-in accessibility** - Browser handles focus, announcements, keyboard nav
5. **Simpler maintenance** - Less custom CSS, cross-browser handling

### Admin UI vs Embed Validation

| Context | Validation Approach |
|---------|-------------------|
| **Admin UI** (form builder) | Inline text errors with `text-destructive` class |
| **Embed forms** (public) | HTML5 native validation popups via `setCustomValidity()` |

The admin UI uses inline validation for configuration errors because:
- Multiple errors often need to be visible simultaneously
- Users are configuring, not filling a form
- Context remains visible while fixing issues

---

## Empty States

Always provide helpful empty states when lists are empty:

```tsx
{items.length === 0 ? (
  <p className="text-sm text-muted-foreground">
    No items yet. Add your first item to get started.
  </p>
) : (
  <SortableList items={items} ... />
)}
```

For more prominent empty states, use the `EmptyState` component.

---

## Quick Reference: What to Use Where

| Scenario | Component/Pattern |
|----------|-------------------|
| User feedback (success/error) | `toast.success()` / `toast.error()` |
| Confirm destructive action (single choice) | `ConfirmDialog` with `destructive={true}` |
| Destructive action with safe/dangerous options | Custom dialog with footer hierarchy (see Confirmation Dialogs) |
| Reorderable list | `SortableList` with drag handle |
| High-density inventory list | `space-y-0` on SortableList, `py-2` rows (~40-44px), always-visible actions |
| Required field indicator | Red asterisk `<span className="text-red-500 ml-0.5">*</span>` |
| Form editor max-width | `max-w-[640px] mx-auto` on content and header |
| Card with primary action at bottom | Use `CardFooter` for the action(s); keep form/content in `CardContent` |
| Top nav (mobile drawer) | `TopNavLayout` with `logo`, `navItems`, and `userMenu` props |
| User account menu | `UserMenu` in top nav right side (initials avatar + dropdown) |
| Drag anywhere on row | Apply `dragHandleProps` to row, `stopPropagation` on buttons |
| Icon-only action button | `Button variant="ghost" size="icon-sm"` |
| Icon-only button accessibility | Wrap in `Tooltip` |
| Empty list state | Text message or `EmptyState` component |
| Delete action icon | `Trash2` from lucide-react |
| Edit action icon | `Pencil` from lucide-react |
| Drag handle icon | `GripVertical` from lucide-react |
| Page/section headings | Add `font-heading` class (Urbanist) |
| Body text | No class needed (Inter is default via `font-sans`) |
| Code/monospace | Add `font-mono` class (Geist Mono) |

---

## Anti-Patterns to Avoid

1. **Never use browser dialogs** (`alert()`, `confirm()`, `prompt()`)
2. **Never use Up/Down buttons** for reordering - use drag-and-drop
3. **Never use icon buttons without tooltips** - accessibility issue
4. **Never wrap draggable refs in component wrappers** - breaks ref forwarding
5. **Never use array indices as React keys** for sortable items
6. **Never use Badge or text for required indicators** - use red asterisk `*`
7. **Never use card-per-row styling for inventory lists** - reduces scan speed
8. **Never let editor layouts span full screen width** - use 640px max-width
9. **Never forget `stopPropagation`** when applying dragHandleProps to entire row
10. **Never use hover-reveal with drag-and-drop lists** - CSS hover states conflict with drag operations
11. **Never forget `font-heading` on headings/titles** - maintain typeface consistency
12. **Never use native HTML5 validation in admin/auth forms** - use custom inline validation with touched/submitted pattern instead
13. **Never use `setCustomValidity()` or `reportValidity()` in admin UI** - these are reserved for embed forms only
14. **Never put a card's primary bottom action in CardContent when CardFooter is available** - use CardFooter for consistent spacing

---

## File References

| Component | Location |
|-----------|----------|
| Card | `src/components/ui/card.tsx` |
| Button | `src/components/ui/button.tsx` |
| Checkbox | `src/components/ui/checkbox.tsx` |
| Tooltip | `src/components/ui/tooltip.tsx` |
| SortableList | `src/components/ui/sortable-list.tsx` |
| ConfirmDialog | `src/components/confirm-dialog.tsx` |
| useToast | `src/hooks/use-toast.ts` |
| EmptyState | `src/components/patterns/empty-state.tsx` |
| PageHeader | `src/components/patterns/page-header.tsx` |
| PageContent | `src/components/patterns/page-content.tsx` |
| EditorLayout | `src/components/patterns/editor-layout.tsx` |
| TopNavLayout | `src/components/patterns/top-nav-layout.tsx` |
| UserMenu | `src/components/patterns/user-menu.tsx` |
| AccountDashboard | `src/components/account/account-dashboard.tsx` |
| FontPicker | `src/components/ui/font-picker.tsx` (curated lists: `src/lib/google-fonts.ts`, font loader: `src/lib/load-google-fonts.ts`) |