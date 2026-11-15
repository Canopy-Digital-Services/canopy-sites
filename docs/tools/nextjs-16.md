# Next.js 16 Documentation

**Installed version:** `next` in `package-lock.json` (16.4.5 as of 2026-11-10)
**Official Docs:** https://nextjs.org/docs. The installed package also carries the docs for its own version in `node_modules/next/dist/docs/` (`/app/node_modules/next/dist/docs/` in the dev container; the upgrade guide is `01-app/02-guides/upgrading/version-16.md`). Check a claim there first: it matches the code that runs.

## Overview

Next.js 16 (October 21, 2025) made Turbopack the default bundler, removed synchronous access to the request APIs, renamed middleware to proxy, and replaced the experimental caching flags with Cache Components.

The statements below were checked on 2026-11-15 against the bundled upgrade guide and the types of 16.4.5.

## Changes from Next.js 15

### System Requirements

- **Node.js**: 20.9.0+ required (Node.js 18 no longer supported)
- **TypeScript**: 5.1.0+ required
- **Browsers**: Chrome 111+, Edge 111+, Firefox 111+, Safari 16.4+

### Turbopack is the Default Bundler

- `next dev` and `next build` use Turbopack with no flag. `--turbopack` and `--turbo` are no longer needed in scripts.
- `next build` fails when it finds a custom `webpack` config, unless it runs with `--webpack` (build with webpack) or `--turbopack` (ignore that config).

**Opting Out:**
```bash
next dev --webpack    # Use webpack for dev
next build --webpack  # Use webpack for build
```

### Async Request APIs

`params` and `searchParams` are promises. Synchronous access, which Next.js 15 still allowed with a warning, is removed.

```typescript
export default async function Page({ 
  params, 
  searchParams 
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { id } = await params;
  const { filter } = await searchParams;
  // ...
}
```

**Route Handlers:**
```typescript
// app/api/users/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

**Other Async APIs:**
- `cookies()` - must be awaited
- `headers()` - must be awaited
- `draftMode()` - must be awaited

**Client Components Note:** A `"use client"` page cannot be async. It reads `params` or `searchParams` with React's `use()`, or the query string with `useSearchParams`, which is what this repo's client pages do.

### Middleware → Proxy

**`middleware.ts` is deprecated** and replaced with `proxy.ts`: the same API under a renamed file and export.

```typescript
// proxy.ts or src/proxy.ts (same place middleware.ts went)
import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: '/admin/:path*' };
```

**Key differences** (verified against `next` 16.1.6 in `node_modules`, 2026-10-15):
- File: `proxy.ts` at the project root or `src/proxy.ts` (`PROXY_LOCATION_REGEXP` in `next/dist/lib/constants.js`). Not under `app/`.
- Export: a function named `proxy` or a default export. There are no `ProxyRequest`/`ProxyResponse` types: use `NextRequest`/`NextResponse`.
- Runtime: Node.js only, so Prisma works there. The `edge` runtime is not supported in `proxy`.
- Config options with `middleware` in the name were renamed too: `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`, `experimental.middlewarePrefetch` → `experimental.proxyPrefetch`.

**Authorization stays in server layout guards** (`requireAuth`, `requireGlobalAdmin`), not the proxy. This repo has no proxy. The reference implementation is `src/app/(admin)/layout.tsx`: the layout awaits `requireAuth()` from `@/lib/auth-utils`, which redirects a signed-out request to `/login`, then `requireHomeHost`. There is no `auth()` helper and no `@/lib/auth` module (no auth library, `docs/AGENT_CONTEXT.md` section 1). A server component cannot set cookies (only server actions and route handlers can), which is why sessions roll their idle expiry in the database rather than in the cookie (Epic 28).

### `next lint` is Removed

The `next lint` command no longer exists, and `next build` no longer lints. The portal's `lint` script runs `eslint` with the flat config in `eslint.config.mjs`.

### Caching APIs

- `revalidateTag(tag, profile)` takes a required second argument, a `cacheLife` profile such as `'max'`. The one-argument call is a type error.
- `updateTag(tag)` expires a tag immediately from a Server Action, and `refresh()` refreshes the client router from one.
- `cacheLife` and `cacheTag` lost the `unstable_` prefix (`unstable_cacheLife` and `unstable_cacheTag` remain as aliases). `unstable_cache` and `unstable_noStore` keep theirs: `next/cache` exports no `cache` or `noStore` (read from `next/cache.d.ts` in 16.4.5, 2026-11-14).
- `revalidatePath` is unchanged. It is the only one of these the portal calls (as of 2026-11-15).

### Cache Components (opt-in)

`cacheComponents: true` in `next.config.ts` turns on the `"use cache"` directive, and it is how Partial Prerendering is enabled in 16. The `experimental.ppr`, `experimental.dynamicIO`, and `experimental.useCache` flags are gone. **The portal does not enable it.**

`"use cache"` goes at the top of a file, which caches every export, or as the first statement of an async function or component:

```typescript
import { cacheLife, cacheTag } from 'next/cache';

