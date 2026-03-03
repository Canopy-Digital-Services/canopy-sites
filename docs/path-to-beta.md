# Path to Beta

What must be in place before launching and announcing beta.

---

## 1. All field types customized

Every supported field type (TEXT, EMAIL, TEXTAREA, DROPDOWN, CHECKBOX, CHECKBOXES, PHONE, DATE, NAME, NUMBER) should have:

- **Admin**: Config panel and builder behavior that match the type (labels, options, validation, help text).
- **Embed**: Rendered control, validation, and submission payload that match the type.

**Add / Edit field modals** should be well designed:
- Clear type picker when adding (and sensible behavior when editing, e.g. type fixed or clearly locked).
- Layout and grouping that make required vs optional settings obvious; type-specific options (e.g. dropdown options, checkbox choices) easy to scan and edit.
- Labels, placeholders, and help text that guide the user without clutter; validation errors inline and actionable.
- Consistent with `docs/UX_PATTERNS.md` (dialogs, typography, spacing). No cramped or confusing flows.

Audit each type in the field-type registry and embed renderer; fix or complete any that are generic or placeholder. Then audit the add/edit field modal (e.g. `FieldEditorModal` and any type-specific config panels) for layout, clarity, and consistency.

---

## 2. Feedback path

Users need a clear way to send feedback (bugs, feature requests, general comments).

- Add a feedback entry point in the app (e.g. dashboard or footer link).
- Decide where feedback goes: email, form submission to a dedicated form, or external tool (e.g. Canny, Discord). Implement the chosen path and document it.

---

## 3. Integrate CTA path clear and focused

The "integrate" / "get embed code" flow should be obvious and minimal.

- Single, clear path from "form ready" to "copy embed snippet" (or equivalent).
- No dead ends or duplicate flows. Copy-paste instructions and any required settings (e.g. allowed origins) should be in one place.

---

## 4. Help documentation updated

Docs that users see (in-app help, README, or docs site) must reflect current behavior.

- List which docs exist and where they live.
- Update them for: field types, embed setup, allowed origins, notifications, and any beta-specific limits (e.g. form cap). Remove or rewrite anything outdated.

---

## 5. Hosted forms

Users can use Canopy-hosted form pages (shareable URLs) in addition to (or instead of) embedding on their own site.

- Define scope: e.g. one canonical URL per form, optional custom path/slug.
- Implement: public route(s) that render the form (using existing embed or equivalent), same submit pipeline, and any minimal styling/routing rules.
- Document how to get and share the hosted form URL.

---

## 6. Visual styling / brand

Enough polish that the product feels intentional, not prototype-y.

- Apply brand (e.g. Teal/Green/Coral, typography) consistently in admin and in embed themes.
- Ensure key surfaces (dashboard, form builder, embed code page, hosted form page) look coherent and on-brand. No major placeholder or broken layouts.

---

## 7. Usability testing with live users

Validate core flows with real people before calling it beta.

- Define 3–5 concrete tasks (e.g. "Sign up, create a form, add fields, get embed code, submit a test response, see it in the dashboard").
- Run at least one round of testing with a few users; capture where they get stuck or confused.
- Fix critical blockers and obvious confusion points; document known minor issues if not fixed before beta.

---

## 8. Beta form limit and paid tier path

Prevent abuse and set expectations for launch.

- **Limit**: Enforce a maximum of 3 forms per account during beta (config or feature flag). Show clear messaging when at the limit (and optionally when approaching it).
- **Paid tier**: Document or implement the intended path for post-beta paid plans (e.g. higher form limit, remove "beta" cap). No need to ship payment before beta; the path (pricing idea, upgrade entry point) should be defined so launch isn't blocked.

---

## Ordering and dependencies

- **1 (field types)** and **5 (hosted forms)** are product foundations; do early.
- **3 (integrate CTA)** and **4 (help docs)** support first-time setup; complete before or with beta invite.
- **2 (feedback)** and **8 (limits)** are operational; have them in place before announcing.
- **6 (styling)** and **7 (usability testing)** can overlap; run testing after styling is "good enough" so feedback reflects the real experience.
