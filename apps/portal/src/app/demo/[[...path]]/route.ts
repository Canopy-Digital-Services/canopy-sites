import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchSiteFile } from "@/lib/builder-client";

/**
 * The demo site at /demo (PRD D23), served from the builder's published
 * build. Its drafts are seen on the Editor's canvas and the preview page,
 * which come from /canvas and load the demo's assets from here (PRD D47).
 *
 * The pages are client-editable content on the portal's own origin, so they
 * are served sandboxed: an opaque origin, which can't read or act with the
 * portal session even if a page carried script. Module scripts and fonts then
 * load cross-origin, hence the CORS header on these public files. The
 * canvas's requests carry no session, so a fingerprinted asset (_astro/)
 * only the draft's build has is served from it.
 */

const DEMO_SLUG = "demo";

// The whole CSP for /demo: next.config leaves this path to the route.
const SANDBOX = "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms";
const CSP = `${SANDBOX}; frame-ancestors 'none'`;
const isNotBuilt = (res: Response) => res.status === 404 && Boolean(res.headers.get("content-type")?.includes("application/json"));

async function demoSite() {
  const site = await prisma.site.findUnique({ where: { slug: DEMO_SLUG }, select: { id: true, slug: true, isDemo: true } });
  return site?.isDemo ? site : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  const site = await demoSite();
  if (!site) return new NextResponse("Not found", { status: 404 });

  const file = path.join("/");
  let upstream = await fetchSiteFile(site.slug, "current", file);
  if (upstream.status === 404 && path[0] === "_astro") {
    // A fingerprinted asset only the draft's build has, for the canvas and the preview page.
    const draft = await fetchSiteFile(site.slug, "preview", file);
    if (draft.ok) upstream = draft;
  }

  const headers = new Headers({
    "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
    "Content-Security-Policy": CSP,
    "X-Frame-Options": "DENY",
    "Access-Control-Allow-Origin": "*",
    "X-Robots-Tag": "noindex, nofollow",
    "Cache-Control": upstream.headers.get("cache-control") ?? "no-cache",
  });
  if (isNotBuilt(upstream)) {
    headers.set("Content-Type", "text/plain; charset=utf-8");
    return new NextResponse("This demo site hasn't been published yet.", { status: 404, headers });
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
