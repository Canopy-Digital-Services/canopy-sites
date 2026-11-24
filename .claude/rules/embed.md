---
paths:
  - "apps/portal/embed/**"
  - "apps/portal/public/embed.js"
  - "apps/portal/src/lib/field-types.ts"
  - "apps/portal/src/lib/field-rules.ts"
  - "apps/portal/src/lib/public-submit.ts"
  - "apps/portal/src/components/field-config/**"
  - "apps/portal/src/components/forms/**"
---

# The embed, validation, and field types

Code paths are relative to `apps/portal/`.

- `embed/src/*`: Source of truth for the embed. **Never edit `public/embed.js` by hand.**
- `src/lib/field-types.ts`: Field type registry. The `Record<FieldType, string>` map fails the build if a type is missing.

## Validation

Three layers, all required:

1. HTML `maxLength` on inputs, from `MAX_LENGTHS`.
2. Per-field rules, written once in `validateField` (`embed/src/validation.ts`): the embed runs them before it submits, and `src/lib/public-submit.ts` runs the same function on every submission. A type's rules and length caps go there, never in `public-submit.ts` or a route file.
3. Server-only guardrails in `src/lib/public-submit.ts`, shared by the embed and submit routes: the 64KB payload cap, the gate order (`.claude/rules/public-api.md`), and the body's keys. The body must be a JSON object whose every key is a field's name or `form.honeypotField`; any other key is a 400 with the key in `fields`, beside the fields' own errors. It stores only the fields' answers (never the honeypot, which is read from the body first), rewritten as checked: an email trimmed, a phone's number as E.164.

Every answer has one shape, so no part of a submission can carry more than its cap: one string (Number a number too), an Approval `true`, `false`, or `"on"` (what a checked HTML checkbox sends), Choose several a list of strings naming each option once, and a Name, Address or Phone an object of only the field's parts, each a string (a Phone's are its number and, when it asks for one, its extension). A new type gets a shape and a cap in `validateField`, or anything up to 64KB gets stored through it.

Length caps (`MAX_LENGTHS` beside `validateField`): every type that takes one piece of text is held to its cap whatever the field stores. The one length setting is a Paragraph's character limit (`characterLimit`), taken only as a whole number from 1 to the Paragraph cap; the form counts it down rather than stopping typing at it, and `validateField` refuses an answer past it. Name and Address parts are capped per part beside their rules (`embed/src/name.ts`, `embed/src/address.ts`), and an "Other" answer in `embed/src/choices.ts`. The embed sets each cap as the input's `maxlength` (number and date inputs ignore it), so a visitor can't type past what the server would refuse.

Dates compare as `YYYY-MM-DD` strings, never through `new Date` (a date-only string parses as UTC midnight, the previous day west of UTC). A bound of `"today"` is the visitor's own date in the embed; the server can't know the visitor's zone, so it accepts any date that is today somewhere (`anywhereToday`, UTC-12 to UTC+14).

**Two validation dialects. Do not cross them.** Embed forms use native HTML5 popups via `setCustomValidity()`, one error at a time. Admin and auth forms use custom inline validation with the touched/submitted pattern and `noValidate` on the form.

## Embed changes

Change `embed/src/*`, run `npm run embed:build`, commit the rebuilt `public/embed.js` with the source. The embed is browser-cached, so users may need a hard refresh to see a change.

Embed change not appearing: browser cache, or `npm run embed:build` was never run and `public/embed.js` is stale. Embed 403s: check `form.allowedOrigins`, or test from localhost.

## Adding a field type

1. Add to the `FieldType` enum in `prisma/schema.prisma` (with a migration).
2. Add it to `FIELD_TYPE_OPTIONS` in `src/lib/field-types.ts`; the build fails if you skip it. Its label there is also a new field's default label, and its traits there (`choice`, `composite`) decide where its config is stored and which boxes its settings show. Its place there is its place in the Add field menu: specific before general, so a type that would also catch a narrower need comes after it. If a new field can't save without config (as Choose one can't without options), give it defaults in `newFieldDefaults` (`src/lib/field-rules.ts`, with the save rules the editor and the field server actions both apply).
3. Give it an icon in `FIELD_TYPE_ICONS` (`src/components/forms/field-type-icons.ts`) for the Add field menu; the build fails without one.
4. Render it in `embed/src/form.ts`.
5. Add its rules to `validateField` in `embed/src/validation.ts`, and any length cap to the tables beside it. The embed and the server both run them.
6. Only what the server alone may do (a guardrail beyond the field's rules, rewriting the stored value) goes in `src/lib/public-submit.ts`, after `validateSubmission`.
7. Add a config panel in `src/components/field-config/` if it has options.
8. Run `npm run embed:build` and commit `public/embed.js`.
