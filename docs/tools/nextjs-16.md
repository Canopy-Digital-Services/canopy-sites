# Next.js 16

`next` 16.4.5 (root `package-lock.json`, 2026-11-23). The package ships the docs for its own version. Read them in the container, at `/app/node_modules/next/dist/docs/` (the upgrade guide is `01-app/02-guides/upgrading/version-16.md`), not on the host, whose `node_modules` is a different install ([`docker.md`](./docker.md)). Check a claim there before trusting memory.

## Breaking changes from 15

**Request APIs are async only.** `params` (page, layout, route handler) and `searchParams` (page) are promises, and `cookies()`, `headers()`, and `draftMode()` are awaited. The synchronous access 15 still allowed is gone.

```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

A `"use client"` page cannot be async. It reads the query string with `useSearchParams` (`src/app/(auth)/login/page.tsx`), or a promise passed down with React's `use()`.

**`middleware.ts` is now `proxy.ts`**, at the project root or in `src/` (never under `app/`), exporting a function named `proxy` that takes a `NextRequest`. It runs on Node only. Config flags were renamed with it (`skipMiddlewareUrlNormalize` is `skipProxyUrlNormalize`). This repo has no proxy: authorization is a server layout guard, `requireAuth()` or `requireGlobalAdmin()` from `@/lib/auth-utils` (reference: `src/app/(admin)/layout.tsx`). There is no `auth()` helper and no `@/lib/auth`. A server component can read cookies but not set them (only server actions and route handlers can), which is why a session's idle expiry rolls forward in the database (`src/lib/session.ts`).

**`next lint` is gone**, and `next build` no longer lints. `npm run lint` runs `eslint` with the flat config in `eslint.config.mjs`.

**Turbopack is the default** for `next dev` and `next build`, with no flag. `next build` fails on a custom `webpack` config; `next.config.ts` has none.

**Caching APIs** (all from `next/cache`):
- `revalidateTag(tag, profile)` requires a `cacheLife` profile such as `'max'`. The one-argument call is a type error.
- `updateTag(tag)` expires a tag at once, from a Server Action only. `refresh()` refreshes the client router from one.
- `cacheLife` and `cacheTag` lost the `unstable_` prefix. `unstable_cache` and `unstable_noStore` kept it.
- `revalidatePath` is unchanged, and the only one of these the portal calls (2026-11-23).

**Cache Components** (`cacheComponents: true` and the `"use cache"` directive) replace the `experimental.ppr`, `dynamicIO`, and `useCache` flags, which are gone. The portal does not enable it.

**Every parallel route slot (`@name`) needs an explicit `default.tsx`**, or the build fails.

**`next dev` writes `.next/dev` and `next build` writes `.next`.** That does not make a host build safe here (`docs/VERIFICATION_CHECKLIST.md` section 1).

## In this repo

### Upgrading `next` in this repo

- **Keep `next` at the repo root.** `npm install next@<version> -w @canopy/portal` over the existing lockfile put the new `next` in `apps/portal/node_modules` (2026-11-10, npm 10.8.2), and the production Dockerfile copies only the root `node_modules`. Remove it from the lockfile and add it back, so npm places it afresh:

  ```bash
  npm uninstall next -w @canopy/portal --package-lock-only
  npm install next@<version> -w @canopy/portal --package-lock-only
  ```

  Then install from the lockfile into the dev container's volume (Dependencies, under "After a change in dev" in [`docker.md`](./docker.md)). `src/lib/hoisted-dependencies.test.ts` fails while the lockfile has any `apps/portal/node_modules/*` entry.
- **Read each release's notes for security fixes, not only `npm audit`.** A security release can be out for days before its advisories reach the audit (16.4.5 on 2026-11-10).
- **Run the browser smoke on the dev server and on a production build.** They differ (the Radix slot below).

### A route's `params` are decoded once

A catch-all route's `params` arrive decoded one time per segment: `%20` is a space, `%2F` is a `/` inside one segment, and `%252e` is the text `%2e`. The dev server and a production build agree (verified on 16.4.5, 2026-11-10). Never decode them again, and check them before using them as a path (`isSiteFilePath` in `src/lib/builder-client.ts`).

### `asChild` and the Radix slot (root `overrides`)

On the dev server from 16.4, the children an async server component passes to a client component can arrive as lazy elements. `@radix-ui/react-slot` before 1.2.4 renders nothing for a lazy `asChild` child, so the server sends an empty `TooltipTrigger asChild` (or `Button asChild`) and hydration fails on the page. A production build is not affected. The root `package.json` pins the slot to 1.2.4 through `overrides` for that reason (verified 2026-11-10: the forms list's view toggle). Delete the override when `radix-ui` depends on `@radix-ui/react-slot` 1.2.4 or later by itself (`radix-ui` 1.4.3 asks for 1.2.3, 2026-11-23).
