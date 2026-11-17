# React 19 Documentation

**Installed version:** `react` and `react-dom` in `apps/portal/package.json`, pinned exactly (19.2.3 as of 2026-11-14).  
**Official Docs:** https://react.dev

## Overview

React 19 (December 5, 2024) made async work part of the core API: Actions, hooks for form and optimistic state, and `ref` as an ordinary prop. React 19.2 (October 1, 2025) added `<Activity />` and `useEffectEvent`.

The API statements below were checked on 2026-11-15 against the installed `react` and `react-dom` 19.2.3 and the two release posts under Resources.

## Changes from React 18

### `ref` is a prop

A function component receives `ref` as a prop. New components do not need `forwardRef`, which will be deprecated. The `src/components/ui/` primitives are written this way (`input.tsx`); two still use `forwardRef` (`radio-group.tsx`, `password-input.tsx`, as of 2026-11-15) and work unchanged.

```typescript
function Input({ ref, ...props }: React.ComponentProps<"input">) {
  return <input ref={ref} {...props} />;
}
```

Two related changes: a `ref` callback may return a cleanup function, and `<Context>` renders as a provider in place of `<Context.Provider>`.

### `useFormState` became `useActionState`

`useFormState` from `react-dom` is deprecated. `useActionState` is imported from `react` and also returns `isPending`.

### New JSX transform is required

`apps/portal/tsconfig.json` sets `"jsx": "react-jsx"`. Leave it.

## New Features

### Actions and Async Transitions

An Action is an async function run in a transition. React manages for it:
- Pending state, from the start of the request until the final state update commits
- Optimistic updates (`useOptimistic`), reverted if the request fails
- Errors, shown by the nearest Error Boundary
- Forms: `<form action={fn}>` and `formAction` take functions

```typescript
import { useActionState } from 'react';

async function submitAction(prevState: State, formData: FormData): Promise<State> {
  try {
    await submitForm(formData);
    return { success: true };
  } catch {
    return { error: 'Could not save.' };
  }
}

function Form() {
  const [state, formAction, isPending] = useActionState(submitAction, null);

  return (
    <form action={formAction}>
      {state?.error && <p>{state.error}</p>}
      <button disabled={isPending}>Submit</button>
    </form>
  );
}
```

`useActionState` returns the current state, the action to pass to the form, and `isPending`.

### Form Improvements

When a `<form action={fn}>` Action succeeds, React resets the form's uncontrolled fields. Controlled fields keep their state. Pending and error state are not shown by themselves: read them with `useActionState` or `useFormStatus`.

### `use()`

Reads a promise or a context during render.

```typescript
import { use } from 'react';

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);
  return <div>{user.name}</div>;
}
```

- It can be called conditionally and after an early return, unlike a hook, but only during render.
- It suspends until the promise resolves, so it needs a `<Suspense>` boundary above it.
- It does not support a promise created during a Client Component's render ("A component was suspended by an uncached promise"). Pass the promise down from a Server Component, or from a library that caches it.
- `use(SomeContext)` reads context.

### `useOptimistic`

Shows a value immediately while an Action runs. Call the setter inside the Action or a transition.

```typescript
import { useOptimistic } from 'react';

function MessageList({ messages }: { messages: Message[] }) {
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (state, newMessage: Message) => [...state, newMessage]
  );

  async function sendMessage(formData: FormData) {
    const message = { text: String(formData.get('text')), id: crypto.randomUUID() };
    addOptimistic(message);
    await saveMessage(message);
  }

  return (
    <>
      {optimisticMessages.map(msg => <MessageRow key={msg.id} msg={msg} />)}
      <form action={sendMessage}>
        <input name="text" />
        <button>Send</button>
      </form>
    </>
  );
}
```

### `useFormStatus`

Reads the status of the parent `<form>`, as if the form were a context provider. Call it from a component rendered inside the form, not from the component that renders the `<form>` element.

```typescript
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>Submit</button>;
}
```

It also returns `data`, `method`, and `action`.

### `useEffectEvent` (19.2)

Splits the event part out of an Effect, so it reads the latest props and state without re-running the Effect.

```typescript
import { useEffect, useEffectEvent } from 'react';

function Chat({ roomId, theme }: { roomId: string; theme: string }) {
  const onMessage = useEffectEvent((message: string) => {
    showNotification(message, theme);  // theme is always the latest
  });

  useEffect(() => {
    const connection = connect(roomId);
    connection.on('message', onMessage);
    return () => connection.disconnect();
  }, [roomId]);
}
```

- Never list an Effect Event in a dependency array. `eslint-plugin-react-hooks` 6 and later knows not to ask for it (7.0.1 is installed, 2026-11-15).
- Declare it in the same component or hook as its Effect.
- It is not a way to silence the dependency lint: wrapping reactive logic that should re-run the Effect causes bugs.

### `<Activity />` (19.2)

Keeps part of the UI mounted while hidden, with its state.

```typescript
import { Activity } from 'react';

<Activity mode={showDetails ? 'visible' : 'hidden'}>
  <Details />
</Activity>
```

- `visible`: shows the children, mounts effects, processes updates normally
- `hidden`: hides the children, unmounts effects, and defers updates until React has nothing else to do

### View Transitions (canary only)

`<ViewTransition>` is not in the stable package: `react` 19.2.3 exports no `ViewTransition`. Next's App Router runs on a React canary that does export it, and Next documents its use in `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`. Read that guide before reaching for it; nothing in this repo uses it.

### React Compiler

The compiler memoizes components at build time. It is a separate, opt-in build plugin: React 19 by itself memoizes nothing. Next.js enables it with `reactCompiler: true` in `next.config.ts` plus the `babel-plugin-react-compiler` package.

**This repo does not enable it** (`apps/portal/next.config.ts` has no `reactCompiler`, checked 2026-11-14). `useMemo` and `useCallback` still do their work here: keep the ones that exist, and add them where a value or callback has to stay stable.

## Project-Specific Notes

In `apps/portal/src` as of 2026-11-14 (grep to recheck):
- No component uses `useActionState`, `useOptimistic`, `useEffectEvent`, `useFormStatus`, or `use()`. Pending state comes from `useTransition`.
- Admin and auth forms follow the inline validation pattern in `docs/AGENT_CONTEXT.md` section 2 ("Validation"), not `useActionState`. Extend that pattern rather than converting a form.
- The React Compiler is off (see React Compiler above).

## Resources

- **Official Documentation**: https://react.dev
- **React 19 Blog Post**: https://react.dev/blog/2024/12/05/react-19
- **Upgrade Guide**: https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- **React 19.2 Release**: https://react.dev/blog/2025/10/01/react-19-2
- **Hooks Reference**: https://react.dev/reference/react
