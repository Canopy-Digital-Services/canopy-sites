"use server";

/**
 * The claim page's actions (PRD D49, Epic 38 section 4.4): setting the
 * owner's first password from a claim link, and sending a new link when that
 * one has expired. Signed out; the token is the credential.
 */

import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth-utils";
import { passwordProblem } from "@/lib/password-policy";
import { createSession, setSessionCookie } from "@/lib/session";
import { claimThrottled, resetRequestThrottled, THROTTLED_MESSAGE } from "@/lib/auth-throttle";
import { ClaimError, consumeClaim, createClaimLink } from "@/lib/claim";

/** Sets the password, signs the owner in to stay signed in, and leaves navigation home to the page. */
export async function claimAccount(input: { token: string; password: string }): Promise<{ success: true } | { error: string }> {
  const token = String(input.token ?? "");
  const password = String(input.password ?? "");
  if (!token) return { error: "This link isn't valid." };

  const problem = passwordProblem(password);
  if (problem) return { error: problem };
  if (await claimThrottled()) return { error: THROTTLED_MESSAGE };

  let userId: string;
  try {
    ({ userId } = await consumeClaim(token, password));
  } catch (err) {
    if (err instanceof ClaimError) return { error: err.message };
    throw err;
  }

  // The owner claimed on their own device: keep them signed in there.
  const { token: sessionToken, session } = await createSession(userId, true);
  await setSessionCookie(sessionToken, session.rememberMe, session.absoluteExpiresAt);
  console.log(JSON.stringify({ event: "claimAccount", userId, at: new Date().toISOString() }));
  return { success: true };
}

/**
 * A fresh claim link, emailed to the address the expired one was for. The
 * old link proves it reached that inbox, so nothing new is revealed; the
 * reset throttle caps how often an inbox gets one.
 */
export async function resendClaimLink(token: string): Promise<{ success: true; message: string } | { error: string }> {
  const row = token
    ? await prisma.passwordToken.findUnique({
        where: { tokenHash: hashToken(String(token)) },
        select: { purpose: true, user: { select: { id: true, email: true, password: true } } },
      })
    : null;
  if (!row || row.purpose !== "CLAIM") return { error: "This link isn't valid." };
  if (row.user.password !== null) return { error: "This account is already set up. Sign in instead." };

  const sent = { success: true as const, message: `A new link is on its way to ${row.user.email}.` };
  if (await resetRequestThrottled(row.user.email)) return sent;
  const { emailed } = await createClaimLink(row.user.id, { email: true });
  return emailed ? sent : { error: "The email didn't go out. Ask Michael for a new link." };
}
