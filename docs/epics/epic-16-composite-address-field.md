# Epic 16 — Composite Address Field

## Summary

Add a new **ADDRESS** field type that behaves as a single field in the builder but renders as a grouped set of subfields for respondents. This epic also establishes a proper **composite field infrastructure** — improving how composite values (ADDRESS and the existing NAME field) are stored, displayed, and exported.

---

## Goals

* Provide a **standard US address capture experience** that users expect in form tools.
* Keep the builder **clean**: "Address" is added once, not assembled manually from multiple individual fields.
* Store address data in a **structured** way that exports cleanly into separate columns.
* Establish **composite field display and export patterns** that benefit both ADDRESS and NAME.

---

## User Stories

* As a form creator, I can add an **Address** field with one click and it appears as one item in the form editor.
* As a respondent, I can enter my address using familiar, clearly labeled US address fields, with State selectable from a searchable list.
* As a form owner, I can view address responses as a formatted string ("123 Main St, Springfield, IL 62704") in the submission viewer.
* As a form owner, I can export submissions and get **separate columns** for each address component (and each name part) in CSV exports.

---

## Field Composition

Subfields rendered in the embed:

| Subfield | Data key | Input type | Required when field is required |
|----------|----------|------------|-------------------------------|
| Street Address | `line1` | text | Yes |
| Street Address Line 2 | `line2` | text | No (always optional) |
| City | `city` | text | Yes |
| State | `region` | select (50 states + DC + territories) | Yes |
| ZIP Code | `postalCode` | text | Yes |

The address group should be visually coherent, with a single overall label ("Address" or custom) and grouped inputs. All subfields stack vertically (full-width) — no inline row layouts in v1.

### Data key rationale

Use generic keys (`region` not `state`, `postalCode` not `zip`) so that adding international support later is a UI/label change, not a data migration.

### State subfield

* **Embed**: Native `<select>` element with US states/territories (consistent with existing DROPDOWN pattern).
* **Admin UI** (if state appears in any config context): Combobox using the existing Radix Popover pattern from `FontPicker`.

---

## Configuration

* **Required** toggle — applies to the address as a whole (core subfields enforced; line2 always optional).
* **Line 2** toggle — show/hide the second address line. **Defaults to shown.**

That's it for v1. No country mode, no per-subfield customization.

---

## Data Storage

* Address value stored as a **structured object** in `submission.data`, same pattern as NAME:
  ```json
  {
    "address": {
      "line1": "123 Main St",
      "line2": "Apt 4",
      "city": "Springfield",
      "region": "IL",
      "postalCode": "62704"
    }
  }
  ```
* The `Field.options` JSON stores address config (e.g., `{ "showLine2": true }`).

---

## Validation

* **Required field**: All core subfields (line1, city, region, postalCode) must be non-empty. Line2 is never required.
* **Not required, all empty**: Valid — skip entirely.
* **Not required, partially filled**: Require core subfields. This prevents junk partial data (e.g., just a city with no street).
* **ZIP code**: No format validation in v1 (no regex). Just non-empty when required.
* Validation enforced in **three layers** (per existing convention):
  1. HTML attributes on inputs (required, maxlength)
  2. Client-side in embed (`validation.ts`)
  3. Server-side in API route / `public-submit.ts`

---

## Composite Field Infrastructure (NAME + ADDRESS)

This epic also improves how **all composite fields** are displayed and exported. These changes apply to the existing NAME field as well.

### Submission viewer (admin UI)

* Composite field values display as **formatted strings**, not raw JSON:
  * NAME: "John Q. Doe" (joining parts with spaces, middle initial with period)
  * ADDRESS: "123 Main St, Apt 4, Springfield, IL 62704" (comma-separated, line2 omitted if empty)

### CSV export

* Composite fields expand into **separate columns**, one per subfield:
  * NAME with parts `[first, last]` → columns `name_first`, `name_last`
  * ADDRESS → columns `address_line1`, `address_line2`, `address_city`, `address_region`, `address_postalCode`
* Column names follow the pattern `{fieldName}_{subkey}`.

### JSON export

* No change needed — JSON already preserves the structured object.

---

## Non-Goals (v1)

* International / multi-country support (architecture supports it later; not implemented now)
* Address verification or autocomplete
* Geocoding or maps
* ZIP code format validation
* Per-subfield required/optional customization
* Inline row layouts (city/state/zip on one row)

---

## Acceptance Criteria

* A new **ADDRESS** field type is available in the field picker.
* Address appears as one item in the form builder and field list.
* Embed renders a vertically stacked group of address inputs (line1, line2, city, state dropdown, zip) with clear labels.
* State subfield is a `<select>` with US states, DC, and territories.
* Line 2 is toggleable in field config (defaults to shown).
* Required validation works: required → core subfields enforced; not required → all-or-nothing (empty OK, partial requires core fields).
* Submission data stored as structured object and displays as formatted string in submission viewer.
* CSV export produces separate columns for each address subfield (and each name part — retroactive improvement).
* JSON export preserves structured object (no change needed).
* Mobile: all subfields stack full-width, remain readable.

---

## Implementation Notes

* Follow the existing NAME composite field pattern: `FieldType` enum addition, `field-types.ts` registry, `options` JSON for config, pseudo-hidden input in embed, dual-layer validation.
* The US states list should live in a shared constant (used by both embed and potentially admin UI).
* Keep the states list in the embed bundle — it's small (~2KB) and avoids an extra API call.
* Treat the composite field infrastructure (display formatting, CSV expansion) as a shared concern — implement generically so future composite types benefit automatically.
* Read `docs/AGENT_CONTEXT.md` section on "Adding or modifying a field type" for the full checklist.

---

## Future Considerations (not in scope)

* **International mode**: Add a country-mode toggle (US / International). International shows a country dropdown, uses neutral labels ("State/Province/Region", "Postal Code"). Data keys already support this (`region`, `postalCode`).
* **State combobox in embed**: Replace the native `<select>` with a searchable combobox for better UX on desktop. Consider accessibility trade-offs.
* **ZIP code format validation**: US ZIP (5 or 5+4), Canadian postal code, etc. Per-country rules.
