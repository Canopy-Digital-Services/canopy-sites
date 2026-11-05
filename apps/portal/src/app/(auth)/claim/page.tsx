// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import type { Metadata } from "next";
import { readClaim } from "@/lib/claim";
import { ClaimForm, ClaimProblem } from "./claim-form";

export const dynamic = "force-dynamic";
// The token is in the URL: never index the page or send it onward.
export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };

/**
 * Claiming an account the operator linked (PRD D49): the site's name, the
 * owner's email, and a password to set. Opening it consumes nothing.
 */
export default async function ClaimPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const raw = (await searchParams).token;
  const token = typeof raw === "string" ? raw : "";
  const claim = await readClaim(token);

  if (claim.state === "ready") return <ClaimForm token={token} email={claim.email} siteName={claim.siteName} />;
  return <ClaimProblem state={claim.state} token={token} />;
}
