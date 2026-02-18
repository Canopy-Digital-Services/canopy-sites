# Epic 10: Typography Refactor (Google Fonts Combobox)

## Objective

Refactor the Appearance → Typography configuration to:

* Replace the existing font dropdown and custom font fields
* Support the full Google Fonts library via searchable combobox
* Provide a curated default list for quick selection
* Support both Body and Heading font selection
* Explicitly support "Inherit from host page"
* Centralize font loading logic to prevent duplication or inconsistent behavior

This epic should improve UX, reduce configuration clutter, and establish a clean architecture for typography going forward.

---

## Scope

### 1. Remove Custom Font Support

* Remove "Custom" font option.
* Remove "Font CSS URL" and manual "Custom Font Family" inputs.
* Eliminate any backend logic that accepts arbitrary font URLs.
* Ensure no UI references remain.

Out of scope: self-hosted fonts, Adobe Fonts, or arbitrary external CSS sources.

---

### 2. Introduce a Unified FontPicker Component

Create a reusable FontPicker component used for both:

* Body Font
* Heading Font

Requirements:

* Single combobox field (not separate preset + search inputs).
* Closed state displays selected value.
* Open state shows curated list by default.
* Typing filters against full Google Fonts index.
* Includes explicit "Inherit from host page" option.

This component must:

* Be reusable and source-agnostic.
* Avoid duplicating logic between body and heading implementations.
* Return structured data (not raw CSS strings).

---

### 3. Curated Font List

Provide a curated default list of approximately 22 high-usage Google Fonts for quick access.

The curated list should represent commonly used, production-safe web typography that covers the majority of practical design needs without overwhelming the dropdown.

**Curated Fonts (Initial Set)**

Roboto
Open Sans
Lato
Montserrat
Source Sans 3
Work Sans
Plus Jakarta Sans
Outfit
Poppins
Nunito
Inter

Merriweather
Roboto Serif
DM Serif Text
Playfair Display
Libre Baskerville

Fira Mono
Azeret Mono
JetBrains Mono

Oswald
Raleway

Notes:

* This list intentionally blends high-usage legacy standards (Roboto, Open Sans) with modern UI favorites (Inter, Plus Jakarta Sans, Outfit).
* The list should remain intentionally capped unless there is strong product justification to expand it.
* No visual category tags are required in the UI.

---

### 4. Full Google Fonts Index (Static Dataset)

Maintain a static dataset of Google Fonts families that:

* Is stored in the repo (or generated at build time).
* Includes at minimum: family name.
* May optionally include weights and metadata for future expansion.

Behavior:

* Combobox filters locally from this dataset.
* No per-keystroke external API calls.
* Font CSS is only loaded when a font is selected.

---

### 5. Inherit From Host Page

Add explicit support for "Inherit from host page".

Behavior:

* When selected, no Google Fonts CSS should be injected.
* Embed styles should not override font-family.
* Should be treated as a first-class selection state.

---

### 6. Body + Heading Typography Structure

Refactor appearance state to support explicit separation between Body and Heading fonts.

```
typography: {
  body: FontChoice,
  heading: FontChoice,
  baseSizePx: number
}
```

Where `FontChoice` is structured (not a raw CSS string) and supports:

* mode: 'inherit' | 'google'
* family: string | null

Requirements:

* Body and Heading must each use the same reusable FontPicker component.
* No duplicated state logic between them.
* Both selections must feed into a centralized font-loading system.
* If both Body and Heading use the same family, it must only load once.
* UI should clearly label the two sections as:

  * Body Font
  * Heading Font
* Default behavior:

  * Body defaults to Inherit (or existing default behavior if already defined).
  * Heading defaults to Body selection unless explicitly changed.

Implementation guidance:

* Avoid branching logic scattered across components.
* Avoid separate CSS injection per font role.
* All typography injection must be derived from the single `typography` object.

This ensures a clean separation of semantic roles (body vs headings) without creating fragmented or spaghetti logic.

---

### 7. Centralized Font Loading Logic

Create a single, centralized font-loading mechanism that:

* Accepts both body and heading selections.
* Deduplicates font families.
* Loads only once per unique family.
* Uses display=swap in Google Fonts requests.
* Limits loaded weights to those actually required by the system.

This logic must not be implemented separately inside multiple components.

---

### 8. Visual Rendering in Dropdown

Enhance dropdown list so that:

* Each font name renders using its own typeface when displayed.
* If the font has not yet loaded, fallback gracefully.

This should not block selection if the preview render fails.

---

### 9. Migration Considerations

* Ensure existing forms using default fonts do not break.
* Map any legacy "Custom" selections to closest valid state (likely Inherit or a safe default).
* Verify embed behavior remains stable.

---

## Acceptance Criteria

* Custom font inputs removed.
* Combobox supports curated list + full search.
* "Inherit from host page" works and does not inject CSS.
* Body and Heading fonts configurable independently.
* Fonts load once, deduplicated.
* No spaghetti duplication between body/heading logic.
* No external Google API calls during typing.

---

## Non-Goals

* No live font preview component beyond existing preview pane.
* No support for external font providers.
* No complex font weight configuration UI in this iteration.

---

## Future Extensions (Not in Scope)

* Weight/style picker UI
* Variable font axis controls
* Font pairing suggestions
* Advanced typography controls (line height, letter spacing, etc.)

---

This epic establishes a clean, scalable typography foundation while keeping UX minimal and intentional.
