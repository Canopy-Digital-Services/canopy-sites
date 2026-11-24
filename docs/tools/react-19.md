# React 19

`react` and `react-dom` 19.2.3, pinned exactly in `apps/portal/package.json` (2026-11-23). The packages ship no docs; react.dev documents the current release. The App Router renders with the React canary bundled inside `next`, which is why `<ViewTransition>` exists there and not in `react` 19.2.3.

## Breaking changes from 18

**`ref` is a prop.** A new component takes it from props, with no `forwardRef`: `React.ComponentProps<"input">` includes `ref`, so spreading the props passes it on (`src/components/ui/input.tsx`). Existing `forwardRef` components work unchanged.

**A ref callback returns nothing or a cleanup function.** An arrow that returns its assignment is a type error:

```tsx
<div ref={(el) => (node = el)} />    // type error
<div ref={(el) => { node = el; }} /> // ok
```

**`useFormState` from `react-dom` is now `useActionState` from `react`**, and it also returns the pending flag: `const [state, formAction, isPending] = useActionState(fn, initialState)`, where `fn(prevState, formData)` returns the next state.

`<Context value={v}>` renders a provider. `<Context.Provider>` still works, and the repo uses it.

## Newer APIs and their traps

None of these is the repo's form pattern (below), but each has a rule older training gets wrong:

- **`<form action={fn}>`** resets the form's uncontrolled fields when the action succeeds.
- **`useFormStatus`** (`react-dom`) reads the enclosing `<form>`, so call it in a component rendered inside the form, never in the one that renders the `<form>`.
- **`use(promise)`** suspends, so it needs a `<Suspense>` above it, and it does not support a promise created during a client component's render ("A component was suspended by an uncached promise"). Start the promise in a server component and pass it down: `Examples` in `src/app/(admin)/(sites)/quick-edit/quick-edit-workspace.tsx`, fed by `page.tsx` beside it. Unlike a hook, it may be called conditionally.
- **`useEffectEvent`** (19.2) is never listed in a dependency array, is declared in the same component or hook as its Effect, and is not a way to quiet the dependency lint.
- **`<ViewTransition>`** is canary only. Read Next's guide (`/app/node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` in the dev container) before using it.

## In this repo

- **The React Compiler is off** (no `reactCompiler` in `apps/portal/next.config.ts`, 2026-11-23), so nothing is memoized for you. Keep the existing `useMemo` and `useCallback`, and add them where a value or callback has to stay stable.
- **Admin and auth forms** use the inline touched/submitted validation in `docs/AGENT_CONTEXT.md` section 2 ("Validation") and call server actions from their own submit handlers, tracking pending state themselves (mostly with `useTransition`). Extend that pattern; do not convert a form to `useActionState` or `<form action>`.
