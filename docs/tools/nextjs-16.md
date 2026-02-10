# Next.js 16 Documentation

**Last Updated:** January 2025  
**Current Version:** 16.1.4  
**Official Docs:** https://nextjs.org/docs

## Overview

Next.js 16 was released on October 21, 2025, representing a major update with significant performance improvements, new caching models, and breaking changes. Version 16.1.4 is the current stable release as of January 2025.

## Critical Changes from Next.js 15

### System Requirements (Breaking)

- **Node.js**: 20.9.0+ required (Node.js 18 no longer supported)
- **TypeScript**: 5.1.0+ required
- **Browsers**: Chrome 111+, Edge 111+, Firefox 111+, Safari 16.4+

### Turbopack is Now Default

Turbopack is **stable** and serves as the **default bundler** for all projects:
- No configuration needed—`next dev` and `next build` use Turbopack automatically
- **2-5× faster** production builds
- **Up to 10× faster** Fast Refresh (Hot Module Replacement)
- Remove `--turbopack` or `--turbo` flags from scripts (no longer needed)

**Opting Out:**
```bash
next dev --webpack    # Use webpack for dev
next build --webpack  # Use webpack for build
```

**Note:** Projects with custom webpack configurations will fail builds to prevent misconfiguration issues.

## Breaking Changes

### 1. Async Request APIs

**`params` and `searchParams` are now async** and must be awaited:

**Before (Next.js 15):**
```typescript
export default function Page({ params, searchParams }) {
  const { id } = params;
  const { filter } = searchParams;
  // ...
}
```

**After (Next.js 16):**
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

**Client Components Note:** If your page uses `"use client"`, you cannot make it async. Use Server Components for pages that need async params/searchParams.

### 2. Middleware → Proxy Migration

**`middleware.ts` is deprecated** and replaced with `proxy.ts`:

**Old (Next.js 15):**
```typescript
// middleware.ts (root or src/)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
```

**New (Next.js 16):**
```typescript
// app/proxy.ts (must be in App Router directory)
import { ProxyRequest, ProxyResponse } from 'next/server';

export async function proxy(
  request: ProxyRequest
): Promise<ProxyResponse> {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/admin')) {
    return ProxyResponse.redirect(new URL('/login', request.url));
  }
  
  return ProxyResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
```

**Key Differences:**
- File location: `app/proxy.ts` (not root)
- Function signature: `async function proxy(request: ProxyRequest): Promise<ProxyResponse>`
- Return types: `ProxyResponse.redirect()`, `ProxyResponse.rewrite()`, `ProxyResponse.next()`
- Runtime: Node.js by default (not Edge Runtime)

**What Proxy Should Do:**
- ✅ Rewrites (A/B testing, localization)
- ✅ Redirects (legacy paths)
- ✅ Headers (security headers)

**What Proxy Should NOT Do:**
- ❌ Database queries
- ❌ JWT verification
- ❌ Complex authentication logic

**Authentication:** Move auth logic to **Server Layout Guards** using React Server Components instead of global proxy files.

**Automated Migration:**
```bash
npx @next/codemod@latest middleware-to-proxy .
```

### 3. Configuration Changes

**`experimental.middlewarePrefetch` → `experimental.proxyPrefetch`**

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    proxyPrefetch: 'strict', // was middlewarePrefetch
  },
};
```

### 4. Removed `unstable_` Prefixes

APIs that were previously `unstable_*` are now stable and the prefix is removed:
- `unstable_cache` → `cache`
- `unstable_noStore` → `noStore`
- etc.

## New Features

### Cache Components

Next.js 16 introduces a new opt-in caching model using the `"use cache"` directive:

**Enable in Config:**
```typescript
// next.config.ts
const nextConfig = {
  cacheComponents: true,
};
```

**Usage:**
```typescript
// app/products/page.tsx
'use cache';

export default async function ProductsPage() {
  const products = await fetchProducts();
  return <ProductList products={products} />;
}
```

**Benefits:**
- Component-level caching granularity
- Automatic cache key generation
- 60-80% TTFB reduction on mixed-content pages
- Sub-100ms response times for static shell content

**Cache Control:**
```typescript
import { cacheLife, cacheTag } from 'next/cache';

'use cache';

export async function getProduct(id: string) {
  const product = await fetchProduct(id);
  
  // Set cache duration
  cacheLife(3600); // 1 hour
  
  // Tag for invalidation
  cacheTag(`product-${id}`);
  
  return product;
}
```

### React 19.2 Support

Next.js 16 ships with React 19.2, which includes:

**View Transitions:**
```typescript
import { ViewTransition } from 'react';

export default function Page() {
  return (
    <ViewTransition>
      <AnimatedContent />
    </ViewTransition>
  );
}
```

**`useEffectEvent` Hook:**
```typescript
import { useEffectEvent } from 'react';

