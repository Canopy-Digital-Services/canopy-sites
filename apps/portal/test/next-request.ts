/**
 * Stand-in for `next/headers` in tests, so server actions and the session
 * layer run for real against a cookie jar the test can read and fill:
 *
 *   vi.mock("next/headers", () => import("../../test/next-request"));
 *
 * `signInAs` creates a real session row and puts its token in the jar.
 */

type StoredCookie = { name: string; value: string; options: Record<string, unknown> };

export const jar = new Map<string, StoredCookie>();
export const requestHeaders = new Map<string, string>();

export function resetRequest() {
  jar.clear();
  requestHeaders.clear();
}

export async function cookies() {
  return {
    get: (name: string) => jar.get(name),
    getAll: () => [...jar.values()],
    has: (name: string) => jar.has(name),
    set: (name: string, value: string, options: Record<string, unknown> = {}) => {
      if (options.maxAge === 0) jar.delete(name);
      else jar.set(name, { name, value, options });
    },
    delete: (name: string) => jar.delete(name),
  };
}

export async function headers() {
  return {
    get: (name: string) => requestHeaders.get(name.toLowerCase()) ?? null,
    has: (name: string) => requestHeaders.has(name.toLowerCase()),
  };
}

export async function signInAs(userId: string, rememberMe = false) {
  // Imported here, not at the top: the session module imports next/headers,
  // which tests mock with this file, and a static import would load in a cycle.
  const { createSession, SESSION_COOKIE } = await import("@/lib/session");
  const { token, session } = await createSession(userId, rememberMe);
  jar.set(SESSION_COOKIE, { name: SESSION_COOKIE, value: token, options: {} });
  return { token, session };
}
