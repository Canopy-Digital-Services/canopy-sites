---
paths:
  - "apps/portal/src/**/*.tsx"
  - "apps/portal/src/app/globals.css"
---

# UI rules

Code paths are relative to `apps/portal/`.

These are the whole rule set for building or changing UI; `docs/UX_PATTERNS.md` holds the detail for each topic by section, and code comments cite it where it applies. Do not introduce alternate UI systems, icon packs, or color patterns.

- `src/components/ui/`: shadcn primitives. Extend, do not fork.
- `src/components/patterns/`: Layout patterns (`page-header`, `data-table`, `settings-section`, `right-panel`, ...). Compose these before writing new layout.

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
28. Letting an editor or settings column span the full screen width. Constrain it (see UX_PATTERNS section 10 for the editor's exact widths). Data tables and multi-column dashboards are the exception.
29. A label, caption, hover tag, or instruction line naming what the user can already see or do. Let visual feedback (the preview's hover outline and marker boxes, a pressed button) carry it.
30. A dropdown for a choice of two to four short options in a settings panel, or loose buttons or a tab strip for any exclusive choice (a setting, a view, a filter). Use `ToggleGroup` (UX_PATTERNS section 6), which shows every option.
31. A product's name, logo, or favicon chosen by route, or hardcoded where the account's product should decide it. Signed-in pages brand by `productFor(entitlements)`, signed-out pages by `getHostProduct()` (UX_PATTERNS section 12).
32. `default`, `outline`, or `ghost` buttons on a `bg-primary` bar. Use `inverse` and `inverse-outline` (UX_PATTERNS section 6, On a filled bar).

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
43. `LocalTime` for a date or time shown without a zone. Never `toLocaleString` or its kin in a page or component without a `timeZone`, and never in an email without a `timeZone`, a locale, and the zone's name in the text (UX_PATTERNS section 10, Dates and times).

**Also never:**

44. Bare `rounded`. It is Tailwind's fixed 4px and ignores `--radius`; use `rounded-md` (any sized class gives the 2px token) or `rounded-full` for a pill.
45. A dialog that asks whether to go ahead titled as anything but that question, ending in "?" ("Delete field?"). A dialog that takes input before it acts is titled as its action, with no "?" (UX_PATTERNS section 7).
46. A filled `destructive` button beside a safer option. The dangerous choice is a `link` with `text-destructive` and the safe one is `default` (UX_PATTERNS section 7, Footer hierarchy).
47. `next/font/google`. Fonts are self-hosted through `next/font/local` (UX_PATTERNS section 4).
48. A pulsing (`animate-pulse`) status dot for any state but Live.
49. The brand gradient (`--canopy-gradient`) as a UI background fill. It is for the logo and decorative swoops.
50. A length limit that blocks typing. Text runs past the limit, the overage shows, and the save or submit waits until it fits (UX_PATTERNS section 8).
51. Enter-to-add, or any add shortcut, while the input is invalid.
52. An App Router icon file (`src/app/**/icon.*`, `favicon.ico`). Favicons come from `productMetadata` (UX_PATTERNS section 12).

**Standard icons:** `GripVertical` drag, `Trash2` delete, `Pencil` edit, `Plus` add, `X` close, `Check` confirm, `AlertCircle` warn. Size `h-4 w-4`.

**Light mode only.** Dark mode variables exist in `globals.css` but were never updated with brand colors. Don't advertise dark mode support; if you add it, re-check brand contrast and every interactive state.
