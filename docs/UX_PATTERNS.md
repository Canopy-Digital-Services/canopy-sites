# UX Patterns

UI conventions for the Canopy Forms admin interface, plus the embed theming system.

**How to use this doc.** Section 1 is the complete rule set: every prohibition and every required choice, with no rationale. Read it before any UI work. The sections after it add detail, code, and the reasoning behind a rule, and are meant to be read by section, not front to back. If a rule and a code sample ever disagree, the rule wins and the sample is stale.

**Editing this doc.** Follow `docs/DOC_MAINTENANCE.md`. In particular: a new prohibition goes in section 1 as well as its topic section, never add a summary or quick-reference table, and delete what a change supersedes rather than leaving both.

Stack: shadcn/ui over Radix (`radix-ui`, unified package), Tailwind v4, `lucide-react` icons, `class-variance-authority` variants, `cn()` from `tailwind-merge` + `clsx`, `@dnd-kit/*` drag and drop, `sonner` toasts. Components live in `src/components/ui/` (primitives), `src/components/patterns/` (layout), `src/components/` (features).

---

## 1. Hard rules

**Never:**

1. Browser native dialogs: `alert()`, `confirm()`, `prompt()`. Use `toast` and `ConfirmDialog`.
2. Up/Down buttons for reordering. Use `SortableList`.
3. Icon-only buttons without a `Tooltip`.
4. Array indices as keys for sortable items. Items need stable `id`s.
5. Wrapping `dragHandleProps` in a component. Apply them to the element directly or refs break.
6. Omitting `stopPropagation` on `onClick` **and** `onPointerDown` for clickable elements inside a drag-anywhere row.
7. Hover-reveal actions in a drag-and-drop list. Keep them always visible.
8. Badge or `(required)` text for required fields. Use the red asterisk.
9. Badge for prominent status. Use dot + text. Badge is for compact metadata rows.
10. Badge for numeric counts in tables. Use plain muted text.
11. Card-per-row styling for inventory lists. Use the high-density single-container layout.
12. Native HTML5 validation in admin or auth forms, including `required`, `minLength`, `pattern`, `setCustomValidity()`, and `reportValidity()`. Those are embed-only.
13. Custom inline validation in embed forms. Those are native-popup-only.
14. A card's primary bottom action in `CardContent` when `CardFooter` exists.
15. `text-destructive` for informational notices. Amber is for incomplete or needs-attention; destructive is for wrong.
16. An "Add item" button above its list or in a header row beside the list's label. It goes below the list.
17. Helper text next to a labelled Add button in an empty list. The button says it.
18. A description that paraphrases its own title. Delete it.
19. `position="item-aligned"` on `SelectContent`. The shared component defaults to `position="popper"` / `align="start"` deliberately; item-aligned overlays the trigger and makes long lists expand upward with scroll chevrons.
20. A preselected default type in a picker-gated configuration modal.
21. A hand-converted oklch value for a brand color. Point the token at `var(--canopy-teal)` and friends.
22. A decorative colored accent bar to signal importance (`border-l-4 border-l-primary` and similar).
23. Bounce or rotation in motion. Increase travel distance or duration instead.
24. Bespoke durations or easing curves for enter/leave. Use the four flow tokens.
25. A navigation button whose label describes form state (a Continue button that becomes "No header"). Mark the section `(Optional)` instead.
26. A larger radius to make something friendlier. Radius is not a design lever here.
27. Hardcoded colors (`bg-[#005F6A]`, `style={{color:'#FF6B5A'}}`), hardcoded `green-600` for green text, or a new icon pack.
28. Letting an editor or settings column span the full screen width. Constrain it (see section 10 for the editor's exact widths). Data tables and multi-column dashboards are the exception.

**Always:**

29. Semantic color tokens from [globals.css](src/app/globals.css): `bg-primary`, `text-destructive`, `text-success`, `text-muted-foreground`.
30. `text-success-strong` for green text and icons. `--success` is a fill and fails contrast as text.
31. `font-heading` on every semantic heading (page, card, section, nav titles). Never on body, buttons, labels, table content, or toasts.
32. `noValidate` on admin and auth forms, with the touched/submitted pattern.
33. `Button variant="ghost" size="icon-sm"` for icon-only action buttons.
34. `GripVertical` visible in a sortable row, even when the whole row drags.
35. `PageHeader` for page titles. Never an inline `<h1>`.
36. `PageContent` on admin pages, except the form editor.
37. `aria-describedby={undefined}` on `DialogContent` when you remove its `DialogDescription`.
38. A new flow animation added to the `prefers-reduced-motion` block, shortened to `1ms` rather than removed.

**Standard icons:** `GripVertical` drag, `Trash2` delete, `Pencil` edit, `Plus` add, `X` close, `Check` confirm, `AlertCircle` warn. Size `h-4 w-4`.

**Light mode only.** Dark mode variables exist in `globals.css` but were never updated with brand colors. Don't advertise dark mode support; if you add it, re-check brand contrast and every interactive state.

---

## 2. Color and surfaces

### Brand colors

| Token | Hex | Role |
|-------|-----|------|
| `--canopy-teal` | `#005f6a` | Primary actions, links, brand emphasis |
| `--canopy-green` | `#5fd48c` | Success states, positive feedback |
| `--canopy-coral` | `#ff6b5a` | Destructive actions, errors |

The three hexes are declared once in `:root`. **A semantic token carrying a brand color must reference the hex variable:**

```css
--primary: var(--canopy-teal);
--secondary-foreground: var(--canopy-teal);
--accent-foreground: var(--canopy-teal);
--ring: var(--primary);
```

**Why, since this recurred.** These were originally hand-converted oklch values and every one drifted. `--primary` was `oklch(0.38 0.07 195)`, which renders `#004e4e`: hue 195 instead of the brand's 208.5, so green and blue came out nearly equal where the brand is bluer. The admin UI's "brand teal" was visibly not the brand teal while hardcoded `#005F6A` defaults elsewhere were correct. The drift survives review because both values look like plausible teal.

Two tokens remain **known-drifted, deliberately**: `--success` (`oklch(0.75 0.15 155)` renders `#4ec983` vs brand `#5fd48c`) and `--destructive` (`oklch(0.68 0.21 25)` renders `#ff5251` vs brand `#ff6b5a`). `--success` is a fill whose lightness was tuned by hand; changing `--destructive` shifts contrast on every destructive control. Do not "fix" either without checking contrast and confirming it is wanted.

For a lighter or darker shade, derive it (`bg-primary/80`, `color-mix()`) rather than writing a literal.

Brand combinations meet WCAG AA (teal on white is AAA).

### Neutrals, radius, elevation

- **Surfaces**: `--card` (white, raised: cards, modals, inputs), `--background` (off-white page), `--muted` (sunken: hover wash, code blocks, wells). `--secondary` and `--accent` alias `--muted`.
- **Border**: one `--border` (`oklch(0.88 0 0)`); `--input` matches.
- **Text**: `--foreground` (`oklch(0.18 0 0)`) and `--muted-foreground` (`oklch(0.50 0 0)`, secondary and placeholder).
- **Focus ring**: derived from `--primary`, rendered at 50% via `ring-ring/50`. There is no separate ring hue.
- **Radius**: two values. A **2px workhorse** (`--radius`) for every container and control, with the whole `rounded-sm/md/lg/xl/2xl` ramp collapsed onto it, plus **pill** (`rounded-full`) for badges, avatars, status dots.
- **Elevation**: four role-based two-layer shadows. `shadow-1` rest (cards), `shadow-2` lift (hover), `shadow-3` float (popovers, dropdowns), `shadow-4` command (modals). Old Tailwind names alias in.

### Brand gradient

`var(--canopy-gradient)` runs highlight green (upper-left) to main teal (lower-right), matching the canopy mark. Logo and decorative admin swoops only. It is not a UI background fill.

### Status: dot + text vs badge

| Context | Pattern |
|---------|---------|
| Prominent, focal status (status cards, detail headers) | Dot + text |
| Compact metadata (cards, tables, list rows) | Badge |

```tsx
// Live: pulsing green dot, dark-green ink
<span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-strong">
  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
  Live
</span>

// Draft: static muted dot
<span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
  Draft
</span>
```

`animate-pulse` is for live states only. Badges are **tinted pills** (pale fill, saturated text, no border, fully rounded) so they read as labels rather than buttons. Variants: `success`, `brand`, `neutral` (default), `amber`, `destructive`. The old shadcn names (`default`, `secondary`, `outline`) still resolve as aliases.

### Notices

Three tones, matched to severity: **brand** teal (informational), **amber** (incomplete, needs attention), **destructive** coral (something is wrong). Transient operation failures go to `toast.error()` instead.

Notices are **borderless tinted blocks** at the workhorse radius. The tint carries the severity, so no outline, which keeps notices and badges reading as one family.

```tsx
<div className="flex items-start gap-2.5 rounded-lg bg-amber-100 px-3.5 py-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
  <p>Publish your form to enable live submissions.</p>
</div>
```

---

## 3. Motion

Motion has one job: make it clear content **arrived** or **left**, so a state change doesn't read as a jump cut. Not for delight, emphasis, or personality.

Four tokens in `globals.css` define every deliberate transition:

```css
--ease-flow-in:     cubic-bezier(0.25, 1.12, 0.45, 1);
--ease-flow-out:    cubic-bezier(0.45, 0, 0.7, 0.35);
--duration-flow-in:  420ms;
--duration-flow-out: 260ms;
```

From Tailwind: `duration-[var(--duration-flow-in)] ease-[var(--ease-flow-in)]`.

Entry rises from below (3rem) at 0.94 scale and decelerates. Exit accelerates away and fades, faster than entry, because a departing element doesn't need to be read.

**Energy comes from distance, not springiness**, and this was settled by trying the alternative. The entry curve's `1.12` control point overshoots ~2%, about a pixel at a 3rem rise, so it reads as a decisive stop. A real back-out curve (`1.5`+, ~9% overshoot) plus rotation was tested and rejected as playful in a way that undercut a professional tool. When motion feels too subtle, increase travel or duration.

| Surface | Behavior |
|---------|----------|
| Editor flow cards | Rise in; exit sideways (left forward, right back) |
| `DialogContent` | Rise in with `slide-in-from-bottom-12`; drop away on close |
| Progressive reveals | `.editor-reveal` grows the container to fit |

`DialogContent` carries this globally. Don't override per dialog.

**Height reveals** use `.editor-reveal`, animating `grid-template-rows` from `0fr` to `1fr` while fading. It needs a single child with `overflow-hidden`. Two constraints: no overshoot on height (a container springing past its target reads as a glitch, so this uses a plain deceleration curve, not `--ease-flow-in`), and `fr` interpolation needs Chrome 117 / Safari 17.4 (older engines snap to the final height, degrading safely).

**Reduced motion** shortens every flow animation to `1ms` rather than removing it, because the editor flow advances on `animationend` and would deadlock if the animations never fired.

---

## 4. Typography

Three families: **Urbanist** headings, **Inter** body and UI, **Geist Mono** code. Loaded via `next/font/google` in [layout.tsx](src/app/layout.tsx), mapped in `@theme inline`:

```css
--font-sans: var(--font-inter);      /* default on <body> */
--font-heading: var(--font-urbanist);
--font-mono: var(--font-geist-mono);
```

`font-heading` goes on page titles, section headings, card and modal titles, and nav titles. Not on body copy, buttons, labels, inputs, table content, or toast text.

Headings are a **single weight (600)**; hierarchy is carried by size.

| Level | Classes | Size / line-height |
|-------|---------|--------------------|
| Page title | `text-3xl font-heading font-semibold tracking-tight` | 30px / 1.15 |
| Card title | `text-[1.375rem] font-heading font-semibold tracking-tight` | 22px / 1.25 |
| Section heading | `text-base font-heading font-semibold` | 16px / 1.4 |
| Field label | `text-sm font-medium` | 14px / 1.4 |

Body is 14px (`text-sm`) Inter regular; meta, captions, and stats step to 12px (`text-xs`). Field labels and inputs use `font-medium` (500).

`PageHeader`, `CardTitle`, `SettingsSection`, `EmptyState`, and the `Markdown` h1/h2/h3 renderers already apply this correctly. Follow them for new title components.

---

## 5. Copy

A title, a labelled button, and a visible control already say what a thing is and does. **A description earns its place only if it states a fact, constraint, or consequence the title and controls don't convey.** Otherwise it's a sentence the user reads and discards on every visit.

**The test: delete it. If nothing is lost, it was noise.**

Failed the test and were removed: "Configure the field details and validation rules" (under an "Add Field" dialog), "Customize how your form looks" (under "Appearance"), "Your current plan and usage" (on a card that visibly shows both), "Click the button below to add your first field" (narrating a button), "Your form is ready" (under an "All set" title).

Passed, and why: "Domains allowed to embed and submit to this form. Localhost is always allowed for development" (a constraint you can't infer), "You'll be signed out of all sessions shortly after" (a consequence), "Leave empty for no limit. Spam submissions are not counted" (non-obvious behavior of a blank value).

**Trim rather than delete when a sentence mixes both.** The Password card read "Change your password. You'll be signed out of all sessions shortly after." The first sentence restated the title; the second survived alone.

**Zero states are the exception.** A first-run empty state is the one place a sentence of orientation earns its keep, because the user has no surrounding context. That does not license helper text beside a labelled Add button in a populated list.

**Removing a `DialogDescription` requires `aria-describedby={undefined}` on `DialogContent`.** Radix wires the attribute to a generated id whether or not a description renders, so omitting it leaves a dangling reference.

---

## 6. Buttons, icons, tooltips, toasts

### Buttons

| Variant | Use |
|---------|-----|
| `default` | Primary actions. Also the safe choice when paired with a dangerous alternative. |
| `destructive` | Dangerous action when it's a single confirm/cancel choice |
| `outline` | Secondary (Cancel, Back) |
| `ghost` | Tertiary and icon-only in toolbars |
| `secondary` | Alternative secondary styling; also active filter state |
| `link` | Text actions. With `text-destructive`, de-emphasizes a dangerous option beside a safer primary. |

Sizes step on a tight scale: `sm` 28px, `default` 32px (deliberately compact), `lg` 40px, plus `icon-sm` 28px (**use for action icons in lists**), `icon` 32px, `icon-lg` 40px. Corners are the workhorse radius. Filled variants carry no shadow; `outline` carries `shadow-xs`. Ghost hover lands on `hover:bg-muted`.

### Tooltips

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon-sm"><Trash2 className="h-4 w-4" /></Button>
  </TooltipTrigger>
  <TooltipContent>Delete item</TooltipContent>
</Tooltip>
```

With `asChild`, put props on the element itself. A wrapper component breaks ref forwarding:

```tsx
<TooltipTrigger asChild><button {...dragHandleProps}>…</button></TooltipTrigger>  // works
<TooltipTrigger asChild><DragHandle dragHandleProps={…} /></TooltipTrigger>      // breaks
```

**Disabled buttons** skip pointer events, so Radix never fires. Wrap in a focusable span:

```tsx
<TooltipTrigger asChild>
  <span tabIndex={0}>
    <Button disabled aria-disabled="true">Publish</Button>
  </span>
</TooltipTrigger>
```

Only when the disabled state has a reason worth showing. Loading and in-flight states need no tooltip. Reference: [publish-content.tsx](src/components/forms/publish-content.tsx) at the `maxPublishedForms` cap.

### Toasts

`useToast` from [use-toast.ts](src/hooks/use-toast.ts) provides `toast.success` / `.error` / `.info` / `.warning` / `.loading` (returns an id to dismiss), plus helpers `showSaving()`, `showSaved()`, `showError()`.

---

## 7. Dialogs

`ConfirmDialog` ([confirm-dialog.tsx](src/components/confirm-dialog.tsx)) covers simple confirm/cancel. Props are on the component; `destructive` switches the confirm button styling.

### Footer hierarchy when a safe and a dangerous option compete

```
[ Cancel ]                    Dangerous option    [ Safe option ]
  outline, mr-auto            link +              default variant,
  (isolated left)             text-destructive    rightmost
```

Safe action rightmost with primary weight, at the endpoint of left-to-right scanning. Dangerous action present but light, so choosing it is conscious. Cancel isolated left via `mr-auto`, splitting escape from decisions. Let the layout persuade: no "are you sure?" text.

**Do not use `variant="destructive"` (filled red) when a safer alternative is present.** The filled button is for single-action confirmations with no competing choice.

Apply this whenever a destructive action may affect persisted data. Instead of `ConfirmDialog`, build a controlled dialog (`open`/`onOpenChange`, no trigger) that checks for affected data on mount, falls back to simple confirmation when none exists, and otherwise shows the count with a keep-data and a purge-data option. Reference: [delete-field-dialog.tsx](src/components/delete-field-dialog.tsx).

### Blocking layout dialogs

When a state transition leaves the account somewhere piecemeal admin actions would be incoherent (a plan downgrade that unpublished every form), render a non-dismissible dialog at the admin layout level so every route is intercepted.

- Mount from the admin `layout.tsx` server component on a server-read flag. No client-side gating.
- `Dialog open` hard-coded, no `onOpenChange`, `showCloseButton={false}`.
- Block escape and outside click: `onEscapeKeyDown` and `onPointerDownOutside` both `preventDefault()`.
- Exactly two exits, both resolving the state. No skip.
- Self-contained: all data arrives as props from the layout.

Reference: [plan-resolution-dialog.tsx](src/components/plan/plan-resolution-dialog.tsx), mounted when `Account.requiresPlanResolution`.

### Type-first configuration modals

When available controls depend on a type choice, **do not preselect a type**. Preselecting creates a path-of-least-resistance trap: users accept a generic `Text` field where `Email`, `Phone`, or `Address` would give better validation and input affordances.

- Open with only the type selector visible, placeholder "Choose a field type…".
- **Hide** downstream controls until a type is chosen. Not disabled, hidden, so the modal reads as "type first".
- Animate the reveal so the dialog grows instead of snapping:

  ```tsx
  {type && (
    <div className="editor-reveal">
      <div className="space-y-4 overflow-hidden -mx-1 px-1">{/* label, config, help text */}</div>
    </div>
  )}
  ```

  `-mx-1 px-1` keeps focus rings from being clipped by the `overflow-hidden` the height animation needs. The reveal only animates on first selection; switching between chosen types leaves the block mounted.
- Primary action stays disabled until the type and any required downstream fields are filled.
- **Edit mode renders the full form immediately.** Picker-gating is for add/create only.
- Preserve structurally compatible state across type switches (label, help text); clear only what doesn't apply (options when leaving `DROPDOWN`).

Reference: [field-editor-modal.tsx](src/components/field-editor-modal.tsx), see `handleTypeChange`.

---

## 8. Form inputs and validation

### Inputs

Standard shadcn `Input`, `Label`, `Textarea`, `Select`. Spacing: `space-y-2` for a label + input pair, `space-y-4` between sections, `gap-2`/`gap-3` inline.

**Checkbox**: `onCheckedChange` receives `boolean | "indeterminate"`, so narrow with `checked === true`. Pair with a `Label` sharing `id`/`htmlFor`, plus `cursor-pointer` and `font-normal` to distinguish it from a field label.

**Dependent options**: when a checkbox only makes sense while its parent is on, render it inside the parent's conditional block rather than disabling it, and align hint text under the label with `ml-6` (checkbox width plus gap) so the hint belongs to that option, not the group. Reference: "Include responses in the email" in [after-submission-section.tsx](src/components/forms/after-submission-section.tsx).

**Help text**: `text-xs text-muted-foreground` directly below an input or group; `text-sm text-muted-foreground` for page and section level description. A hint covering a group goes below the group, not repeated under each input.

### Admin and auth validation

**"Reward early, punish late"**, on every auth and admin form:

- Errors appear only after a field is blurred (touched) or the form is submitted.
- Once shown, an error clears immediately on change when the value becomes valid.
- Never trap focus. After submit, show all field errors at once.

```tsx
const [touched, setTouched] = useState<Record<string, boolean>>({});
const [submitted, setSubmitted] = useState(false);

// Derived every render, never stored in state
const errors = {
  email: !email ? "Email is required" : !/\S+@\S+\.\S+/.test(email) ? "Enter a valid email address" : "",
};
const showError = (f: keyof typeof errors) => (touched[f] || submitted) && errors[f];

<form noValidate onSubmit={handleSubmit}>
  <Input
    onBlur={() => setTouched(t => ({ ...t, email: true }))}
    aria-invalid={!!showError("email")}
  />
  {showError("email") && <p className="text-sm text-destructive">{errors.email}</p>}
</form>
```

`aria-invalid` drives the Input's built-in destructive border. Keep server errors in a separate state variable, and check client errors before the server call.

Message style: `"Email is required"`, `"Enter a valid email address"`, `"Passwords do not match"`, and length errors that include the current count (`"Password must be at least 8 characters. (Your current entry is only 5)"`).

For invalid **configuration** (as opposed to a form field), the same shape applies: plain `text-destructive` text on blur, placed immediately before the offending inputs, with the primary action disabled while invalid. No toast, no boxed alert. Reserve `Alert variant="destructive"` for severe or complex cases needing explanation.

**Keyboard shortcuts** (Enter to add an item) must be disabled while validation errors are present, so users can't compound errors.

Reference: [signup](src/app/(auth)/signup/page.tsx), [login](src/app/(auth)/login/page.tsx), [reset-password](src/app/(auth)/reset-password/page.tsx), [forgot-password](src/app/(auth)/forgot-password/page.tsx).

### The two dialects

| Context | Approach |
|---------|----------|
| Auth pages and admin UI | Custom inline validation, touched/submitted, `noValidate` |
| Embed forms (public) | HTML5 native popups via `setCustomValidity()` |

The split is deliberate: the admin UI is an environment we fully control, and configuration errors often need several visible at once with context intact. The embed is injected into third-party sites, where native popups are lightweight, consistent, and bring their own focus handling and announcements.

Embed specifics, in `embed/src/validation.ts`:

- **One error at a time.** Popup on the first invalid field, focus it, user resubmits for the next. The status strip shows the total: "Please fix N field(s) to continue."
- Validation clears on typing: `input.addEventListener("input", () => input.setCustomValidity(""))`.
- Messages are the browser's standard ones. Custom messages were removed in v3.7.2.
- `.canopy-error` inline text is visually hidden but kept in the DOM for assistive tech; popups are the visible channel.
- Per type: NAME shows its popup on the first visible part input; DROPDOWN "Other" inputs clear on typing; CHECKBOXES require at least one checked when required, with the server also checking submitted values against the option list; NUMBER validates numeric input, optional integer-only, and min/max on both sides.
- Server-side validation errors surface through the same native popups.

---

## 9. Lists

### Sortable lists

`SortableList` ([sortable-list.tsx](src/components/ui/sortable-list.tsx)). Layout is `[drag handle] [content] [edit] [delete]`. Movement is vertical only. `transition: { idle: true }` is already configured to prevent double animation on release.

That file is the only place `@dnd-kit/*` is imported. Everything else composes `SortableList`, so drag behavior changes happen there and nowhere else.

**Pattern 1, handle only** (default; best when the row has many interactive elements): put `dragHandleProps` on a dedicated handle button.

```tsx
<SortableList items={items} onReorder={handleReorder} renderItem={({ item, dragHandleProps }) => (
  <div className="flex items-center gap-2">
    <button {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
      <GripVertical className="h-4 w-4" />
    </button>
    <span className="flex-1">{item.name}</span>
  </div>
)} />
```

**Pattern 2, drag anywhere** (best for simple inventory rows): put `dragHandleProps` on the row, and add `stopPropagation` to both `onClick` and `onPointerDown` of every clickable child, or clicks start drags.

For items with no database id (select options), generate stable ids in state (`option-${index}` via `useMemo`), never bare indices.

### High-density lists

For inventory-style lists users scan quickly (fields, options): one bordered container with row separators rather than a card per row, `py-2 px-3` rows (~40-44px), label dominant with muted compact metadata, single line per row, actions always visible.

```tsx
<SortableList items={items} onReorder={onReorder} className="border rounded-md space-y-0" renderItem={…} />
```

`space-y-0` overrides the default `space-y-2`. Rows get `border-b border-border/50 last:border-b-0` and `hover:bg-muted/50`; action clusters get `shrink-0`.

Actions stay visible because hover-reveal fights drag and drop: `:hover` can stick during DOM manipulation, and touch devices have no hover. Use this layout for simple items with 2-3 properties, not for rich metadata.

### Adding items

The Add action goes **below** the list, flush-left with the content column, because users click where the new item will appear.

```
[drag] [Item 1] [trash]
[drag] [Item 2] [trash]
+ Add item
```

Variant depends on whether the list is the primary thing on screen:

| Context | Variant |
|---------|---------|
| Primary list (Add Field in the editor) | `Button` default variant, Plus icon + text |
| Sub-list inside a container with its own CTA (Add option inside the field dialog) | `Button variant="ghost" size="sm"` with `text-primary` |

```tsx
<Button type="button" variant="ghost" size="sm" onClick={handleAddOption}
  className="-ml-3 text-primary hover:text-primary hover:bg-primary/10">
  <Plus className="h-4 w-4" />
  Add option
</Button>
```

`-ml-3` cancels the button's internal `px-3` so the icon aligns flush-left with the section's labels and drag handles, while the hover area keeps normal padding. `hover:text-primary` is overridden so ghost doesn't shift to foreground. References: [field-list.tsx](src/components/field-list.tsx), [dropdown-config.tsx](src/components/field-config/dropdown-config.tsx).

When the list is empty, the labelled Add button is the whole empty state.

### Required and optional markers

Required fields get a red asterisk immediately after the label text, before any metadata:

```tsx
{field.label}{field.required && <span className="text-destructive ml-0.5">*</span>}
```

Fields are required-by-exception, so inputs are never marked optional. **A whole skippable section is different** and gets an inline `(Optional)` after its title:

```tsx
<CardTitle className="flex items-baseline gap-2">
  Header
  <span className="text-sm font-normal tracking-normal text-muted-foreground">(Optional)</span>
</CardTitle>
```

Baseline-aligned, since it's a parenthetical to the title rather than a chip beside it. No Badge: a tinted pill next to a 22px heading is louder than the signal warrants and reads as status rather than grammar. The marker replaces any description that said the same thing.

**Placement beats copy.** If users don't believe a step is optional, check whether the flow forces them through it first. An optional step used as the opening gate reads as required no matter how it's labelled. Reference: [header-section.tsx](src/components/forms/header-section.tsx).

---

## 10. Layout

### Page shell

`PageContent` ([page-content.tsx](src/components/patterns/page-content.tsx)) gives `p-4 md:p-6` and a centered max-width: `default` is `max-w-5xl` (account, forms list, submission detail), `wide` is `max-w-7xl` for wide tables like the operator Accounts view. **Don't wrap the form editor in it**: `FormWorkspace` fills its parent with `h-full`, and its header slot mirrors `PageContent`'s padding so headers align across pages.

`PageHeader` ([page-header.tsx](src/components/patterns/page-header.tsx)) takes `title`, `description`, `actions`, and `backHref`. Prefer `backHref` (an ArrowLeft before the title) over a "Back to X" action button.

`TopNavLayout` ([top-nav-layout.tsx](src/components/patterns/top-nav-layout.tsx)) takes `logo`, `navItems`, `userMenu`, `children`, all required. Desktop (md+) is a horizontal bar (`h-14`, `border-b`, `bg-muted/40`); below md the logo stays left and a hamburger opens a left-sliding Sheet holding logo, nav, and user menu. The `logo` slot renders in **both** places, so anything in it appears in both with no mobile handling. Content area is `flex-1 min-h-0 flex flex-col overflow-auto`, with pages adding their own spacing. Used by the admin and operator layouts.

`UserMenu` ([user-menu.tsx](src/components/patterns/user-menu.tsx)) is a 32px initials circle (`bg-primary text-primary-foreground`, `bg-primary/80` on hover) with no visible email, opening downward to email, Manage Account, and Sign Out. Initials are the first two alphanumerics of the email local part, uppercased, falling back to "?".

### Form editor

`FormWorkspace` ([form-workspace.tsx](src/components/forms/form-workspace.tsx)) is the single surface for one form. Three tabs, with the active one read from the `mode` search param (not local state) so tabs are linkable and survive reload:

| `?mode=` | Tab | Content |
|----------|-----|---------|
| `edit` (default) | Editor | `EditorFlow` + live preview |
| `publish` | Publish | `PublishContent` |
| `submissions` | Submissions | `SubmissionsContent` |

`/forms/[formId]/edit` redirects to `/forms/[formId]?mode=edit`. Auto-save runs on the Editor and Publish tabs only. The form name is inline-editable (pencil) on the Editor tab only.

Layout: the Editor tab is a two-column split, Publish and Submissions are single full-width columns. On `lg+` both columns are a fixed `w-[600px]`, centered as a pair, with the editor column's content constrained to `max-w-[640px]` inside it; the preview column carries a symmetric side shadow and is `hidden lg:flex`. The editor column is `overflow-y-auto overflow-x-hidden`, and that horizontal clip is what contains the flow cards' sideways exit. Below `lg` the editor is full-width and the preview hides behind a fixed right-edge handle opening a `RightPanel` sheet. Preview mode is derived from `form.type` (`HOSTED` page, `EMBEDDED` embed), never user-toggled.

`EditorFlow` ([editor-flow.tsx](src/components/forms/editor-flow.tsx)) shows the editor's sections **one at a time**: Header, Fields, Appearance, Submission Settings, then a terminal "All set" card linking to Publish. A stack of four cards presented its full complexity before the first decision.

- Section cards take `variant="flow" | "accordion"`. `flow` is always-expanded with no chevron; `accordion` is the original collapsible card. Both are maintained.
- **Advancing is animation-driven**: Continue sets an exit direction and the step index increments on `animationend`. The handler must check `event.target === event.currentTarget` and match the animation name, because child animations bubble.
- Forward exits left, back exits right.
- Section cards are plain `Card`s with no accent bar (see rule 22).

Known gaps, deliberate and pending further disclosure work: the flow always starts at Header even when editing an existing form, progress dots aren't clickable, and there's no per-card disclosure.

`FormProvider` / `useFormContext` ([form-context.tsx](src/components/forms/form-context.tsx)) holds editor state with granular updaters. Changes auto-save on a 1s debounce per group when `autoSaveEnabled`:

| Group | Fields | Action |
|-------|--------|--------|
| basics | `name` | `updateFormBasics` |
| header | `title`, `description` | `updateFormHeader` |
| theme | `defaultTheme` | `updateFormAppearance` |
| afterSubmission | success, redirect, email, origins, stop, max | `updateAfterSubmission` |

Field create/update/delete/reorder call server actions **immediately**, not through auto-save.

`FormPreview` ([form-preview.tsx](src/components/forms/form-preview.tsx)) handles both static and live rendering: `mode="embed"` is a centered `max-w-lg` container, `mode="page"` applies full page theming via `extractPageTheme()`, and `live` reads from `useFormContext()` with a 150ms debounce.

### Cards

Use `CardFooter` for a card's primary bottom action: auth forms, settings cards with one primary action, and cards that are mainly an action toolbar. Footer has default top padding, so don't add `pt-*` at call sites.

For forms submitting from the footer, wrap **both** `CardContent` and `CardFooter` in the same `<form>` so the footer button is the submit:

```tsx
<Card>
  <CardHeader><CardTitle>Password</CardTitle></CardHeader>
  <form onSubmit={handleSubmit} noValidate>
    <CardContent className="space-y-4">{/* fields, server error */}</CardContent>
    <CardFooter><Button type="submit" disabled={isLoading}>Change Password</Button></CardFooter>
  </form>
</Card>
```

Where the user can abandon the task (forgot password), put Cancel in the footer **below** the primary CTA, as `variant="outline"`, labelled "Cancel" so it reads as abandoning rather than as a next step. References: Password card in [account-dashboard.tsx](src/components/account/account-dashboard.tsx), [forgot-password](src/app/(auth)/forgot-password/page.tsx).

### Tables, filters, empty states

Numeric counts in cells are plain `text-sm text-muted-foreground`, not badges. If the row name already links to the detail page, don't add a redundant View icon; show only non-obvious actions.

Action hierarchy responds to state: the likely next action takes `default` while the rest stay `outline` (Mark as Read is primary while status is `NEW`).

Filters use title-case labels with uppercase enum values as params, and the active button uses `variant="secondary"` (soft highlight) rather than filled `default`, since a filter is selection state, not a primary action.

Empty states: a plain `text-sm text-muted-foreground` line suffices inline; use `EmptyState` ([empty-state.tsx](src/components/patterns/empty-state.tsx)) with `icon`, `title`, `description`, `action` for prominent ones. This is the one place an orienting sentence is welcome (section 5).

### Type chooser

For a creation flow that needs a commitment to one of two mutually exclusive modes shaping everything downstream (form type at `/forms/new`). Two side-by-side cards as a radio group, each with a subdued icon, one-line title, one-line description. Not for binary toggles inside an existing object; use a Switch or Tabs there.

Cards render as `<button type="button" role="radio" aria-checked>` so they're keyboard and screen-reader accessible with no visible radio circle. Selected gets `border-primary`, a faint `ring-1 ring-primary`, the icon shifting `text-muted-foreground/60` to `text-primary`, and a small primary check chip top-right. Submit stays disabled until the chooser and any sibling required inputs have values; the disabled button is the affordance, with no inline error. Reference: [new-form-form.tsx](src/app/(admin)/forms/new/new-form-form.tsx).

### Dashboard cards and view toggle

The forms landing page defaults to a card grid with a toggle to a compact list.

**View toggle** ([view-toggle.tsx](src/components/forms/view-toggle.tsx)): two `Link`s (server component, no JS) in a pill-shaped `bg-muted` container, active getting `bg-background shadow-sm`. State lives in `?view=grid|list`, defaulting to grid. Icons `LayoutGrid` and `List`.

**Cards** ([form-card.tsx](src/components/forms/form-card.tsx)), top to bottom: a 16:10 thumbnail linked to the editor with no border below it, a name row (bold, linked, truncated) with hover-revealed submissions and delete icons, and a meta row putting the published/draft Badge inline with field count, submission count, and new-submission count (`text-success`). Cards use `group` with `opacity-0 group-hover:opacity-100 transition-opacity` icons, a single content div at `px-4 py-3`, and `hover:shadow-md transition-shadow overflow-hidden`. Thumbnails are auto-captured (JPEG, half-res) from the preview panel after each save via `useThumbnailCapture`, stored as `Bytes`, served from `GET /api/forms/[formId]/thumbnail`, falling back to `bg-muted/40` with the `<img>` hiding itself on 404. Grid is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`.

Above the grid, a single `text-sm text-muted-foreground` summary strip shows aggregate totals ("5 forms · 20 submissions · 3 new", with "new" in `text-success font-medium`), hidden in the empty state.

Cards suit dashboards under ~50 items where visual scanning and at-a-glance status matter; the list view suits many items or column sorting.

### Help bubble

The floating `?` in the bottom-right of admin pages ([help-bubble.tsx](src/components/help-bubble.tsx)) is a dropdown with four actions in two groups, self-serve docs above the separator and reach-a-human below. **Help with this page** routes to the most relevant `/docs/*` page for the current route via `getHelpHref` in `src/lib/docs-route-map.ts`; **Browse documentation** always routes to the `/docs` index, and when `getHelpHref` falls back to `/docs` the contextual item is hidden so two entries don't point at the same place. Label the docs items for where they actually land: "Get help" implied a human and "Browse" implied an index, but the deep link delivers one specific page.

**Contact support** and **Give feedback** both open `ContactDialog` ([contact-dialog.tsx](src/components/contact-dialog.tsx)), driven by a `kind` prop (`"support" | "feedback"`) that selects title, description, placeholder, and button copy; `null` closes it. Support additionally shows a **Reply to** email input, prefilled from the session (`accountEmail` flows layout → `HelpBubble` → dialog, since the app has no `SessionProvider`) and editable, so a user can route the reply somewhere other than their login address. Feedback has no such field and replies to the account email silently. Both call the `submitContactMessage` server action ([contact.ts](src/actions/contact.ts)), which attaches the current pathname, query, form id, and submission id so messages arrive with context, and sets `replyTo` so replies reach the user rather than the SMTP identity.

The reply address is user-supplied and lands in an SMTP header, so the action re-validates it with `isValidEmail` ([validation.ts](src/lib/validation.ts)) rather than trusting the dialog's shape check; that helper rejects CR/LF, which is what blocks header injection (same reasoning as `submission-email.ts`). When the entered address differs from the authenticated account email, the body carries both as `From:` and `Reply to:` so the reader can see the divergence. Recipients are `SUPPORT_RECIPIENT_EMAIL` (falling back to `FEEDBACK_RECIPIENT_EMAIL`) and `FEEDBACK_RECIPIENT_EMAIL`. Throttled to one submission per user per minute per kind, so feedback doesn't block an urgent support request, and `kind` is re-validated server-side since it crosses the client boundary. The bubble hides on `/docs/*` and auth pages; don't reintroduce it there.

---

## 11. Embed theming

Embedded forms use their own theming system in `embed/src/theme.ts`, unrelated to the admin tokens. Three types:

- **`ThemeDefaults`**: tokens with a default. `DEFAULT_THEME` must provide all of them. Adding one means editing both.
- **`ThemeOverrides`**: optional tokens with no default (`bodyFont`, `titleColor`, `pageBackground`). Adding one needs nothing else.
- **`ThemeTokens`** = `Partial<ThemeDefaults> & ThemeOverrides`, the public type. All fields optional, since a stored theme only holds what the user set.

```typescript
// ThemeDefaults / DEFAULT_THEME
background:      "#ffffff"   // form container      (--canopy-bg)
fieldBackground: "#ffffff"   // inputs              (--canopy-field-bg)
primary:         "#005F6A"   // button bg, focus    (--canopy-primary)
border:          "#e4e4e7"   // input borders       (--canopy-border)
text:            "#18181b"   // labels and body     (--canopy-text)
// Derived, not stored: --canopy-button-text (white or #18181b by WCAG luminance of primary),
// ::placeholder (--canopy-text at 0.5 opacity, CSS only)
```

**Hosted-only tokens** live in `ThemeOverrides`, are read by page wrappers, and are ignored by the embed script:

```typescript
pageBackground?: string                   // falls back to bg-muted/40
cardEnabled?: boolean                     // default true
cardShadow?: "none" | "sm" | "md" | "lg"  // default "md"
contentWidth?: "sm" | "md" | "lg"         // 480/640/768px, default "md"
verticalAlign?: "top" | "center"          // default "top"
```

Extraction is shared through `extractPageTheme()` in `src/lib/page-theme.ts`, used by `hosted-form-page.tsx` and `form-preview.tsx`.

**Post-submission** is a themed success card (`.canopy-success` in `embed/src/styles.ts`) replacing the form: circular checkmark filled with `--canopy-primary`, the configured `successMessage`, and a "Submit another response" button that re-renders the form. The inline status strip above the form is reserved for errors, which use a fixed `#FF6B5A` because the theme has no error token.

**Watermark**: every rendered embed carries a `.canopy-watermark` footer reading "Powered by Canopy Forms (Beta)" plus a `Report an issue` mailto link, with subject and body pre-filled with the form's title and id. Rendered in `render()`, `renderError()`, and `renderInactive()`, skipped in the loading skeleton. Uses `--canopy-primary` and `--canopy-border` to stay theme-aware. The address is a constant (`FEEDBACK_EMAIL` in `embed/src/form.ts`) because the esbuild bundle has no runtime env access.

### Appearance editor

[appearance-section.tsx](src/components/forms/appearance-section.tsx) is an always-open Card with five collapsible SubSection peers, each showing summary chips when collapsed. There is no third nesting tier. Colors sit with the element they affect rather than in a separate color section.

```
Appearance  (always-open Card)
├─ Page        [swatch]                              ← hosted-only
├─ Form        [swatch] [swatch] [swatch] · radius 8 ← surfaces, borders, spacing
├─ Headings    Montserrat · Semibold · [swatch]      ← title + label shared style
├─ Body        Lato · 14px · [swatch]
└─ Button      Submit · [swatch]
```

- **Page**: page background (hosted only). **Form**: background, field background, field border, radius, density, button width and alignment. **Headings**: font, weight, color, label transform, title size. **Body**: font, base size, text color. **Button**: text and color.
- **SubSection titles are neutral `--foreground`, not `text-primary`.** As teal they made children look more important than the "Appearance" card title above them. Hierarchy inside a card comes from size alone: 22px card title, 16px SubSection titles, same color.
- The form title and all field labels share one heading style (`headingFont`, `titleWeight`, `titleColor`). Label transform is label-specific; title size is title-specific, since labels always render at body size.
- Each color control is a native swatch plus a hex input that normalizes to `#rrggbb` on blur.

**Font pickers**: both use `FontPicker` ([font-picker.tsx](src/components/ui/font-picker.tsx)) with different lists. Body uses `variant="body"` (default) showing `CURATED_FONTS`; Headings uses `variant="heading"` showing `CURATED_HEADING_FONTS`. Search filters the full Google Fonts catalogue in both cases; the variant only sets the default list. Previews render each option in its own typeface: opening the picker loads the curated list through `src/lib/load-google-fonts.ts`, which injects one combined `css2` stylesheet, deduplicated per session. The selected font also loads eagerly on mount so the closed trigger renders correctly. Search results don't load fonts, since someone typing a name already knows what it looks like.

---

## 12. Graphics and brand assets

Icons are UI affordances and always come from `lucide-react`. Logos and wordmarks are brand assets, not icons.

**Anything referenced by URL must live in `public/`**: `public/brand/` for logos, wordmarks, and favicons, `public/docs-assets/` for documentation screenshots. Images in `content/` are not served by Next.js unless you load them from the filesystem deliberately.

Render SVG logos from `public/` with a plain `<img src="/brand/…" />` (no SVGR assumptions); use `next/image` for raster formats.

**Avoid spaces in filenames referenced by URL.** Browsers encode them as `%20`, which is easy to get wrong and hard to grep. Keep the spaced original for editing if a design tool produced it, and add a lowercase hyphenated copy in `public/brand/`.

For the app logo plus wordmark, use `BrandMark` ([brand-mark.tsx](src/components/brand-mark.tsx)) with `public/brand/forms-logo-combined.svg`, rather than rebuilding it. It appears in auth card headers and the admin nav header.

Accessibility: decorative images get `alt=""`, meaningful ones get a descriptive `alt`, and color is never the only carrier of meaning.

Favicons use App Router icon files, not manual `<link rel="icon">` tags. `src/app/icon.svg` is the only one present; add `src/app/favicon.ico` beside it if legacy-browser fallback is ever needed.

If dark mode is ever enabled, brand assets must stay legible: prefer logos that work on both grounds or ship variants, and avoid hardcoded background rectangles behind them.
