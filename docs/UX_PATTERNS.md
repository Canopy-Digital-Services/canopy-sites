# UX Patterns

UI conventions for the portal's admin interface (Canopy Forms, and the Canopy Sites chrome around it), plus the embed theming system. Code paths here are relative to `apps/portal/`.

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
20. A preselected default type in a type picker.
21. A hand-converted oklch value for a brand color. Point the token at `var(--canopy-teal)` and friends.
22. A decorative colored accent bar to signal importance (`border-l-4 border-l-primary` and similar).
23. Bounce or rotation in motion. Increase travel distance or duration instead.
24. Bespoke durations or easing curves for enter/leave. Use the four flow tokens.
25. A navigation button whose label describes form state (a Continue button that becomes "No header"). Mark the section `(Optional)` instead.
26. A larger radius to make something friendlier. Radius is not a design lever here.
27. Hardcoded colors (`bg-[#005F6A]`, `style={{color:'#FF6B5A'}}`), hardcoded `green-600` for green text, or a new icon pack.
28. Letting an editor or settings column span the full screen width. Constrain it (see section 10 for the editor's exact widths). Data tables and multi-column dashboards are the exception.
29. A label, caption, hover tag, or instruction line naming what the user can already see or do. Let visual feedback (the preview's hover outline and marker boxes, a pressed button) carry it.
30. A dropdown for a choice of two to four short options in a settings panel, or loose buttons or a tab strip for any exclusive choice (a setting, a view, a filter). Use `ToggleGroup` (section 6), which shows every option.
31. A product's name, logo, or favicon chosen by route, or hardcoded where the account's product should decide it. Signed-in pages brand by `productFor(entitlements)`, signed-out pages by `getHostProduct()` (section 12).
32. `default`, `outline`, or `ghost` buttons on a `bg-primary` bar. Use `inverse` and `inverse-outline` (section 6, On a filled bar).

**Always:**

33. Semantic color tokens from [globals.css](src/app/globals.css): `bg-primary`, `text-destructive`, `text-success`, `text-muted-foreground`.
34. `text-success-strong` for green text and icons. `--success` is a fill and fails contrast as text.
35. `font-heading` on every semantic heading (page, card, section, nav titles, and the row titles of the editor's Fields and Appearance lists, `ROW_TITLE`). Never on body, buttons, labels, table content, or toasts.
36. `noValidate` on admin and auth forms, with the touched/submitted pattern.
37. `Button variant="ghost" size="icon-sm"` for icon-only action buttons.
38. `GripVertical` visible in a sortable row, even when the whole row drags.
39. `PageHeader` for page titles. Never an inline `<h1>`.
40. `PageContent` on admin pages, except the form editor.
41. `aria-describedby={undefined}` on `DialogContent` when you remove its `DialogDescription`.
42. A new flow animation added to the `prefers-reduced-motion` block, shortened to `1ms` rather than removed.
43. `LocalTime` for a date or time shown without a zone. Never `toLocaleString` or its kin in a page or component without a `timeZone`, and never in an email without a `timeZone`, a locale, and the zone's name in the text (section 10, Dates and times).

**Also never:**

44. Bare `rounded`. It is Tailwind's fixed 4px and ignores `--radius`; use `rounded-md` (any sized class gives the 2px token) or `rounded-full` for a pill.
45. A dialog that asks whether to go ahead titled as anything but that question, ending in "?" ("Delete field?"). A dialog that takes input before it acts is titled as its action, with no "?" (section 7).
46. A filled `destructive` button beside a safer option. The dangerous choice is a `link` with `text-destructive` and the safe one is `default` (section 7, Footer hierarchy).
47. `next/font/google`. Fonts are self-hosted through `next/font/local` (section 4).
48. A pulsing (`animate-pulse`) status dot for any state but Live.
49. The brand gradient (`--canopy-gradient`) as a UI background fill. It is for the logo and decorative swoops.
50. A length limit that blocks typing. Text runs past the limit, the overage shows, and the save or submit waits until it fits (section 8).
51. Enter-to-add, or any add shortcut, while the input is invalid.
52. An App Router icon file (`src/app/**/icon.*`, `favicon.ico`). Favicons come from `productMetadata` (section 12).

**Standard icons:** `GripVertical` drag, `Trash2` delete, `Pencil` edit, `Plus` add, `X` close, `Check` confirm, `AlertCircle` warn. Size `h-4 w-4`.

**Light mode only.** Dark mode variables exist in `globals.css` but were never updated with brand colors. Don't advertise dark mode support; if you add it, re-check brand contrast and every interactive state.

---

## 2. Color and surfaces

### Brand colors

The brand hexes (`--canopy-teal`, `--canopy-green`, `--canopy-coral`) are declared once in `:root` in [globals.css](src/app/globals.css). **A semantic token carrying a brand color references the variable** (`--primary: var(--canopy-teal)`), never an oklch conversion of it.

**Why, since this recurred.** These were hand-converted oklch values once, and every one drifted: `--primary` rendered `#004e4e`, a hue visibly off the brand teal, and the drift survived review because both values look like plausible teal.

`--success` and `--destructive` differ from the brand green and coral on purpose: `--success` is a fill whose lightness was tuned by hand, and `--destructive` sets the contrast of every destructive control. Don't point either at a brand variable without checking contrast and confirming it is wanted.

For a lighter or darker shade, derive it (`bg-primary/80`, `color-mix()`) rather than writing a literal.

### Neutrals, radius, elevation

- **Surfaces**: `bg-card` is white and raised (cards, modals, inputs), `bg-background` the off-white page, `bg-muted` sunken (hover wash, wells). `bg-background` is grey, not white.
- **Radius**: `--radius` (2px) for every container and control, which every sized `rounded-*` class resolves to, plus `rounded-full` for badges, avatars, and status dots. Bare `rounded` ignores it (rule 44).
- **Elevation**: `shadow-1` to `shadow-4` by role (rest, lift, float, modal), with Tailwind's size names aliased onto them in globals.css.

### Brand gradient

`var(--canopy-gradient)` runs highlight green (upper-left) to main teal (lower-right), matching the canopy mark (rule 49).

### Status: dot + text vs badge

Prominent, focal status (status cards, detail headers) is a dot plus `text-xs font-medium` text; compact metadata (cards, tables, list rows) is a `Badge`. Live's dot is `bg-success` and pulses, with `text-success-strong` text; every other dot is static (rule 48). Reference: the Live and Draft dots in [publish-content.tsx](src/components/forms/publish-content.tsx).

### Notices

Three tones, matched to severity: **brand** teal (informational), **amber** (incomplete, needs attention), **destructive** coral (something is wrong). Transient operation failures go to `toast.error()` instead.

Notices are **borderless tinted blocks** at the workhorse radius. The tint carries the severity, so no outline, which keeps notices and badges reading as one family.

```tsx
<div className="flex items-start gap-2.5 rounded-lg bg-amber-100 px-3.5 py-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
  <p>Publish your form to enable live submissions.</p>
</div>
```

**The acting banner** is the one full-width notice: an amber strip above the chrome, on every page and the preview page, while a Global Admin acts as a client (PRD D49; `ActingBanner`, [acting-banner.tsx](src/components/acting-banner.tsx)). It names the client and holds Stop. Nothing else takes the top of the page.

---

## 3. Motion

Motion has one job: make it clear content **arrived** or **left**, so a state change doesn't read as a jump cut. Not for delight, emphasis, or personality.

The four flow tokens in [globals.css](src/app/globals.css) (`--ease-flow-in/out`, `--duration-flow-in/out`) time every deliberate transition; from Tailwind, `duration-[var(--duration-flow-in)] ease-[var(--ease-flow-in)]`. Entry rises from below and decelerates; exit accelerates away, faster, because a departing element doesn't need to be read. **Energy comes from distance, not springiness**: when motion feels too subtle, increase travel or duration (the comments on the tokens say why there's no bounce).

| Surface | Behavior |
|---------|----------|
| Editor flow cards | Rise in; exit sideways (left forward, right back) |
| `DialogContent` | Rise in with `slide-in-from-bottom-12`; drop away on close |
| Progressive reveals | `.editor-reveal` grows the container to fit |
| Dropdown menus | Fade and zoom in; close at once, with no exit animation |

`DialogContent` carries this globally. Don't override per dialog.

**Dropdown menus don't animate out** ([dropdown-menu.tsx](src/components/ui/dropdown-menu.tsx)). While a menu faded, its items took focus back from whatever the pick had just focused: on a pointer move over them, and, once the closing menu ignored the pointer, on the pointer leaving them. Adding a field lost its new rename box that way in real Chrome, never in headless tests. A menu that's gone at once has nothing left to take focus. It follows that a menu item acts in its `onSelect`, and anything that has to outlive the pick (a form, a dialog, the state of a request) lives outside the menu: Sign Out's form was cancelled as the menu unmounted, until the item called the action itself. Lint rejects a `<form>` inside a menu.

**Height reveals** use `.editor-reveal`, animating `grid-template-rows` from `0fr` to `1fr` while fading. It needs a single child with `overflow-hidden`. Two constraints: no overshoot on height (a container springing past its target reads as a glitch, so this uses a plain deceleration curve, not `--ease-flow-in`), and `fr` interpolation needs Chrome 117 / Safari 17.4 (older engines snap to the final height, degrading safely).

**Reduced motion** shortens every flow animation to `1ms` rather than removing it, because the editor flow advances on `animationend` and would deadlock if the animations never fired.

---

## 4. Typography

Three families: **Urbanist** headings (`font-heading`), **Inter** body and UI (`font-sans`, the default), **Geist Mono** code (`font-mono`). They are self-hosted variable fonts loaded by `next/font/local` in [layout.tsx](src/app/layout.tsx), files from `npm run fonts:sync`; `next/font/google` (rule 47) fetches at build time, which broke builds.

`font-heading` goes on page titles, section headings, card and modal titles, nav titles, and the row titles of the editor's Fields and Appearance lists (`ROW_TITLE` in [row-title.ts](src/components/forms/row-title.ts); a row title is a heading even though it is the toggle button, and a field row's title is its label). Not on body copy, buttons, labels, inputs, table content, or toast text.

Headings are a **single weight (600)**; hierarchy is carried by size. `PageHeader`, `CardTitle`, `SettingsSection`, `EmptyState`, and the `Markdown` h1/h2/h3 renderers hold the scale: follow them for a new title component rather than picking sizes. Body is `text-sm`; meta, captions, and stats step to `text-xs`; field labels are `font-medium`.

---

## 5. Copy

A title, a labelled button, and a visible control already say what a thing is and does. **A description earns its place only if it states a fact, constraint, or consequence the title and controls don't convey.** Otherwise it's a sentence the user reads and discards on every visit.

**The test: delete it. If nothing is lost, it was noise.**

Failed the test and were removed: "Customize how your form looks" (under "Appearance"), "Click the button below to add your first field" (narrating a button), "Format" (a heading over Full name / Separate parts, which say it).

Passed, and why: "Domains allowed to embed and submit to this form. Localhost is always allowed for development" (a constraint you can't infer), "You'll be signed out of all sessions shortly after" (a consequence), "Leave empty for no limit. Spam submissions are not counted" (non-obvious behavior of a blank value).

**The same goes for labels, tags, and instructions** (rule 29). Add an instruction only once testing shows people get lost without it.

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
| `secondary` | Alternative secondary styling; also the current section in `SitesNav` |
| `link` | Text actions. With `text-destructive`, de-emphasizes a dangerous option beside a safer primary. |
| `inverse`, `inverse-outline` | `default` and `outline` on a `bg-primary` bar (below) |

**Exclusive choices** (a setting such as a width, a view such as chart or table, a filter such as a submission status) use one look: `ToggleGroup` ([toggle-group.tsx](src/components/ui/toggle-group.tsx)), a bordered `bg-card` track whose pressed option gets the soft `secondary` highlight, the same selection color as the current nav section. Every option shows and takes one click. Loose `secondary`/`ghost` buttons read as a second nav bar, and the muted pill track is `Tabs`, which is for navigation.

- **Kept in the URL** (`?view=`, `?range=`, `?status=`): `ToggleLinkGroup` and `ToggleLinkItem`, the same look built from `Link`s with `aria-current` on the active one. They stay links rather than radios, so they render from server components without JS. Reference: [view-toggle.tsx](src/components/forms/view-toggle.tsx).
- **Icon-only items** keep a `Tooltip` (rule 3) and take `className="px-1.5"` to square up. The pressed style reads `aria-checked`, `aria-pressed`, and `aria-current`, never `data-state`: a `TooltipTrigger asChild` round an item replaces its `data-state` with the tooltip's own. Reference: the viewport toggle in [canvas-editor.tsx](src/app/(admin)/(sites)/editor/canvas-editor.tsx).
- A setting with five or more options, or long labels, stays a `Select`. A filter shows every option, since it is read as well as set.

Sizes are in [button.tsx](src/components/ui/button.tsx); `default` is deliberately compact, and action icons in lists take `icon-sm` (rule 37).

**On a filled bar.** On a `bg-primary` surface (as of 2026-11 only the preview bar, [preview-view.tsx](src/app/preview/[siteId]/[[...path]]/preview-view.tsx)) a `default` button disappears into the bar, so the roles turn inside out: `inverse` (white, teal text) is the main action and `inverse-outline` (transparent, white outline and text) the secondary one, Cancel left of the main action as in a dialog footer. Each keeps its own disabled look, a faint white tint with dimmed text: the shared `disabled:opacity-50` turned a white button into a murky teal block. Bare text (`ghost`) doesn't read as a button there.

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

Only when the disabled state has a reason worth showing. Loading and in-flight states need no tooltip. Reference: [publish-content.tsx](src/components/forms/publish-content.tsx) on a form with no fields, or at the `maxPublishedForms` cap.

**On focus, a tooltip opens only when Tab or an arrow key moved focus there.** `TooltipTrigger` in [tooltip.tsx](src/components/ui/tooltip.tsx) goes by the last key pressed, so focus handed back by a list or dialog as it closes (Escape, a pick), or set from code, opens nothing; Radix's own trigger opens on every focus, which named the control the user had just used. Hover is unaffected.

**A trigger may wrap a control that has a popup** (the Appearance toolbar's `Tip` round `FontPicker` and `SizePicker`). React bubbles the portalled popup's events to the trigger, so `TooltipTrigger` in [tooltip.tsx](src/components/ui/tooltip.tsx) drops focus and pointer movement that come from outside its own elements: the tooltip opens for the control, never over its open list, where it would also take the first Escape. The cause is the wrapper, so the guard lives there, not as `stopPropagation` in `SearchSelect` or `Select`. `ColorPicker` needs none: its popover is a sibling of its tooltip, not a child of the trigger.

### Toasts

Toasts are `sonner`'s `toast`, imported directly or through `useToast` ([use-toast.ts](src/hooks/use-toast.ts)); what goes to a toast rather than a notice is in section 2, Notices.

---

## 7. Dialogs

`ConfirmDialog` ([confirm-dialog.tsx](src/components/confirm-dialog.tsx)) covers simple confirm/cancel. Props are on the component; `destructive` switches the confirm button styling.

Rule 45 covers a `ConfirmDialog` and a controlled dialog alike: "Discard changes?", "Remove <name>?", "Delete field?", but "Move <site>" and "Change plan" for dialogs that take input first.

### Footer hierarchy when a safe and a dangerous option compete

```
[ Cancel ]                    Dangerous option    [ Safe option ]
  outline, mr-auto            link +              default variant,
  (isolated left)             text-destructive    rightmost
```

Safe action rightmost with primary weight, at the endpoint of left-to-right scanning. Dangerous action present but light, so choosing it is conscious. Cancel isolated left via `mr-auto`, splitting escape from decisions. Let the layout persuade: no "are you sure?" text. Filled `destructive` is for a single confirm with no competing choice (rule 46).

Apply this whenever a destructive action may affect persisted data. Instead of `ConfirmDialog`, build a controlled dialog (`open`/`onOpenChange`, no trigger) that checks for affected data on mount, falls back to simple confirmation when none exists, and otherwise shows the count with a keep-data and a purge-data option. Reference: [delete-field-dialog.tsx](src/components/delete-field-dialog.tsx).

### Blocking layout dialogs

When a state transition leaves the account somewhere piecemeal admin actions would be incoherent (a plan downgrade that unpublished every form), render a non-dismissible dialog at the admin layout level so every route is intercepted.

- Mount from the admin `layout.tsx` server component on a server-read flag. No client-side gating.
- `Dialog open` hard-coded, no `onOpenChange`, `showCloseButton={false}`.
- Block escape and outside click: `onEscapeKeyDown` and `onPointerDownOutside` both `preventDefault()`.
- Exactly two exits, both resolving the state. No skip.
- Self-contained: all data arrives as props from the layout.

Reference: [plan-resolution-dialog.tsx](src/components/plan/plan-resolution-dialog.tsx), mounted when `Account.requiresPlanResolution`.

### Inline field rows

Fields are added and edited in the Fields list itself, not in a modal: the live preview beside the editor already shows the field. Reference: [field-row.tsx](src/components/forms/field-row.tsx) and [form-fields-manager.tsx](src/components/form-fields-manager.tsx); the types, their order, and their names are in [field-types.ts](src/lib/field-types.ts), and what a field saves, and when it can't, in [field-rules.ts](src/lib/field-rules.ts).

- **Rows.** A row's title is `ROW_TITLE` with the coral marker underline on the open row, as in the Appearance list (section 11); a long label clips with `overflow-x-clip`, since `overflow: hidden` also clips the underline. One row is open at a time. An open row's chevron sits at the foot of its settings, where the user is when a long panel ends, and closing from there steers the scroll to bring the row's summary into view (section 10, Form editor). Settings open and fold with `RowBody` ([row-body.tsx](src/components/forms/row-body.tsx)), not Radix Collapsible, which animated from a height measured as the row opened and snapped a row that grew while open back to it. The grip alone drags, and an open row has no grip.
- **Add field is the list's last row**, dropping down the types with their icons. No type is preselected (rule 20): a default is a path of least resistance to a generic Short answer where Email or Phone would check the answer. Picking one creates the field and opens it with its rename box ready.
- **A field's type is fixed once it's added.** A field of another type is a new field; switching kept almost nothing, behind a "configuration will be lost" confirm. The field actions ignore a type sent on update.
- **New fields start complete** (`newFieldDefaults`): the label is the type's name and a choice field has two options, so nothing blocks the first save. A cleared label saves as the default.
- **A field is renamed where its name is shown** (`InlineRename`, [inline-rename.tsx](src/components/forms/inline-rename.tsx)): the open row's header, and each Name or Address part. There is no Label box in the settings and no "custom label" flag: a label is custom when it differs from the type's name.
- **A type is named for the answer it takes, never the widget.** "Dropdown" lost owners who wanted radio buttons, and "Multiple choice" reads as pick one to some and pick several to others. The type picks how the answer shows: a Choose one is radios for a short list and a dropdown for a long one (`showsAsButtons` in [choices.ts](embed/src/choices.ts)), as GOV.UK does. A web address, a date of birth, and a number are types of their own, not formats of Short answer or Date, so each gets its own keyboard, autofill, and checks. A yes or no question is a Choose one with the owner's two options, not another entry in the list.
- **Nothing starts answered.** No default choice (it nudges visitors toward it), and an Approval never starts checked.
- **Settings add content and rules, never presentation, and only what owners ask for.** Email takes any address, stored as typed and trimmed: allowed domains checked only spelling, a work-only choice turned away the small businesses that run on a personal address, and a lowercase choice was about using the data, not asking for it. Short answer has no formats; each was another type in disguise. Date takes Past, Future, or Any date, with no fixed range (a fixed set of dates is a Choose one).
- **Name and Address are parts**, each ticked, renamed, and required on its own (`PartRow`, [part-row.tsx](src/components/field-config/part-row.tsx)), with no field-level Required beside them: one control for one decision. On the form the field's label sits over short part labels ("First", "Last"), never "First Name" under "Name". A Middle is a name or an initial, one `ToggleGroup`, not two checkboxes acting as radios. A free-text address is a Paragraph, not a kind of Address.
- **No headings inside a field's settings** ("Input Rules", "Format"). A choice whose options say what it decides carries only an `aria-label`, and the settings run as one list (Required field, the type's own, Help text) with no divider.
- **Visitors get GOV.UK's patterns and wording**: hints between the label and the box, errors that name what's wrong with an example the field takes ("must be a whole number, like 10", "must be today or in the future"), a character count that never blocks typing (rule 50), and required messages that don't repeat the label ("Choose an answer."). The boxes follow section 8: hints, not placeholders, and `inputmode`, never `type="number"`, `"email"`, or `"url"`.
- **Autosave**: 600ms after the last change, and at once when the row closes or the step changes. A field that can't save yet (two options a visitor couldn't tell apart, a Name with no parts) holds its last saved state and says why under its type's settings (`fieldProblem`); a blank option doesn't hold it, and is dropped when the row closes. The field server actions store through the same `savedField`, so a field reads the same whatever sent it.
- **The open field is the preview's focus** (`field:<name>`, narrowed to `field:<name>#<part>` while a label or option is being edited), found by the `data-field-name` and `data-field-part` attributes the embed puts on its markup. An embed markup change keeps them.

---

## 8. Form inputs and validation

### Inputs

Standard shadcn `Input`, `Label`, `Textarea`, `Select`. Spacing: `space-y-2` for a label + input pair, `space-y-4` between sections, `gap-2`/`gap-3` inline.

**A list too long to scan**: `SearchSelect` ([search-select.tsx](src/components/ui/search-select.tsx)), a trigger showing the choice and a popover with a search box over the list. Options carry a `label` and an optional muted `detail`, and search matches both, so a zone is found by its city or by "Pacific Time". Name the trigger with `aria-labelledby` pointing at the heading it sits under rather than a second visible label. It saves on choose where the setting stands alone (the Account page's Time zone); `Select` stays the choice for a list short enough to read. The list opens scrolled to the choice, set from a callback ref on the list (an effect on `open` runs before the popover's content mounts, and finds no list), and typing scrolls back to the top, where the first match is, the one Enter takes. The arrow keys move through the options, and none is a tab stop. A picker of this shape is built on it, as `FontPicker` (section 11) is, not copied.

**File inputs**: `Input type="file"` with `accept`, its constraints in help text below ("MP4, up to 100 MB."). A chosen file is checked as it is chosen (its first bytes, its size), which is this control's blur, and a missing one on submit; the server repeats every check. An upload long enough to wait for goes by `XMLHttpRequest`, since `fetch` reports no progress on what it sends, and the progress is the button's label ("Uploading 43%") with the inputs disabled. Reference: [welcome-video-card.tsx](src/app/operator/sites/[siteId]/welcome-video-card.tsx).

**Checkbox**: `onCheckedChange` receives `boolean | "indeterminate"`, so narrow with `checked === true`. Pair with a `Label` sharing `id`/`htmlFor`, plus `cursor-pointer` and `font-normal` to distinguish it from a field label.

**Dependent options**: when a checkbox only makes sense while its parent is on, render it inside the parent's conditional block rather than disabling it, and align hint text under the label with `ml-6` (checkbox width plus gap) so the hint belongs to that option, not the group. Reference: "Include responses in the email" in [after-submission-section.tsx](src/components/forms/after-submission-section.tsx).

**Form fields: hints, not placeholders.** A field's hints and examples go in its help text, which the embed places as GOV.UK places hints: between the label and the box, so it's read before answering (under the group's label for Name, Address, and a choice's options, between a Full name's label and its box, and under an Approval's checkbox line). It stays on screen while the visitor types and is read with the field (`aria-describedby` on its box, or on the group of its parts or options, with the error). A placeholder vanishes as typing starts, reads as an answer already given or else fails contrast (the embed draws it in the theme's text at half opacity), and invites the owner to repeat the label. Fields have no Placeholder setting; the only placeholder a visitor sees is "Please specify..." in an Other box.

**Mobile keyboards follow the answer.** A box that takes only numbers asks for the phone's number pad (`inputmode="numeric"`, as a Date of birth's boxes do; `"decimal"` for a Decimal Number; `type="tel"` for Phone), and ZIP gets the pad too. The exception is a box that takes numbers below zero (a Number field with a negative minimum, a Number field's own bounds in its settings): iPhone pads have no minus key, so those keep the full keyboard's numbers. Email asks for the @ keyboard (`inputmode="email"`), and Website for the web keyboard, with its / and .com (`inputmode="url"`). All of these are text boxes asking for a keyboard, never `type="number"`, `"email"`, or `"url"`: a number box changes under a scroll wheel, drops leading zeros (an order number keeps them), and pops up its own range message before ours, and `type="url"` refuses an address without https://. Password boxes are `type="password"` with `current-password` or `new-password`, and shown as text they still don't capitalize or correct (`PasswordInput`). No attribute asks for a keyboard's number row: Android keyboards add one to password boxes themselves, and iPhone's have none.

**Autofill on live forms only.** Email, Phone, and each Name, Address, and Date of birth part carry the HTML autofill token for what they collect (`email`, `tel`, `NAME_AUTOFILL`, `ADDRESS_AUTOFILL`, and `DATE_OF_BIRTH_PARTS` in [form.ts](embed/src/form.ts)), so a visitor's browser or password manager can fill them. A middle initial has none: the token means a whole middle name, which its two-letter box would cut short. Other types collect what the owner defines and get none. The admin previews (`preview: true`) turn autofill off on the form and every control: the builder isn't where the owner's own name and address go.

**Help text** in the admin UI: `text-xs text-muted-foreground` directly below an input or group; `text-sm text-muted-foreground` for page and section level description. A hint covering a group goes below the group, not repeated under each input.

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

**Keyboard shortcuts** (Enter to add an item) are off while the input is invalid (rule 51), so users can't compound errors.

**A length limit with a count doesn't block typing** (rule 50), so new wording can be typed first and the old cut after; a silent block felt like a broken field. On the canvas, the characters past the limit turn red in the field itself (a CSS custom highlight from the bridge, `markOver` in [canvas-bridge.ts](src/lib/canvas-bridge.ts)), since a message in the panel alone sat too far from the cursor to be noticed. The field panel shows "187 of 205 characters" once the text is within 20 of the limit, and that line becomes "12 characters too many" in `text-destructive` once over, with Done off until it fits (a Paragraph's count, GOV.UK's, is the embed's version: `addCharacterCount` in [form.ts](embed/src/form.ts)). Reference: `FieldPanel` in [canvas-editor.tsx](src/app/(admin)/(sites)/editor/canvas-editor.tsx).

Reference: [signup](src/app/(auth)/signup/page.tsx), [login](src/app/(auth)/login/page.tsx), [reset-password](src/app/(auth)/reset-password/page.tsx), [forgot-password](src/app/(auth)/forgot-password/page.tsx).

### The two dialects

| Context | Approach |
|---------|----------|
| Auth pages and admin UI | Custom inline validation, touched/submitted, `noValidate` |
| Embed forms (public) | HTML5 native popups via `setCustomValidity()` |

The split is deliberate: the admin UI is an environment we fully control, and configuration errors often need several visible at once with context intact. The embed is injected into third-party sites, where native popups are lightweight, consistent, and bring their own focus handling and announcements.

Embed specifics, in `embed/src/form.ts` (the popups) and `embed/src/validation.ts` (the rules, which the server runs too; `docs/AGENT_CONTEXT.md` section 2):

- **One error at a time.** Popup on the first invalid field, focus it, user resubmits for the next. The status strip shows the total: "Please fix N field(s) to continue." The editor's preview runs the same checks on Submit and stops before sending.
- Validation clears on typing: `input.addEventListener("input", () => input.setCustomValidity(""))`.
- Messages are always `validateField`'s fixed text, in form order: the form is `novalidate`, so the browser's own checks, which speak in their own words and out of order, never stop a submit first. A Date keeps `min`/`max` for its picker's greyed-out days. Email, Number, and Website boxes follow Mobile keyboards above.
- `.canopy-error` inline text is visually hidden but kept in the DOM for assistive tech; popups are the visible channel.
- Per type: NAME and ADDRESS show the popup on the part that fails (required and empty, or longer than its cap), otherwise on the first part (an Address on its ZIP, whose format is the only other part check); a Choose one's "Other" box clears on typing; Choose several requires at least one checked when required, and only the field's options, each once; NUMBER validates numeric input, optional integer-only, and min/max on both sides.
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

Variant depends on whether the list is the primary thing in its container:

- **The list is the container's content** (Add field in the Fields list, Add option in a choice field's options): a full-width last row, `text-primary`, Plus icon and text, in line with the rows above it. References: `AddFieldRow` in [field-row.tsx](src/components/forms/field-row.tsx), [choice-options-editor.tsx](src/components/field-config/choice-options-editor.tsx).
- **The list sits among other inputs** (a list of hostnames in a settings form): `Button variant="ghost" size="sm"` with `-ml-3 text-primary hover:text-primary hover:bg-primary/10`. The `-ml-3` cancels the button's `px-3`, so the icon lines up with the labels above while the hover area keeps its padding, and `hover:text-primary` stops ghost turning the text to foreground. Reference: [list-input.tsx](src/app/operator/sites/list-input.tsx).

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

