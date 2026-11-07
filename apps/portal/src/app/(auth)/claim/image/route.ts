import type { NextRequest } from "next/server";
import { claimPreview, readClaim } from "@/lib/claim";
import { claimImage } from "@/lib/claim-image";
import { getHostProduct, productNameFor } from "@/lib/product";

/** Drawn pictures by the name on the tag: a handful of site names, so a bad link's retries cost no drawing. */
const drawn = new Map<string, Promise<ArrayBuffer>>();
const MAX_DRAWN = 50;

/**
 * The picture in a claim link's preview (the claim page's og:image). Reading
 * the link consumes nothing, as on the page; a link that isn't ready gets the
 * product's name on the tag.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const productName = productNameFor({ sitesEnabled: (await getHostProduct()) === "sites" });
  const { tag } = claimPreview(await readClaim(token), productName);

  let png = drawn.get(tag);
  if (!png) {
    png = claimImage(tag).then((res) => res.arrayBuffer());
    png.catch(() => drawn.delete(tag));
    if (drawn.size >= MAX_DRAWN) drawn.delete(drawn.keys().next().value!);
    drawn.set(tag, png);
  }
  return new Response(await png, {
    headers: {
      "content-type": "image/png",
      // The link's token is in this URL: keep it out of shared caches.
      "cache-control": "private, no-store",
    },
  });
}
