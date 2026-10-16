/**
 * In-memory sliding-window rate limiter. One container serves each
 * environment, so process memory is enough; counts reset when the container
 * restarts (every deploy).
 */

interface RateLimitEntry {
  timestamps: number[];
  windowMs: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Drops timestamps that have left their own key's window, and empty keys.
 * Pruning by a fixed age instead would quietly shorten any longer window.
 */
export function pruneRateLimits(now: number = Date.now()): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    entry.timestamps = entry.timestamps.filter((ts) => ts > now - entry.windowMs);
    if (entry.timestamps.length === 0) rateLimitStore.delete(key);
  }
}

setInterval(pruneRateLimits, 5 * 60 * 1000).unref?.();

/**
 * Records an attempt under `key` and reports whether it is over the limit:
 * true once `maxRequests` attempts have landed within `windowMs`. Attempts
 * over the limit are not recorded. Default: 10 per minute.
 */
export function isRateLimited(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000
): boolean {
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  if (!entry) {
    entry = { timestamps: [], windowMs };
    rateLimitStore.set(key, entry);
  }
  entry.windowMs = windowMs;
  entry.timestamps = entry.timestamps.filter((ts) => ts > now - windowMs);

  if (entry.timestamps.length >= maxRequests) {
    return true;
  }

  entry.timestamps.push(now);
  return false;
}

/** Forgets a key's attempts, e.g. a sign-in counter after a success. */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/** Test helper: forget everything. */
export function resetRateLimits(): void {
  rateLimitStore.clear();
}
