// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { cache } from "react";
import type { Metadata } from "next";
import { claimPreview, readClaim } from "@/lib/claim";
import { CLAIM_IMAGE_SIZE } from "@/lib/claim-image";
import { appUrlFor, getHostProduct, productNameFor } from "@/lib/product";
import { ClaimForm, ClaimProblem } from "./claim-form";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ token?: string | string[] }> };

const tokenOf = async (searchParams: Props["searchParams"]) => {
  const raw = (await searchParams).token;
  return typeof raw === "string" ? raw : "";
};
const readClaimOnce = cache(readClaim);

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sitesEnabled = (await getHostProduct()) === "sites";
  const productName = productNameFor({ sitesEnabled });
  const preview = claimPreview(await readClaimOnce(await tokenOf(searchParams)), productName);
  const { title, description } = preview;
  // From configuration, never the request's host, like every link the portal hands out.
  const image = { url: `${appUrlFor({ sitesEnabled })}/claim/image/${preview.image}`, ...CLAIM_IMAGE_SIZE, type: "image/jpeg", alt: title };
  return {
    title,
    description,
    openGraph: { title, description, siteName: productName, type: "website", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    // The token is in the URL: never index the page or send it onward.
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

/**
 * Claiming an account the operator linked (PRD D49): the site's name, the
 * owner's email, and a password to set. Opening it consumes nothing.
 */
export default async function ClaimPage({ searchParams }: Props) {
  const token = await tokenOf(searchParams);
  const claim = await readClaimOnce(token);

  if (claim.state === "ready") return <ClaimForm token={token} email={claim.email} siteName={claim.siteName} />;
  return <ClaimProblem state={claim.state} token={token} />;
}
