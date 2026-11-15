import { getSession } from "@/lib/session";
import { hostFromHeaders } from "@/lib/product";
import { isSitesTab } from "@/lib/sites-tabs";
import { storeWelcomeVideo } from "@/lib/welcome-video";
import { CAPTIONS_LENGTH_HEADER, WELCOME_UPLOAD_ERRORS, WELCOME_UPLOAD_MAX_BYTES } from "@/lib/welcome-video-limits";

/**
 * The operator's upload of a site's welcome video for one tab (ROADMAP
 * E39), from the card on the site's page. The body is the captions file and
 * then the MP4,
 * with the captions' length in a header, so the video streams to the disk
 * and nothing has to hold a hundred megabytes in memory to split a form.
 *
 * A Global Admin only. It answers a refusal itself where a page would
 * redirect to the sign-in page: a redirect would have the browser send the
 * whole body again. A route handler gets none of a server action's origin
 * check, and the session cookie goes with any request from a canopyds.com
 * page, so only this portal's own pages may post here.
 */

function answer(status: number, body: { ok: true } | { error: string }) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string; tab: string }> }) {
  const { siteId, tab } = await params;
  const session = await getSession();
  if (session?.user.role !== "GLOBAL_ADMIN") return answer(403, { error: "Sign in as an operator" });

  const origin = request.headers.get("origin");
  if (!origin || !URL.canParse(origin) || new URL(origin).host !== hostFromHeaders(request.headers)) {
    return answer(403, { error: "Upload from the site's page" });
  }
  // Before any of it is read. A request that leaves its length out is counted as it arrives.
  if (Number(request.headers.get("content-length")) > WELCOME_UPLOAD_MAX_BYTES) {
    return answer(413, { error: WELCOME_UPLOAD_ERRORS.size });
  }
  if (!isSitesTab(tab)) return answer(404, { error: "No such tab" });
  if (!request.body) return answer(400, { error: WELCOME_UPLOAD_ERRORS.video });

  const stored = await storeWelcomeVideo(siteId, tab, request.body, Number(request.headers.get(CAPTIONS_LENGTH_HEADER)));
  return "error" in stored ? answer(stored.status, { error: stored.error }) : answer(200, { ok: true });
}