`PageContent` ([page-content.tsx](src/components/patterns/page-content.tsx)) pads and centers admin pages, with `wide` for wide tables. **Don't wrap the form editor in it**: `FormWorkspace` fills its parent with `h-full`, and its header slot mirrors `PageContent`'s padding so headers align across pages.

`PageHeader` ([page-header.tsx](src/components/patterns/page-header.tsx)): prefer its `backHref` (an ArrowLeft before the title) over a "Back to X" action button.

`TopNavLayout` ([top-nav-layout.tsx](src/components/patterns/top-nav-layout.tsx)) is the admin and operator chrome: a bar from `md` up, and below it a hamburger opening a Sheet with the logo, nav, and user menu. The `logo` slot renders in **both** places, so anything in it appears in both with no mobile handling. Sites accounts get `SitesNav` ([sites-nav.tsx](src/components/sites/sites-nav.tsx)) as its nav items, the current section `variant="secondary"` with `aria-current="page"` (the same soft highlight as a pressed `ToggleGroup` option); Forms-only accounts get none. Sites accounts also get `DraftStatus` ([draft-status.tsx](src/components/sites/draft-status.tsx)) at the start of the user menu slot: the draft's state as dot plus text, Discard behind `ConfirmDialog`, and Preview, which opens the preview page in a new tab, the only place to publish (PRD D47). Anything that changes the draft calls `announceDraft("changed")` so the chrome catches up at once, and `announceDraft("published")` after a publish or discard.

