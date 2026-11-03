import * as crypto from "crypto";

/** The request's Origin, else the Referer's origin: browsers don't send Origin on every same-origin request. */
function sourceOrigin(origin: string | null, referer?: string | null): string | null {
  if (origin) return origin;
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

/**
 * Validate that the origin matches one of the allowed domains
 * Handles apex and www variants, case-insensitive
 */
export function validateOrigin(
  origin: string | null,
  allowedOrigins: string[],
  referer?: string | null
): boolean {
  const effectiveOrigin = sourceOrigin(origin, referer);
  if (!effectiveOrigin) {
    return false;
  }

  try {
    const originUrl = new URL(effectiveOrigin);
    const originHostname = originUrl.hostname.toLowerCase();

    // Allow localhost for development/preview
    if (
      originHostname === "localhost" ||
      originHostname === "127.0.0.1" ||
      originHostname === "[::1]"
    ) {
      return true;
    }

    // Allow if it matches the dashboard's own domain (for previews)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      try {
        const dashboardHostname = new URL(appUrl).hostname.toLowerCase();
        if (originHostname === dashboardHostname) {
          return true;
        }
      } catch {
        // Ignore invalid URL in env var
      }
    }

    // Check against each allowed origin
    for (const allowedDomain of allowedOrigins) {
      const allowedLower = allowedDomain.toLowerCase();

      // Exact match
      if (originHostname === allowedLower) {
        return true;
      }

      // Match subdomains (e.g., cdn.example.com matches example.com)
      if (originHostname.endsWith(`.${allowedLower}`)) {
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
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Whether a request comes from the portal's own pages (NEXT_PUBLIC_APP_URL),
 * as a hosted form's page does. The whole origin must match: localhost on
 * another port is some other site.
 */
export function isAppOrigin(origin: string | null, referer?: string | null): boolean {
  const source = sourceOrigin(origin, referer);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!source || !appUrl) return false;
  try {
    return new URL(source).origin === new URL(appUrl).origin;
  } catch {
    return false;
  }
}

// The address check the embed runs on an Email field, so every email the app
// accepts passes the same one.
export { isValidEmail } from "../../embed/src/validation";

/**
 * Canonical form for account emails. Stored emails are lowercase, so every
 * lookup and insert goes through this to keep matching case-insensitive.
 */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Hash an IP address using SHA-256
 * Never store raw IPs for privacy
 */
export function hashIP(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

/**
 * The client's IP. Prefers CF-Connecting-IP, which Cloudflare sets at the
 * edge: the origin is reachable only through the Cloudflare tunnel (no public
 * ports), so a client cannot supply its own. The first X-Forwarded-For entry
 * is whatever the client sent, so it only serves local dev, where no
 * Cloudflare header exists. Rate limits key on this, so never put a
 * client-controlled header first.
 */
export function clientIPFromHeaders(headers: { get(name: string): string | null }): string {
  const cloudflare = headers.get("cf-connecting-ip")?.trim();
  if (cloudflare) return cloudflare;

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIP = headers.get("x-real-ip");
  if (realIP) return realIP;

  return "unknown";
}

/** `clientIPFromHeaders` for route handlers that hold the Request. */
export function getClientIP(request: Request): string {
  return clientIPFromHeaders(request.headers);
}
