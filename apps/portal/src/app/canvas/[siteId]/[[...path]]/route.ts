import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { builderConfigured, fetchSiteFile } from "@/lib/builder-client";
import { draftBuildIds, previewableSite } from "@/lib/site-tools";
import { canvasBridge } from "@/lib/canvas-bridge";
import { liveSite, liveUrl } from "@/lib/site-live";

/**
 * A page of a site as the Editor's canvas and the preview page show it (PRD
 * D43, D47), for members of the site's account only (404 for anyone else).
 * With a draft pending, the newest build of the draft; with none, the live
 * page (the demo's published build; a client site's page fetched from its
 * production hostname, which a Canopy push may have changed before the
 * builder's own copy).
 *
 * The page's styles, fonts, and scripts load from where the site is live,
 * through a `<base>` at the page's live address; the canvas's own requests
 * carry no session. `?view=preview` injects the bridge in view mode (no
 * marks) for the preview page, else the canvas's edit mode. The portal
 * fetches this HTML with the session and shows it in a sandboxed srcdoc
 * frame; a direct visit still gets the sandbox CSP, so site HTML never runs
 * with the portal's origin. `X-Canopy-Build` names the draft build shown, so
 * the preview page can publish exactly that build.
 */

const SANDBOX = "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms";
const isHtml = (res: Response) => Boolean(res.headers.get("content-type")?.startsWith("text/html"));
const escapeAttr = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function headers(build: string | null) {
  return new Headers({
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": `${SANDBOX}; frame-ancestors 'none'`,
    "X-Frame-Options": "DENY",
    "X-Robots-Tag": "noindex, nofollow",
    "Cache-Control": "no-store",
    ...(build ? { "X-Canopy-Build": build } : {}),
  });
}

const notFound = () => new NextResponse("Not found", { status: 404, headers: headers(null) });

export async function GET(request: Request, { params }: { params: Promise<{ siteId: string; path?: string[] }> }) {
  const { siteId, path = [] } = await params;
  const session = await getSession();
  const site = session && builderConfigured() ? await previewableSite(session.user.id, siteId) : null;
  const live = site ? liveSite(site) : null;
  if (!site || !live) return notFound();

  const mode = new URL(request.url).searchParams.get("view") === "preview" ? "view" : "edit";
  const file = path.join("/");
  const page = `/${file}`;

  let html: string | null = null;
  let status = 200;
  let build: string | null = null;
  const drafts = await draftBuildIds(site.id);
  if (drafts) {
    // The builder's preview is the newest successful build of any change; show it only if it is this draft's.
    const res = await fetchSiteFile(site.slug, "preview", file);
    const served = res.headers.get("x-canopy-build");
    if (res.ok && isHtml(res) && served && drafts.includes(served)) {
      html = await res.text();
      build = served;
    }
  }
  if (html === null) {
    const res = site.isDemo
      ? await fetchSiteFile(site.slug, "current", file)
      : await fetch(liveUrl(live, page), { cache: "no-store", signal: AbortSignal.timeout(20_000) }).catch(() => null);
    if (!res || !isHtml(res) || (!res.ok && res.status !== 404)) {
      return new NextResponse("This page couldn't be loaded.", { status: 502, headers: headers(null) });
    }
    status = res.status;
    html = await res.text();
  }

  const flag = mode === "edit" ? "data-canopy-editor" : "data-canopy-preview";
  const head = `<base href="${escapeAttr(liveUrl(live, page))}"><script>document.documentElement.setAttribute("${flag}","")</script>`;
  const bridge = canvasBridge(mode);
  html = /<head(\s[^>]*)?>/i.test(html) ? html.replace(/<head(\s[^>]*)?>/i, (m) => m + head) : head + html;
  html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, (m) => bridge + m) : html + bridge;
  return new NextResponse(html, { status, headers: headers(build) });
}