**Asking Canopy (PRD D34).** A request Quick Edit drafts shows as `HelpRequestCard` ([help-request-card.tsx](src/components/sites/help-request-card.tsx)) under the reply that offered it, in Quick Edit's chat and the canvas popover alike: the owner's words, a primary send button and a ghost Not now, then dot plus text once sent. What was sent, and the operator's `/operator/requests`, list each request with dot plus status.

`UserMenu` ([user-menu.tsx](src/components/patterns/user-menu.tsx)) is the initials circle at the end of the bar (initials from the person's name, else the email: `getInitials`), with no visible email. Its menu holds the email, Operator Console for a Global Admin, Manage Account, and Sign Out.

### Form editor

`FormWorkspace` ([form-workspace.tsx](src/components/forms/form-workspace.tsx)) is the single surface for one form, its Editor, Publish, and Submissions tabs read from the `mode` search param, not local state, so a tab is linkable and survives reload.

Layout: on `lg+` the Editor tab is a 520px editor column beside a 768px preview, the width of a Wide hosted form, so every content width previews at its real size. Neither column may be `shrink-0`: the pair is centered, and a centered row wider than the window spills off its left edge, where it can't be scrolled to. The editor column's `overflow-x-hidden` is what contains the flow cards' sideways exit. Below `lg` the preview hides behind a right-edge handle opening a sheet. The preview's mode follows `form.type` (`HOSTED` page, `EMBEDDED` embed) and is never a user toggle.

**What you click doesn't move.** Collapsing something near the bottom of the editor column would pull its scroll back and slide the panel under the pointer; `useScrollHold` ([use-scroll-hold.ts](src/hooks/use-scroll-hold.ts)) holds it still, and a fold closed from where the pointer is steers the scroll instead (the hook's comments say how). A new step, or opening appearance mode, starts at the column's top.

