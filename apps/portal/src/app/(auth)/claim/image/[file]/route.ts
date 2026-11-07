import { prisma } from "@/lib/db";
import { claimImageJpeg } from "@/lib/claim-image";

/** Drawn pictures by the name on the tag: a handful of site names, so a crawler's retries cost no drawing. */
const drawn = new Map<string, Promise<Buffer>>();
const MAX_DRAWN = 50;

const PRODUCTS: Record<string, string> = { "canopy-sites.jpg": "Canopy Sites", "canopy-forms.jpg": "Canopy Forms" };

/**
 * The picture in a claim link's preview (the claim page's og:image), named as
 * `claimPreview` names it: `<site id>-<name hash>.jpg`, or the product's for a
 * link that isn't ready. It shows only the site's name, which its website
 * already does, so it carries no token and Cloudflare caches it.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  let name: string | null = PRODUCTS[file] ?? null;
  const siteFile = /^([a-z0-9]+)-[0-9a-f]{8}\.jpg$/.exec(file);
  if (!name && siteFile) {
    const site = await prisma.site.findUnique({ where: { id: siteFile[1] }, select: { name: true } });
    name = site?.name ?? null;
  }
  if (!name) return new Response("Not found", { status: 404 });

  let jpeg = drawn.get(name);
  if (!jpeg) {
    jpeg = claimImageJpeg(name);
    jpeg.catch(() => drawn.delete(name));
    if (drawn.size >= MAX_DRAWN) drawn.delete(drawn.keys().next().value!);
    drawn.set(name, jpeg);
  }
  const body = await jpeg;
  return new Response(new Uint8Array(body), {
    headers: {
      "content-type": "image/jpeg",
      "content-length": String(body.length),
      // The name's hash is in the file name, so a renamed site gets a new picture.
      "cache-control": "public, max-age=604800, immutable",
    },
  });
}
