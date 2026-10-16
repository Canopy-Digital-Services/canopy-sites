import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { fetchSiteFile } from "@/lib/builder-client";
import { canPreviewSite } from "@/lib/site-tools";

/**
 * The demo site at /demo (PRD D23), served from the builder's output. A
 * signed-in member of the demo account who has switched preview on sees the
 * preview build, with a bar to leave it; everyone else sees the published
 * build.
 *
 * The pages are client-editable content on the portal's own origin, so they
 * are served sandboxed: an opaque origin, which can't read or act with the
 * portal session even if a page carried script. Module scripts and fonts then
 * load cross-origin, hence the CORS header on these public files.
 */

const DEMO_SLUG = "demo";
const PREVIEW_COOKIE = "canopy_demo_preview";
const SECURE = (process.env.NEXTAUTH_URL ?? "").startsWith("https://");

const SANDBOX = "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms";

async function demoSite() {
  const site = await prisma.site.findUnique({ where: { slug: DEMO_SLUG }, select: { id: true, slug: true, isDemo: true } });
  return site?.isDemo ? site : null;
}

async function mayPreview(siteId: string) {
  const session = await getSession();
  return Boolean(session && (await canPreviewSite(session.user.id, siteId)));
}

function previewBar(): string {
  return `<div style="position:fixed;left:0;right:0;bottom:0;z-index:2147483647;display:flex;flex-wrap:wrap;gap:8px 20px;align-items:center;justify-content:center;padding:10px 16px;background:#005f6a;color:#fff;font:500 14px/1.4 system-ui,sans-serif;box-shadow:0 -2px 12px rgba(0,0,0,.2)">`
    + `<span>Previewing unpublished changes</span>`
    + `<a href="/editor" style="color:#fff;text-decoration:underline">Back to Editor</a>`
    + `<a href="/demo/__canopy/preview?state=off" style="color:#fff;text-decoration:underline">Exit preview</a>`
    + `</div>`;
}

export async function GET(request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  const site = await demoSite();
  if (!site) return new NextResponse("Not found", { status: 404 });

  // /demo/__canopy/preview?state=on|off switches the viewer's preview mode.
  if (path[0] === "__canopy" && path[1] === "preview") {
    const on = new URL(request.url).searchParams.get("state") !== "off";
    if (on && !(await mayPreview(site.id))) return NextResponse.redirect(new URL("/login", request.url), 303);
    const res = NextResponse.redirect(new URL("/demo", request.url), 303);
    res.cookies.set(PREVIEW_COOKIE, on ? "1" : "", {
      httpOnly: true,
      secure: SECURE,
      sameSite: "lax",
      path: "/demo",
      maxAge: on ? 60 * 60 * 24 : 0,
    });
    return res;
  }

  const jar = await cookies();
  const preview = Boolean(jar.get(PREVIEW_COOKIE)?.value) && (await mayPreview(site.id));
  let upstream = await fetchSiteFile(site.slug, preview ? "preview" : "current", path.join("/"));
  if (preview && upstream.status === 404 && upstream.headers.get("content-type")?.includes("application/json")) {
    // No preview build yet: show the live site.
    upstream = await fetchSiteFile(site.slug, "current", path.join("/"));
  }

  const headers = new Headers({
    "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
    "Content-Security-Policy": SANDBOX,
    "Access-Control-Allow-Origin": "*",
    "X-Robots-Tag": "noindex, nofollow",
    "Cache-Control": preview ? "no-store" : (upstream.headers.get("cache-control") ?? "no-cache"),
  });
  if (upstream.status === 404 && upstream.headers.get("content-type")?.includes("application/json")) {
    return new NextResponse("This demo site hasn't been published yet.", { status: 404, headers: { "Content-Type": "text/plain" } });
  }
  if (preview && headers.get("Content-Type")?.startsWith("text/html")) {
    const html = await upstream.text();
    const withBar = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${previewBar()}</body>`) : html + previewBar();
    return new NextResponse(withBar, { status: upstream.status, headers });
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
