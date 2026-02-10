# React 19 Documentation

**Last Updated:** January 2025  
**Current Version:** 19.2.3  
**Official Docs:** https://react.dev

## Overview

React 19 was released on December 5, 2024, representing the biggest upgrade since React 18. It completes React's shift toward an async-first architecture with new hooks, improved form handling, and automatic performance optimizations. React 19.2 (released October 1, 2025) adds additional features like the `<Activity />` component and `useEffectEvent` hook.

## Critical Changes from React 18

### Architecture Shift

- **Async-first**: Built-in support for async workflows in forms and transitions
- **Actions**: New pattern for handling data mutations with automatic state management
- **React Compiler**: Automatic memoization (no manual `useMemo`/`useCallback` needed)
- **Improved Server Components**: Better streaming and asset loading
- **Enhanced Suspense**: Pre-warming for suspended trees

### Minimum Requirements

- **Node.js**: 16+ (18+ recommended)
- **TypeScript**: 4.7+ for proper type support
- **New JSX Transform**: Required (most bundlers already have this)

## Breaking Changes

### 1. New JSX Transform Required

The new JSX transform (introduced in 2020) is now **mandatory** in React 19.

**What This Means:**
- React 19 optimizations require the new transform
- Most modern bundlers (Next.js, Vite, etc.) already have this enabled
- You may see warnings if it's not enabled

**How to Enable:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx"  // Not "react"
  }
}
```

### 2. Library Compatibility

React 19 restricts access to React internals. Some libraries may break:

**Known Issues:**
- **React Router**: Requires v6.8+
- **Styled Components**: Requires v5.3.6+
- **Redux Toolkit**: May need updates
- **Emotion**: May need updates
- **Formik**: Check compatibility

**Solution:** Update libraries to React 19-compatible versions.

### 3. Ref as a Prop

Refs can now be passed as regular props (not just via `ref`):

```typescript
// React 19: ref can be a prop name
<MyComponent ref={myRef} />
<MyComponent customRef={myRef} />  // Also works
```

## New Features

### Actions and Async Transitions

**Actions** are async functions that automatically manage:
- Pending states
- Error handling
- Optimistic updates
- Form reset after submission

**Before (React 18):**
```typescript
function Form() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    
    try {
      await submitForm(new FormData(e.currentTarget));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
}
```

**After (React 19):**
```typescript
import { useActionState } from 'react';