`EditorFlow` ([editor-flow.tsx](src/components/forms/editor-flow.tsx)) shows the editor's sections **one at a time**: Header, Fields, Submission Settings, whose forward button goes to Publish. A stack of cards presented its full complexity before the first decision. Appearance is not a step (see Appearance mode below).

- Section cards render with `variant="flow"` (always expanded, no chevron); nothing renders their `accordion` default.
- **Advancing is animation-driven**: the forward button sets an exit direction and the step index increments on `animationend`. The handler must check `event.target === event.currentTarget` and match the animation name, because child animations bubble.
- **The buttons name where they go** (`STEP_TITLES` in [editor-steps.ts](src/components/forms/editor-steps.ts), which the cards' titles read too). A bare Continue under the Fields list read as "done with this field". Header's forward button says Fields whether or not it's filled (rule 25), and no "All set" card stands between the last step and Publish.
- **Fields' forward button is disabled until the form has a field**, since a form can't be published without one (`docs/AGENT_CONTEXT.md` section 2, Data model). It carries no tooltip: the empty Fields list is the reason.

**Live preview stand-ins.** `FormPreview` fills an empty header and an empty field list with stand-ins (`HEADER_PLACEHOLDERS`, `FIELD_PLACEHOLDERS`) by the flow's step (`editorStep` in `FormContext`), so the user always edits something visible. Stand-ins are never saved, so they must not look saved: `.preview-placeholder` and `.preview-placeholder-field` in `globals.css` fade them.

**Focus mark.** Focusing a Header input or opening a field row sets `previewFocus`, and `PreviewMark` ([preview-mark.tsx](src/components/forms/preview-mark.tsx)) draws a coral marker box round the matching preview element with the canopyds.com marker brush ([marker-brush.ts](src/lib/marker-brush.ts)), by hand when the focus changes and finished on every redraw after. The canvases sit in the preview surface on top of the form, as ink on the page, so crossing a field's edge is expected: drawn under the content a box vanished behind inputs' backgrounds, and inside the card its `overflow: hidden` clipped it. Thumbnail capture filters them out (`data-preview-mark`).

**The preview shows what's marked.** When the focus changes, the preview scrolls the least it can to show the marked element whole (`useBringIntoView`, [use-bring-into-view.ts](src/hooks/use-bring-into-view.ts)). Only a change of focus moves it, so a preview the user scrolled away from the open field stays put while they type.

**Appearance mode.** Appearance applies to the whole form at any time, so it isn't a flow step. **Change appearance** in the preview's top bar toggles `appearanceMode` in `FormContext`, and the appearance panel (section 11) replaces the flow, which stays mounted under it so **Done** returns to the same step. **Cancel** does the same and puts back the theme the panel opened with, as one step of the panel's undo history.

- **Hover outlines; selection marks.** Hovering the preview outlines the one element under the pointer (`PreviewOutline`, [preview-outline.tsx](src/components/forms/preview-outline.tsx)), as the browser's inspector does; hovering a panel row outlines everything its group styles. Clicking a part, or opening its row, draws marker boxes round everything that group styles. Everything a row marks must render from that row's settings, never a hard-coded color or opacity the row can't reach.
- Clicks never reach the form: capture handlers stop focus, typing, dropdowns, and links (`.preview-appearance` in `globals.css`).
- `ZONES` (what a click picks) and `groupTargets` (what a group marks and outlines) in [form-preview.tsx](src/components/forms/form-preview.tsx) follow the embed's class names, so an embed markup change must keep them matching.

Known gaps, deliberate and pending further disclosure work: the flow always starts at Header even when editing an existing form, progress dots aren't clickable, and there's no per-card disclosure.

**Saving.** `FormContext` ([form-context.tsx](src/components/forms/form-context.tsx)) autosaves each group of settings on a debounce (`SaveGroup`); fields save themselves ([form-fields-manager.tsx](src/components/form-fields-manager.tsx)) and report through `trackSave`. Every editor card shows `saveStatus` at the right of its header with `SaveIndicator` ([save-indicator.tsx](src/components/forms/save-indicator.tsx)); a part of the editor that saves on its own feeds that, never a status line of its own.

`FormPreview` ([form-preview.tsx](src/components/forms/form-preview.tsx)) and the hosted page both draw the form with the embed's own `renderFromDefinition`, never a React copy of it, so the preview can't drift from what visitors get.

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

Filters use title-case labels with uppercase enum values as params, in a `ToggleLinkGroup` (section 6).

Empty states: a plain `text-sm text-muted-foreground` line suffices inline; use `EmptyState` ([empty-state.tsx](src/components/patterns/empty-state.tsx)) with `icon`, `title`, `description`, `action` for prominent ones. This is the one place an orienting sentence is welcome (section 5).

### Dates and times

A time with no zone beside it means the viewer's own clock, and only the browser knows that zone. `LocalTime` ([local-time.tsx](src/components/local-time.tsx)) writes it there, from a server or a client component: `<LocalTime value={row.createdAt} />`, with `format="date"` for the day alone.

Never format one in a page or component with `toLocaleString`, `toLocaleDateString`, or a date's `get*` parts unless it names a `timeZone`. The server's zone is UTC, a client component renders there first, and React keeps the server's text through hydration: `suppressHydrationWarning` hides the mismatch and fixes nothing.

Name a zone where the reader's clock isn't the one that matters, or where there is no browser: the operator's pages about a site and every email use the account's zone (`Account.timeZone`), as a site's own dates do (quick edit's "today", the nightly rebuild).

