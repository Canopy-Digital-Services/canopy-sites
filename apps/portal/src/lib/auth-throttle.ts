/**
 * Throttles for the credential endpoints (Epic 28 F5). Keys are a hashed
 * client IP (see clientIPFromHeaders) and the normalized email or user id.
 * The per-email limit applies whether or not the email is registered, so it
 * reveals nothing about which accounts exist. A throttled attempt is refused
 * before any password check.
 */

import { headers } from "next/headers";
import { clearRateLimit, isRateLimited } from "@/lib/rate-limit";
import { clientIPFromHeaders, hashIP } from "@/lib/validation";

const MINUTE = 60 * 1000;

export const AUTH_LIMITS = {
  signInPerEmail: { max: 5, windowMs: 15 * MINUTE },
  signInPerIP: { max: 20, windowMs: 15 * MINUTE },
  signUpPerIP: { max: 5, windowMs: 60 * MINUTE },
  resetRequestPerEmail: { max: 3, windowMs: 60 * MINUTE },
  resetRequestPerIP: { max: 10, windowMs: 60 * MINUTE },
  passwordChangePerUser: { max: 5, windowMs: 15 * MINUTE },
} as const;

export const THROTTLED_MESSAGE = "Too many attempts. Wait 15 minutes and try again.";

async function ipKey(): Promise<string> {
  return hashIP(clientIPFromHeaders(await headers()));
}

/** Both counters advance on every check (no short-circuit), so neither can be probed for free. */
function overAny(...checks: boolean[]): boolean {
  return checks.some(Boolean);
}

export async function signInThrottled(email: string): Promise<boolean> {
  const ip = await ipKey();
  return overAny(
    isRateLimited(`signin:ip:${ip}`, AUTH_LIMITS.signInPerIP.max, AUTH_LIMITS.signInPerIP.windowMs),
    isRateLimited(`signin:email:${email}`, AUTH_LIMITS.signInPerEmail.max, AUTH_LIMITS.signInPerEmail.windowMs)
  );
}

/** After a successful sign-in only failures should count toward the per-email limit. */
export function clearSignInThrottle(email: string): void {
  clearRateLimit(`signin:email:${email}`);
}

export async function signUpThrottled(): Promise<boolean> {
  const ip = await ipKey();
  return isRateLimited(`signup:ip:${ip}`, AUTH_LIMITS.signUpPerIP.max, AUTH_LIMITS.signUpPerIP.windowMs);
}

export async function resetRequestThrottled(email: string): Promise<boolean> {
  const ip = await ipKey();
  return overAny(
    isRateLimited(`reset:ip:${ip}`, AUTH_LIMITS.resetRequestPerIP.max, AUTH_LIMITS.resetRequestPerIP.windowMs),
    isRateLimited(`reset:email:${email}`, AUTH_LIMITS.resetRequestPerEmail.max, AUTH_LIMITS.resetRequestPerEmail.windowMs)
  );
}

/** Guards the current-password check, so a stolen session cannot guess its way to the password. */
export function passwordChangeThrottled(userId: string): boolean {
  return isRateLimited(
    `pwchange:user:${userId}`,
    AUTH_LIMITS.passwordChangePerUser.max,
    AUTH_LIMITS.passwordChangePerUser.windowMs
  );
}

export function clearPasswordChangeThrottle(userId: string): void {
  clearRateLimit(`pwchange:user:${userId}`);
}