function Chat({ roomId, onReceiveMessage }) {
  const onMessage = useEffectEvent(onReceiveMessage);
  
  useEffect(() => {
    const connection = connect(roomId);
    connection.on('message', onMessage);
    return () => connection.disconnect();
  }, [roomId]); // onMessage not needed in deps
}
```

**`<Activity />` Component:**
Keeps parts of UI mounted but hidden, preserving state while deferring side effects.

### Enhanced Routing

- Layout deduplication
- Incremental prefetching
- Optimized navigations

### Improved Logging

Build and development logs now show detailed timing breakdowns for better debugging.

## Migration Guide

### Automated Migration

Use the official codemod:
```bash
npx @next/codemod@canary upgrade latest
```

This automatically:
- Updates `next.config.js`
- Migrates `middleware.ts` → `proxy.ts`
- Updates async params/searchParams
- Removes `unstable_` prefixes
- Updates configuration properties

### Manual Migration Steps

1. **Update Dependencies:**
   ```bash
   npm install next@latest react@latest react-dom@latest
   ```

2. **Update Node.js:** Ensure Node.js 20.9+ is installed

3. **Update TypeScript:** Ensure TypeScript 5.1.0+ is installed

4. **Migrate Middleware:**
   - Rename `middleware.ts` → `app/proxy.ts`
   - Update function signature to use `ProxyRequest`/`ProxyResponse`
   - Make function async

5. **Update Route Handlers:**
   - Make `params` and `searchParams` async
   - Add `await` when accessing them

6. **Update Page Components:**
   - Make page components async if using params/searchParams
   - Add `await` when accessing params/searchParams

7. **Update Config:**
   - Change `experimental.middlewarePrefetch` → `experimental.proxyPrefetch`
   - Remove `unstable_` prefixes from APIs

8. **Remove Turbopack Flags:**
   - Remove `--turbopack` or `--turbo` from package.json scripts

## Common Patterns

### Server Component with Async Params

```typescript
// app/posts/[slug]/page.tsx
export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;
  
  const post = await getPost(slug, { preview: preview === 'true' });
  
  return <PostContent post={post} />;
}
```

### Route Handler with Async Params

```typescript
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUser(id);
  return NextResponse.json(user);
}
```

### Proxy for Redirects

```typescript
// app/proxy.ts
import { ProxyRequest, ProxyResponse } from 'next/server';

export async function proxy(
  request: ProxyRequest
): Promise<ProxyResponse> {
  const { pathname } = request.nextUrl;
  
  // Legacy redirects
  if (pathname.startsWith('/old-path')) {
    return ProxyResponse.redirect(
      new URL('/new-path', request.url)
    );
  }
  
  // Security headers
  const response = ProxyResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### Server Layout Guard (Auth Pattern)

```typescript
// app/(admin)/layout.tsx
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }
  
  return <>{children}</>;
}
```

## Performance Improvements

- **2-5× faster** production builds (Turbopack)
- **Up to 10× faster** Fast Refresh (Turbopack)
- **60-80% TTFB reduction** with Cache Components
- **Sub-100ms** response times for static content

## Project-Specific Notes

This project (Canopy Forms) currently:
- ✅ Using Next.js 16.1.4
- ✅ Already using async `params` correctly (awaiting them)
- ⚠️ Has `proxy.ts` but using old `NextRequest`/`NextResponse` API
  - Should migrate to `ProxyRequest`/`ProxyResponse`
  - Should make proxy function async
- ⚠️ `searchParams` may need to be awaited (verify each usage)
- ✅ Using App Router correctly
- ✅ Has `next.config.ts` with standalone output for Docker
- ✅ No custom webpack config (Turbopack works automatically)

## Troubleshooting

### "Cannot access Request information synchronously"

**Error:** `Cannot access Request information synchronously with Page or Layout or Route 'params' or Page 'searchParams'`

**Solution:** Make the component async and await params/searchParams:
```typescript
export default async function Page({ params }) {
  const { id } = await params; // Add await
}
```

### "Turbopack build failed"

**Cause:** Custom webpack configuration incompatible with Turbopack

**Solution:** Use `--webpack` flag or migrate webpack config to Turbopack equivalents

### "middleware.ts not found"

**Cause:** Migrated to `proxy.ts` but code still references middleware

**Solution:** Update all references to use `proxy.ts` and new API

## Resources

- **Official Documentation**: https://nextjs.org/docs
- **Upgrade Guide**: https://nextjs.org/docs/app/guides/upgrading/version-16
- **Proxy Documentation**: https://nextjs.org/docs/app/getting-started/proxy
- **Cache Components**: https://nextjs.org/docs/app/api-reference/directives/use-cache
- **Turbopack**: https://nextjs.org/docs/app/api-reference/next-config-js/turbopack
- **Changelog**: https://nextjs.org/blog

## Quick Reference

### Commands

```bash
# Development (Turbopack, default)
npm run dev

# Development (Webpack, opt-out)
next dev --webpack

# Production build (Turbopack, default)
npm run build

# Production build (Webpack, opt-out)
next build --webpack

# Upgrade codemod
npx @next/codemod@canary upgrade latest

# Middleware to proxy migration
npx @next/codemod@latest middleware-to-proxy .
```

### Type Definitions

```typescript
// Page props
type PageProps = {
  params: Promise<{ [key: string]: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Route handler
type RouteHandler = (
  request: Request,
  context: { params: Promise<{ [key: string]: string }> }
) => Promise<Response>;

// Proxy
type ProxyFunction = (
  request: ProxyRequest
) => Promise<ProxyResponse>;
```

---

**For AI Agents:** If you encounter code using synchronous `params`/`searchParams`, `middleware.ts`, or `unstable_` prefixed APIs, these are outdated patterns from Next.js 15. Update to async patterns and use `proxy.ts` instead of `middleware.ts`. Turbopack is now default—no configuration needed unless opting out.