async function submitAction(prevState: any, formData: FormData) {
  try {
    await submitForm(formData);
    return { success: true };
  } catch (error) {
    return { error: error.message };
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

### New Hooks

#### `use()` Hook

Consume Promises directly in components:

```typescript
import { use } from 'react';

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);  // No useEffect needed!
  
  return <div>{user.name}</div>;
}
```

**Key Features:**
- Can be called conditionally
- Automatically suspends until Promise resolves
- Works with Context values too

#### `useActionState` Hook

Manages async form actions with automatic state management:

```typescript
import { useActionState } from 'react';

async function updateName(prevState: any, formData: FormData) {
  const name = formData.get('name');
  // ... update logic
  return { success: true };
}

function NameForm() {
  const [state, formAction, isPending] = useActionState(updateName, null);

  return (
    <form action={formAction}>
      <input name="name" />
      <button disabled={isPending}>Update</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}
```

**Returns:**
- `state`: Current state from action
- `formAction`: Action function to pass to form
- `isPending`: Boolean indicating if action is in progress

#### `useOptimistic` Hook

Show optimistic UI updates while async actions complete:

```typescript
import { useOptimistic } from 'react';

function MessageList({ messages }: { messages: Message[] }) {
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (state, newMessage: Message) => [...state, newMessage]
  );

  async function sendMessage(formData: FormData) {
    const message = { text: formData.get('text'), id: Date.now() };
    addOptimistic(message);  // Show immediately
    
    await saveMessage(message);  // Then save
  }

  return (
    <>
      {optimisticMessages.map(msg => <Message key={msg.id} msg={msg} />)}
      <form action={sendMessage}>
        <input name="text" />
        <button>Send</button>
      </form>
    </>
  );
}
```

#### `useEffectEvent` Hook (19.2)

Extract non-reactive logic from Effects:

```typescript
import { useEffectEvent } from 'react';

function Chat({ roomId, theme }: { roomId: string; theme: string }) {
  const onMessage = useEffectEvent((message: string) => {
    showNotification(message, theme);  // theme is always latest
  });

  useEffect(() => {
    const connection = connect(roomId);
    connection.on('message', onMessage);
    return () => connection.disconnect();
  }, [roomId]);  // onMessage not needed in deps!
}
```

**Benefits:**
- Prevents unnecessary Effect re-runs
- Always sees latest props/state values
- Cleaner dependency arrays

#### `useFormStatus` Hook

Track form submission status:

```typescript
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();
  
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}
```

**Note:** Must be used within a `<form>` element.

### React Compiler

Automatic memoization - no manual optimization needed:

```typescript
// React 19: Automatically memoized
function ExpensiveComponent({ data }: { data: Data[] }) {
  const filtered = data.filter(item => item.active);  // Auto-memoized!
  const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));
  
  return <div>{/* ... */}</div>;
}

// No need for:
// const filtered = useMemo(() => ..., [data]);
// const sorted = useMemo(() => ..., [filtered]);
```

### Form Improvements

Native `<form>` elements now support async workflows:

```typescript
async function submitAction(formData: FormData) {
  'use server';  // Next.js Server Action
  await saveData(formData);
}

function MyForm() {
  return (
    <form action={submitAction}>
      {/* Automatically handles:
          - Pending state
          - Error handling
          - Form reset after success
      */}
      <input name="email" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### View Transitions (19.2)

Animate elements during updates:

```typescript
import { ViewTransition } from 'react';

function Page() {
  const [page, setPage] = useState(1);
  
  return (
    <ViewTransition>
      <div key={page}>
        Page {page}
      </div>
      <button onClick={() => setPage(p => p + 1)}>Next</button>
    </ViewTransition>
  );
}
```

### `<Activity />` Component (19.2)

Keep parts of UI mounted but hidden:

```typescript
import { Activity } from 'react';

function App() {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowDetails(!showDetails)}>
        Toggle Details
      </button>
      <Activity mode={showDetails ? 'visible' : 'hidden'}>
        <ExpensiveComponent />  // State preserved when hidden
      </Activity>
    </>
  );
}
```

**Modes:**
- `visible`: Shows children, mounts effects, processes updates
- `hidden`: Hides children, unmounts effects, defers updates

## Migration Guide

### Step 1: Pre-upgrade to React 18.3

React 18.3 adds deprecation warnings for breaking changes:

```bash
npm install react@18.3 react-dom@18.3
```

Fix any deprecation warnings before upgrading.

### Step 2: Update Dependencies

```bash
npm install --save-exact react@^19.0.0 react-dom@^19.0.0
npm install --save-exact @types/react@^19.0.0 @types/react-dom@^19.0.0
```

### Step 3: Update Libraries

Check and update:
- React Router → v6.8+
- Styled Components → v5.3.6+
- Other libraries as needed

### Step 4: Enable New JSX Transform

Ensure `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

### Step 5: Use Automated Codemod

```bash
npx codemod@latest react/19/migration-recipe
```

### Step 6: Update Forms to Actions

Convert form handlers to use `useActionState`:

**Before:**
```typescript
const [isPending, setIsPending] = useState(false);
async function handleSubmit(e: FormEvent) {
  setIsPending(true);
  // ...
}
```

**After:**
```typescript
const [state, formAction, isPending] = useActionState(submitAction, null);
```

## Common Patterns

### Form with Action State

```typescript
import { useActionState } from 'react';

async function createUser(prevState: any, formData: FormData) {
  const name = formData.get('name');
  try {
    await saveUser({ name });
    return { success: true, message: 'User created!' };
  } catch (error) {
    return { error: error.message };
  }
}

function UserForm() {
  const [state, formAction, isPending] = useActionState(createUser, null);

  return (
    <form action={formAction}>
      <input name="name" required />
      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success">{state.message}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### Optimistic Updates

```typescript
import { useOptimistic } from 'react';

