# NextAuth v5 (Auth.js) Documentation

**Last Updated:** January 2025  
**Current Version:** 5.0.0-beta.30 (beta)  
**Official Docs:** https://authjs.dev

## Overview

NextAuth v5 is a complete rewrite of NextAuth.js, now part of the **Auth.js** project. It represents a fundamental architectural change with improved TypeScript support, App Router-first design, and a unified authentication API. The project is currently in beta (5.0.0-beta.30 as of January 2025).

**Note:** Auth.js has joined Better Auth, but NextAuth v5 remains the recommended path for Next.js applications.

## Critical Changes from NextAuth v4

### Architecture Shift

- **Framework-agnostic core**: Built on `@auth/core` for use across frameworks
- **App Router-first**: Designed for Next.js App Router (Pages Router still supported)
- **Edge-compatible**: Fully compatible with Edge Runtime
- **Universal API**: Single `auth()` function replaces multiple methods
- **Simplified configuration**: Central `auth.ts` file instead of scattered `authOptions`

### Minimum Requirements

- **Next.js**: 13.4+ required
- **Node.js**: Compatible with Node.js 18+ (20+ recommended)

## Breaking Changes

### 1. Import Paths Removed

**Old (v4):**
```typescript
import { getServerSession } from "next-auth/next";
import { getSession } from "next-auth/react";
import { withAuth } from "next-auth/middleware";
import { getToken } from "next-auth/jwt";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
```

**New (v5):**
```typescript
import { auth } from "@/lib/auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
```

All authentication methods are now accessed through the unified `auth()` function.

### 2. Package Name Changes

**Old (v4):**
```bash
npm install next-auth @next-auth/prisma-adapter
```

**New (v5):**
```bash
npm install next-auth@beta @auth/prisma-adapter
```

**Key Changes:**
- `@next-auth/prisma-adapter` → `@auth/prisma-adapter` (actively maintained)
- `next-auth` package name remains the same, but install beta version

### 3. Configuration Structure

**Old (v4) - API Route Configuration:**
```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [...],
  // ...
};

export default NextAuth(authOptions);
```

**New (v5) - Central Configuration:**
```typescript
// src/lib/auth.ts (or src/auth.ts)
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      // ...
    }),
  ],
  // ...
});
```

**API Route (v5):**
```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

### 4. Session Access - Universal `auth()` Function

**Old (v4) - Multiple Methods:**
```typescript
// Server Component
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const session = await getServerSession(authOptions);

// API Route
import { getServerSession } from "next-auth/next";
const session = await getServerSession(req, res, authOptions);

// Client Component
import { useSession } from "next-auth/react";
const { data: session } = useSession();
```

**New (v5) - Universal Method:**
```typescript
// Server Component
import { auth } from "@/lib/auth";

const session = await auth();

// API Route
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  // ...
}

// Client Components: Pass session as prop from Server Component
// Or use SessionProvider (Pages Router only)
```

**Key Points:**
- `auth()` works everywhere (Server Components, API routes, Server Actions)
- No need to pass `req`, `res`, or `authOptions`
- Client components should receive session data as props from Server Components

### 5. Provider Field Handling

**Breaking Change:** Database adapters no longer automatically pass all provider fields.

**Old (v4):**
```typescript
// All provider fields automatically passed to adapter
```

**New (v5):**
```typescript
// Must manually pass fields in provider's account callback
OAuthProvider({
  // ...
  account(profile) {
    return {
      // Explicitly return fields you want stored
      access_token: profile.access_token,
      refresh_token: profile.refresh_token,
      // ...
    };
  },
});
```

### 6. OAuth 1.0 Deprecated

OAuth 1.0 support is removed. Migrate to OAuth 2.0 providers.

### 7. Stricter OAuth/OIDC Compliance

Some providers may break due to stricter spec compliance. Check provider-specific documentation.

## New Features

### Universal Authentication

The `auth()` function provides a consistent API across all contexts:

```typescript
import { auth } from "@/lib/auth";

// Returns session or null
const session = await auth();

if (session) {
  console.log(session.user.id);
  console.log(session.user.email);
}
```

### Improved TypeScript Support

Better type inference and type safety throughout:

```typescript
// Types are automatically inferred from your configuration
const session = await auth();
// session.user.id is properly typed
```

### Edge Runtime Support

Fully compatible with Edge Runtime for better performance:

```typescript
// Can be used in Edge Runtime contexts
export const runtime = 'edge';
```

### Simplified Setup

Configuration is centralized and environment variables are automatically inferred:

```typescript
// No need to manually pass AUTH_SECRET, AUTH_URL, etc.
// Automatically reads from environment
```

## Configuration Pattern

### Basic Setup

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcrypt";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
});
```

### API Route Handler

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

