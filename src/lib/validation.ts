import * as crypto from "crypto";

/**
 * Validate that the origin matches the allowed domain
 * Handles apex and www variants, case-insensitive
 */
export function validateOrigin(
  origin: string | null,
  allowedDomain: string
): boolean {
  if (!origin) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    const originHostname = originUrl.hostname.toLowerCase();
    const allowedLower = allowedDomain.toLowerCase();

    // Exact match
    if (originHostname === allowedLower) {
      return true;
    }

    // www variant
    if (originHostname === `www.${allowedLower}`) {
      return true;
    }

    // Apex variant (if origin has www, check without it)
    if (originHostname.startsWith("www.")) {
      const withoutWww = originHostname.substring(4);
      if (withoutWww === allowedLower) {
        return true;
      }
    }

    // Allow if domain matches www variant
    if (allowedLower.startsWith("www.")) {
      const withoutWww = allowedLower.substring(4);
      if (originHostname === withoutWww) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Hash an IP address using SHA-256
 * Never store raw IPs for privacy
 */
export function hashIP(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

/**
 * Extract client IP from request headers
 * Checks X-Forwarded-For, X-Real-IP, and falls back to remote address
 */
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP if there are multiple
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to a placeholder if we can't determine IP
  // In production behind a reverse proxy, this shouldn't happen
  return "unknown";
}