function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, { ...newTodo, pending: true }]
  );

  async function addTodo(formData: FormData) {
    const todo = { id: Date.now(), text: formData.get('text') };
    addOptimistic(todo);
    await saveTodo(todo);
  }

  return (
    <>
      {optimisticTodos.map(todo => (
        <Todo key={todo.id} todo={todo} />
      ))}
      <form action={addTodo}>
        <input name="text" />
        <button>Add</button>
      </form>
    </>
  );
}
```

### Effect Event Pattern

```typescript
import { useEffectEvent } from 'react';

function SearchResults({ query, filters }: Props) {
  const onResults = useEffectEvent((results: Result[]) => {
    // Always sees latest query and filters
    logAnalytics(query, filters, results);
  });

  useEffect(() => {
    search(query).then(onResults);
  }, [query]);  // filters not needed in deps
}
```

### Using Promises in Components

```typescript
import { use, Suspense } from 'react';

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);
  return <div>{user.name}</div>;
}

function App() {
  const userPromise = fetchUser();
  
  return (
    <Suspense fallback={<Loading />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

## Performance Improvements

- **Automatic memoization**: React Compiler handles optimization
- **Better hydration**: Improved error reporting and performance
- **Faster updates**: Optimized rendering pipeline
- **Improved Suspense**: Pre-warming for better perceived performance

## Project-Specific Notes

This project (Canopy Forms) currently:
- ✅ Using React 19.2.3
- ✅ Using `useTransition` correctly for async operations
- ⚠️ Not yet using new hooks (`useActionState`, `useOptimistic`, `useEffectEvent`)
- ✅ Standard hooks (`useState`, `useEffect`, `useMemo`) working correctly
- ✅ Forms could benefit from `useActionState` migration
- ✅ Could use `useOptimistic` for better UX in form submissions

## Troubleshooting

### "Cannot find module 'react/jsx-runtime'"

**Cause:** New JSX transform not enabled

**Solution:** Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

### Library compatibility errors

**Cause:** Library accessing React internals

**Solution:** Update library to React 19-compatible version

### "use() must be called inside a Suspense boundary"

**Cause:** Using `use()` hook without Suspense

**Solution:** Wrap component in `<Suspense>`:
```typescript
<Suspense fallback={<Loading />}>
  <ComponentWithUse />
</Suspense>
```

### Forms not resetting after submission

**Cause:** Not using Actions pattern

**Solution:** Use `useActionState` or ensure action returns success state

## Resources

- **Official Documentation**: https://react.dev
- **React 19 Blog Post**: https://react.dev/blog/2024/12/05/react-19
- **Upgrade Guide**: https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- **React 19.2 Release**: https://react.dev/blog/2025/10/01/react-19-2
- **Hooks Reference**: https://react.dev/reference/react

## Quick Reference

### New Hooks

```typescript
// Consume Promises
const data = use(promise);

// Form actions
const [state, formAction, isPending] = useActionState(action, initialState);

// Optimistic updates
const [optimisticState, addOptimistic] = useOptimistic(state, updateFn);

// Effect events
const onEvent = useEffectEvent(callback);

// Form status
const { pending, data, method, action } = useFormStatus();
```

### Actions Pattern

```typescript
async function myAction(prevState: any, formData: FormData) {
  // ... async work
  return { success: true };
}

const [state, formAction, isPending] = useActionState(myAction, null);
```

### Migration Checklist

- [ ] Update to React 18.3 first (check deprecations)
- [ ] Update React to 19.x
- [ ] Update TypeScript types
- [ ] Enable new JSX transform
- [ ] Update libraries (React Router, Styled Components, etc.)
- [ ] Run codemod: `npx codemod@latest react/19/migration-recipe`
- [ ] Convert forms to use `useActionState`
- [ ] Add optimistic updates with `useOptimistic`
- [ ] Refactor Effects to use `useEffectEvent` where beneficial

---

**For AI Agents:** If you encounter code using manual `useMemo`/`useCallback` optimizations, React 19's compiler handles this automatically. Forms should use `useActionState` instead of manual state management. The `use()` hook replaces `useEffect` + Promise patterns. `useOptimistic` provides better UX than manual optimistic state management.
