import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { fetchSiteFile } from "@/lib/builder-client";
import { canPreviewSite } from "@/lib/site-tools";
import { EDITOR_BRIDGE } from "../editor-bridge";

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
 *
 * The Editor's canvas (Epic 33) fetches pages with ?canopy_editor=1: a member
 * of the demo account gets the draft's build, with the editor bridge and a
 * <base> injected, which the Editor shows in a sandboxed srcdoc frame. The
 * canvas's own requests carry no session, so a fingerprinted asset (_astro/)
 * missing from the view asked for is served from the other view.
 */

const DEMO_SLUG = "demo";
const PREVIEW_COOKIE = "canopy_demo_preview";
const SECURE = (process.env.NEXTAUTH_URL ?? "").startsWith("https://");

// The whole CSP for /demo: next.config leaves this path to the route.
const SANDBOX = "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms";
const CSP = `${SANDBOX}; frame-ancestors 'none'`;
const EDITOR_PARAM = "canopy_editor";
const EDITOR_FLAG = `<script>document.documentElement.setAttribute("data-canopy-editor","")</script>`;
const isNotBuilt = (res: Response) => res.status === 404 && Boolean(res.headers.get("content-type")?.includes("application/json"));

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
    + `<a href="/quick-edit" style="color:#fff;text-decoration:underline">Back to Quick Edit</a>`
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
    // Relative redirects only: the request's own URL carries the container's
    // address behind the proxy (AGENT_CONTEXT section 2).
    if (on && !(await mayPreview(site.id))) return new NextResponse(null, { status: 303, headers: { Location: "/login" } });
    const res = new NextResponse(null, { status: 303, headers: { Location: "/demo" } });
    res.cookies.set(PREVIEW_COOKIE, on ? "1" : "", {
      httpOnly: true,
      secure: SECURE,
      sameSite: "lax",
      path: "/demo",
      maxAge: on ? 60 * 60 * 24 : 0,
    });
    return res;
  }

  const url = new URL(request.url);
  const editor = url.searchParams.get(EDITOR_PARAM) === "1";
  if (editor && !(await mayPreview(site.id))) return new NextResponse("Not found", { status: 404 });
  const jar = await cookies();
  const preview = editor || (Boolean(jar.get(PREVIEW_COOKIE)?.value) && (await mayPreview(site.id)));
  const file = path.join("/");
  let upstream = await fetchSiteFile(site.slug, preview ? "preview" : "current", file);
  if (preview && isNotBuilt(upstream)) {
    // No preview build yet: show the live site.
    upstream = await fetchSiteFile(site.slug, "current", file);
  } else if (upstream.status === 404 && path[0] === "_astro") {
    // A fingerprinted asset only the other build has: the canvas's requests carry no session.
    const other = await fetchSiteFile(site.slug, preview ? "current" : "preview", file);
    if (other.ok) upstream = other;
  }

  const headers = new Headers({
    "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
    "Content-Security-Policy": CSP,
    "X-Frame-Options": "DENY",
    "Access-Control-Allow-Origin": "*",
    "X-Robots-Tag": "noindex, nofollow",
    "Cache-Control": preview ? "no-store" : (upstream.headers.get("cache-control") ?? "no-cache"),
  });
  if (isNotBuilt(upstream)) {
    headers.set("Content-Type", "text/plain; charset=utf-8");
    return new NextResponse("This demo site hasn't been published yet.", { status: 404, headers });
  }
  if (editor && headers.get("Content-Type")?.startsWith("text/html")) {
    // Relative URLs resolve against the page's real address, not the Editor's.
    const head = `<base href="${url.pathname.replace(/"/g, "")}">${EDITOR_FLAG}`;
    let html = await upstream.text();
    html = /<head(\s[^>]*)?>/i.test(html) ? html.replace(/<head(\s[^>]*)?>/i, (m) => m + head) : head + html;
    html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${EDITOR_BRIDGE}</body>`) : html + EDITOR_BRIDGE;
    return new NextResponse(html, { status: upstream.status, headers });
  }
  if (preview && headers.get("Content-Type")?.startsWith("text/html")) {
    const html = await upstream.text();
    const withBar = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${previewBar()}</body>`) : html + previewBar();
    return new NextResponse(withBar, { status: upstream.status, headers });
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
