/**
 * Simple in-memory rate limiter
 * For production, consider Redis or a proper rate limiting service
 */

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  for (const [key, entry] of rateLimitStore.entries()) {
    // Remove timestamps older than 5 minutes
    entry.timestamps = entry.timestamps.filter((ts) => ts > fiveMinutesAgo);

    // Remove entry if no timestamps left
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if the IP has exceeded rate limit
 * Default: 10 submissions per minute
 */
export function isRateLimited(
  ipHash: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000 // 1 minute
): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = rateLimitStore.get(ipHash);

  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(ipHash, entry);
  }

  // Remove old timestamps outside the window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  // Check if rate limit exceeded
  if (entry.timestamps.length >= maxRequests) {
    return true;
  }

  // Add current timestamp
  entry.timestamps.push(now);

  return false;
}