## Common Patterns

### Server Component Authentication

```typescript
// app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <div>Welcome, {session.user.email}</div>;
}
```

### Helper Function Pattern

```typescript
// src/lib/auth-utils.ts
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  return session;
}

export async function getCurrentUserId(): Promise<string> {
  const session = await requireAuth();
  return session.user.id;
}
```

### API Route Authentication

```typescript
// app/api/protected/route.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({ data: "Protected data" });
}
```

### Server Action Authentication

```typescript
// src/actions/user.ts
"use server";

import { auth } from "@/lib/auth";
import { signIn } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  return result;
}
```

### Layout Guard Pattern

```typescript
// app/(admin)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <>{children}</>;
}
```

## TypeScript Configuration

### Extending Session Types

```typescript
// src/types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
```

## Migration Guide

### Step 1: Update Dependencies

```bash
npm uninstall next-auth @next-auth/prisma-adapter
npm install next-auth@beta @auth/prisma-adapter
```

### Step 2: Create Central Configuration

Move configuration from API route to `src/lib/auth.ts`:

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
// ... configuration
export const { handlers, signIn, signOut, auth } = NextAuth({...});
```

### Step 3: Update API Route

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

### Step 4: Replace Session Access

**Find and replace:**
- `getServerSession(authOptions)` → `auth()`
- `getSession()` → `auth()` (in Server Components)
- `useSession()` → Pass session as prop (in Client Components)

### Step 5: Update Imports

**Find and replace:**
- `@next-auth/prisma-adapter` → `@auth/prisma-adapter`
- Remove imports from `next-auth/next`, `next-auth/middleware`, etc.

### Step 6: Update Provider Callbacks

If using OAuth providers, ensure `account` callback explicitly returns fields:

```typescript
OAuthProvider({
  account(profile) {
    return {
      access_token: profile.access_token,
      // ... other fields
    };
  },
});
```

## Environment Variables

NextAuth v5 automatically infers environment variables:

```bash
# Required
AUTH_SECRET=your-secret-key
AUTH_URL=http://localhost:3000

# Optional (auto-detected)
AUTH_TRUST_HOST=true
```

**Note:** No need to manually pass these to configuration—they're automatically read.

## Session Strategies

### JWT Strategy (Default)

```typescript
session: {
  strategy: "jwt",
},
```

### Database Strategy

```typescript
session: {
  strategy: "database",
},
```

Requires database adapter and session table.

## Project-Specific Notes

This project (Canopy Forms) currently:
- ✅ Using NextAuth v5 beta.30
- ✅ Using `@auth/prisma-adapter` (correct package)
- ✅ Configuration in `src/lib/auth.ts` (correct pattern)
- ✅ API route correctly re-exports handlers
- ✅ Using `auth()` function correctly
- ✅ Has helper functions (`requireAuth()`, `getCurrentUserId()`)
- ✅ TypeScript types properly extended
- ✅ Using JWT strategy with custom callbacks

## Troubleshooting

### "Cannot find module 'next-auth/next'"

**Cause:** Using v4 import paths in v5

**Solution:** Replace with `auth()` from your configuration file:
```typescript
import { auth } from "@/lib/auth";
```

### "getServerSession is not a function"

**Cause:** Using v4 API in v5

**Solution:** Use `auth()` instead:
```typescript
const session = await auth(); // Not getServerSession()
```

### "Provider fields not saving to database"

**Cause:** v5 requires explicit field passing in `account` callback

**Solution:** Explicitly return fields in provider's `account` callback

### Session is null in Server Component

**Possible Causes:**
- Not awaiting `auth()`
- Missing `AUTH_SECRET` environment variable
- Cookie issues (check domain/path settings)

**Solution:**
```typescript
const session = await auth(); // Make sure to await
```

## Resources

- **Official Documentation**: https://authjs.dev
- **Next.js Reference**: https://authjs.dev/reference/nextjs
- **Migration Guide**: https://authjs.dev/getting-started/migrating-to-v5
- **Prisma Adapter**: https://authjs.dev/reference/prisma-adapter
- **GitHub**: https://github.com/nextauthjs/next-auth

## Quick Reference

### Installation

```bash
npm install next-auth@beta @auth/prisma-adapter
```

### Basic Configuration

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [...],
});
```

### API Route

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

### Using Auth

```typescript
import { auth } from "@/lib/auth";
const session = await auth();
```

---

**For AI Agents:** If you encounter code using `getServerSession`, `getSession`, `withAuth`, or imports from `next-auth/next` or `next-auth/middleware`, these are outdated NextAuth v4 patterns. Replace with the universal `auth()` function from the central configuration file. The `@next-auth/prisma-adapter` package should be replaced with `@auth/prisma-adapter`.