A time of day in an email has its zone's abbreviation beside it ("Nov 12, 2026, 4:20 PM PST"), since the reader takes a bare one for their own clock. The submission notification writes it in the account's zone (`formatSubmittedAt` in [submission-email.ts](src/lib/submission-email.ts)). Pass the locale (`"en-US"`) as well as the `timeZone`: with neither, the text follows whatever the container is set to.

### Emails to a person

An email that asks one person to do one thing (claim, reset a password) is the card in [email-card.ts](src/lib/email-card.ts): an optional picture, a teal heading, a line, one button, and a grey note. The button's link is never printed under it; the plain-text part carries it. What an email says is said the same way wherever its link shows: the claim's headline and button are `claimWords` ([claim.ts](src/lib/claim.ts)), read by the email, the link's preview in a messaging app, and the claim page.

### Type chooser

For a creation flow that needs a commitment to one of two mutually exclusive modes shaping everything downstream (form type at `/forms/new`). Two side-by-side cards as a radio group, each with a subdued icon, one-line title, one-line description. Not for binary toggles inside an existing object; use a Switch or Tabs there.

Cards render as `<button type="button" role="radio" aria-checked>` so they're keyboard and screen-reader accessible with no visible radio circle. Selected gets `border-primary`, a faint `ring-1 ring-primary`, the icon shifting `text-muted-foreground/60` to `text-primary`, and a small primary check chip top-right. Submit stays disabled until the chooser and any sibling required inputs have values; the disabled button is the affordance, with no inline error. Reference: [new-form-form.tsx](src/app/(admin)/forms/new/new-form-form.tsx).