export async function getProduct(id: string) {
  'use cache';
  const product = await fetchProduct(id);
  
  // Set cache duration: a profile name ('seconds', 'minutes', 'hours', 'days',
  // 'weeks', 'max') or { stale, revalidate, expire }, never a bare number
  cacheLife('hours');
  
  // Tag for invalidation
  cacheTag(`product-${id}`);
  
  return product;
}
```

### React Canary in the App Router

The App Router runs on a React canary. It has the 19.2 features (`useEffectEvent`, `<Activity />`) and also `<ViewTransition>`, which the stable `react` package does not export. See [`react-19.md`](./react-19.md).

### Separate Output Directories

`next dev` writes to `.next/dev` and `next build` to `.next`, and a lockfile stops a second `next dev` or `next build` in the same project. The rule against building on the host still holds, for the reasons in [`docker.md`](./docker.md) (Development Mode Configuration).

### Parallel Routes Need `default.js`

Every parallel route slot (`@name`) needs an explicit `default.js`, or the build fails. The portal has no parallel routes (as of 2026-11-15).

## Project-Specific Notes

In `apps/portal` as of 2026-11-14:
- Server pages await `params` and `searchParams`; client pages read the query string with `useSearchParams`.
- `next.config.ts` sets `output: "standalone"` for the Docker image and has no webpack config, so Turbopack builds it.

### Upgrading `next` in this repo

- **Keep `next` at the repo root.** `npm install next@<version> -w @canopy/portal` over the existing lockfile puts the new `next` in `apps/portal/node_modules`, and the production Dockerfile copies only the root `node_modules` (seen 2026-11-10 with npm 10.8.2). Remove it and add it back so npm places it afresh, then install from the lockfile:

  ```bash
  npm uninstall next -w @canopy/portal --package-lock-only
  npm install next@<version> -w @canopy/portal --package-lock-only
  npm ci
  ```

  Afterwards the lockfile has `node_modules/next` and no `apps/portal/node_modules/*` entry. `src/lib/hoisted-dependencies.test.ts` fails until it does.
- **Read each release's notes for security fixes, not only `npm audit`.** A security release can be out for days before its advisories reach the audit (16.4.5 on 2026-11-10).
- **Run the browser smoke on the dev server and on a production build.** They differ: see the Radix slot below.

### A route's `params` are decoded once

A catch-all route's `params` arrive decoded one time per segment: `%20` is a space, `%2F` is a `/` inside one segment, and `%252e` is the text `%2e`. The dev server and a production build agree (verified on 16.4.5, 2026-11-10). Never decode them again, and check them before using them as a path (`isSiteFilePath` in `src/lib/builder-client.ts`).

### `asChild` and the Radix slot (root `overrides`)

On the dev server from 16.4, the children an async server component passes to a client component can arrive as lazy elements. `@radix-ui/react-slot` before 1.2.4 renders nothing for a lazy `asChild` child, so the server sends an empty `TooltipTrigger asChild` (or `Button asChild`) and hydration fails on the page. A production build is not affected. The root `package.json` pins the slot to 1.2.4 through `overrides` for that reason (verified 2026-11-10: the forms list's view toggle). Delete the override when `radix-ui` depends on `@radix-ui/react-slot` 1.2.4 or later by itself.

## Resources

- **Official Documentation**: https://nextjs.org/docs
- **Upgrade Guide**: https://nextjs.org/docs/app/guides/upgrading/version-16
- **Proxy Documentation**: https://nextjs.org/docs/app/getting-started/proxy
- **Cache Components**: https://nextjs.org/docs/app/api-reference/directives/use-cache
- **Turbopack**: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
- **Changelog**: https://nextjs.org/blog