### Dashboard cards and view toggle

The forms landing page defaults to a card grid with a toggle to a compact list.

**View toggle** ([view-toggle.tsx](src/components/forms/view-toggle.tsx)): a `ToggleLinkGroup` (section 6) of `LayoutGrid` and `List`, state in `?view=grid|list`, defaulting to grid.

**Cards** ([form-card.tsx](src/components/forms/form-card.tsx)): a thumbnail linked to the editor, a name row, and a meta row with the published/draft Badge beside the counts. Thumbnails are captured from the preview panel by `useThumbnailCapture` when the editor opens and after each save, with the preview's web fonts inlined (`thumbnailFontCss`), since the capture is an image and can't reach the page's fonts. `GET /api/forms/[formId]/thumbnail` serves them with `no-cache` and a content-hash ETag: the URL never changes, so a max-age would show a stale image.

Cards suit dashboards under ~50 items where visual scanning and at-a-glance status matter; the list view suits many items or column sorting.

### Help bubble

The floating `?` in the bottom-right of admin pages ([help-bubble.tsx](src/components/help-bubble.tsx)) is a dropdown with four actions in two groups, self-serve docs above the separator and reach-a-human below. **Help with this page** routes to the most relevant `/docs/*` page for the current route via `getHelpHref` in `src/lib/docs-route-map.ts`; **Browse documentation** always routes to the `/docs` index, and when `getHelpHref` falls back to `/docs` the contextual item is hidden so two entries don't point at the same place. On the pages of a Sites tab that has a welcome video (ROADMAP E39), **Welcome video** is the first item: it opens `WelcomeVideoDialog` ([welcome-video-dialog.tsx](src/components/welcome-video-dialog.tsx)) on that tab's video, the browser's own player, which never autoplays. Its captions show in a strip under the picture, so they never cover what the video is showing: the track stays `showing`, so the player's captions menu and full screen work as usual, and `.welcome-video` in globals.css hides the browser's drawing of it everywhere but full screen. The strip keeps two lines' height (three on a phone) between captions so the dialog holds still. The bubble also opens that dialog by itself once per person and tab, on their first visit to the tab (the admin layout passes each video's `open`), the pages where the bubble hides included. The dialog ignores a click outside it, because a stray tap would spend its one automatic showing; the close button and Escape close it. Label the docs items for where they actually land: the contextual item delivers one specific page, not a human or an index.

**Contact support** and **Give feedback** both open `ContactDialog` ([contact-dialog.tsx](src/components/contact-dialog.tsx)), its copy chosen by `kind`. Support adds an editable **Reply to** address, prefilled with the account email, which reaches the dialog as a prop from the layout because the app has no `SessionProvider`; feedback replies to the account email. What the server action checks and sends is in its comment ([contact.ts](src/actions/contact.ts)). The bubble hides on `/docs/*` and auth pages; don't reintroduce it there.

---

## 11. Embed theming

Embedded and hosted forms theme from [theme.ts](embed/src/theme.ts), unrelated to the admin tokens. Its comments say what adding a token takes; `DEFAULT_THEME` holds the defaults. A stored theme holds only what the owner set, so every token is optional to its readers.

**Title and labels are separate token sets** (font, weight, color, size; alignment for the title), each driving its own `--canopy-title-*` or `--canopy-label-*` variable. Neither has a case setting: text in capitals is typed in capitals. Sizes are pixels. A legacy form of a token (a size key, `headingFont`) is still read because `data-theme` attributes on customers' sites may carry it; don't drop that reading.

**Hosted-only tokens** (`pageBackground`, `cardEnabled`, `cardShadow`, `contentWidth`) are read by the hosted page and `FormPreview` through `extractPageTheme()` ([page-theme.ts](src/lib/page-theme.ts)) and ignored by the embed script.

**Post-submission** is a themed success card (`.canopy-success`) in the form's place, with a button that re-renders the form. The status strip above the form is for errors only, in a fixed coral, because the theme has no error token.

**Watermark**: every rendered embed (the form, its error, and its inactive state; not the loading skeleton) ends with the `.canopy-watermark` footer and its "Report an issue" link, which stays last: the thank-you card goes in above it. The address is a constant (`FEEDBACK_EMAIL` in [form.ts](embed/src/form.ts)) because the esbuild bundle has no runtime env access.

**Font loading**: the embed and the font picker both load fonts from `/api/fonts?family=...` ([font-css.ts](src/lib/font-css.ts)): self-hosted families as `@font-face` rules on `/fonts/*`, any other through Google Fonts, so the full picker catalogue works while the curated fonts never touch Google. `/fonts/*` carries `Access-Control-Allow-Origin: *` (next.config.ts) because embeds load them cross-origin.

### Appearance panel

[appearance-panel.tsx](src/components/forms/appearance-panel.tsx) is the appearance-mode panel (section 10): one list built like the Fields list, one row open at a time. A row is a part of the form, not a kind of setting, so clicking the preview and reading the list name the same things. Rows run from the page inward (Page, Form), then the type from most to least prominent (Title, Labels, Text), then Fields and Button: the list reads as a hierarchy, not a map. A row title is a section heading (`ROW_TITLE`, [row-title.ts](src/components/forms/row-title.ts), shared with the Fields list); at `font-medium text-sm` the rows didn't read as places to go. The open row's controls are `bg-card` so they stand off the row's tint.

- **Each setting lives in exactly one row.** A setting shared by two rows reads as one change in one place silently changing another. Corner radius rounds the card, inputs, and button together, so it belongs to Form, which is all three.
- **One setting per line** (`SettingRow`): label on the left, control on the right, as in a design tool's inspector, for Page, Form, Fields, and Button. Settings run from the biggest visual effect to the smallest.
- **Type settings are a toolbar**: Title's font, color, size, bold, and alignment on one unlabeled line (Labels and Text take fewer), as in a word processor, since people know these controls from Word and a label column only restated them. Size is a short dropdown of pixel sizes with no free entry, weight a single Bold toggle, and each control names itself in a tooltip after a dwell, so sweeping the pointer across doesn't flash a run of them.
- **Content width previews in proportion.** The pane is narrower than the Medium and Wide content widths, so at their real widths they rendered identically; `FormPreview` sizes a hosted form's content as a share of the pane instead.
- **Presets over numbers.** Form's corners are named presets, not a pixel box: owners judge corners by eye. A saved value between presets presses no button and is kept until changed.
- **One decision, one control.** A checkbox that reveals a dependent control is folded into one choice: Page's Card is No card, Flat, or a shadow strength, written to `cardEnabled` and `cardShadow` together, and Button's Width is Full or as wide as its text at the left, center, or right. A color is an unlabeled swatch beside the thing it colors (a font, the button's text). Button's text color, once picked, holds whatever the button color, with no contrast warning: the preview shows the result, and warning copy is the labeling this panel avoids.
- **A color opens our own picker** (`ColorPicker`, [color-picker.tsx](src/components/ui/color-picker.tsx)): the colors the owner has set anywhere in the form, each once and named by what uses it, then New color for the system picker (every platform's takes hex, so there's no hex box). With nothing set yet it opens the system picker directly. Defaults and a stock palette aren't offered (a new form's defaults are Canopy's own colors, of no use to anyone else), nor black and white (text is near-black already, and pure white is a choice to make on purpose). An unset title or label color shows as the text color it renders with. Nothing offers a way back to a default.
- **Undo and Redo, as a word processor's**: buttons at the right of the card's header, and the usual shortcuts anywhere but a text box, which keeps its own undo. `FormContext` keeps whole saved themes, not edits (`undoTheme`, `redoTheme`), for the page load, merging changes to the same settings within a second into one step (a color dragged across the system picker sends one per frame). An undo back to the saved theme inside the save debounce cancels the pending save rather than letting it write the theme it undid.

**Font pickers**: `FontPicker` ([font-picker.tsx](src/components/ui/font-picker.tsx)) is a `SearchSelect` of fonts (section 8): a curated list per variant (body for Text, heading for Title and Labels), with search across the full Google Fonts catalogue. Opening it loads the curated list's typefaces for the previews; search results don't load fonts, since someone typing a name already knows what it looks like. An unset font is named by what it renders in (`unsetFont`), never "Default"; only an embedded form's unset text font, which is the host page's, reads "Inherit from host page".

---

## 12. Graphics and brand assets

Icons are UI affordances and always come from `lucide-react`. Logos and wordmarks are brand assets, not icons.

**Anything referenced by URL must live in `public/`**, with logos, wordmarks, and favicons in `public/brand/`. `content/` is not served, so an image a help page shows goes in `public/` too.

Render SVG logos from `public/` with a plain `<img src="/brand/…" />` (no SVGR assumptions); use `next/image` for raster formats.

**Avoid spaces in filenames referenced by URL.** Browsers encode them as `%20`, which is easy to get wrong and hard to grep. Keep the spaced original for editing if a design tool produced it, and add a lowercase hyphenated copy in `public/brand/`.

For the app logo plus wordmark, use `BrandMark` ([brand-mark.tsx](src/components/brand-mark.tsx)) rather than rebuilding it. It renders `public/brand/<product>-logo-combined.svg` and appears in the admin nav header, where `product` follows the account (see `docs/AGENT_CONTEXT.md` section 2). Auth card headers use `AuthBrandMark` ([auth-brand-mark.tsx](src/components/auth-brand-mark.tsx)), which brands by hostname; on login it renders the larger `<product>-logo-full.svg`. Every product has the same set of files with identical layouts, so a new product gets that set, not a code branch.

Accessibility: decorative images get `alt=""`, meaningful ones get a descriptive `alt`, and color is never the only carrier of meaning.

Favicons are `public/brand/<product>-icon.svg`, set by `productMetadata` in [product.ts](src/lib/product.ts) so every layout that brands its title brands its icon too. An App Router icon file (rule 52) brands by route, so a Sites account on `/forms` got the Forms icon, and it overrides the metadata icon.

If dark mode is ever enabled, brand assets must stay legible: prefer logos that work on both grounds or ship variants, and avoid hardcoded background rectangles behind them.
