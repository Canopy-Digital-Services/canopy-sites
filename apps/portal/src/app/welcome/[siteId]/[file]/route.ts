import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { getSession } from "@/lib/session";
import { parseRange } from "@/lib/byte-range";
import { welcomeFile } from "@/lib/welcome-video";

/**
 * A site's welcome video and its captions (ROADMAP E39), for the people on
 * the site's account and an operator acting as it; a 404 for anyone else, a
 * name that isn't the site's current key, and a signed-out request.
 *
 * Its addresses end in no file extension (src/lib/welcome-video.ts says
 * why), so Cloudflare never treats one as cacheable and passes the player's
 * byte ranges through, which is how it seeks. The headers still say what may
 * be kept, should that change: `private` keeps a video out of any shared
 * cache, and `no-store` keeps a 404 from being cached and then served to the
 * person who may see it.
 */

function notFound() {
  return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request, { params }: { params: Promise<{ siteId: string; file: string }> }) {
  const { siteId, file } = await params;
  const session = await getSession();
  const found = session ? await welcomeFile(session, siteId, file) : null;
  if (!found) return notFound();

  const headers = new Headers({
    "Content-Type": found.type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private",
    "X-Robots-Tag": "noindex, nofollow",
  });
  const range = parseRange(request.headers.get("range"), found.size);
  if (range === "unsatisfiable") {
    headers.set("Content-Range", `bytes */${found.size}`);
    return new Response(null, { status: 416, headers });
  }
  const { start, end } = range ?? { start: 0, end: found.size - 1 };
  headers.set("Content-Length", String(end - start + 1));
  if (range) headers.set("Content-Range", `bytes ${start}-${end}/${found.size}`);
  if (found.size === 0) return new Response(null, { status: 200, headers });

  // A seek abandons the request it replaces; cancelling the web stream closes the file.
  const body = Readable.toWeb(createReadStream(found.path, { start, end })) as ReadableStream<Uint8Array>;
  return new Response(body, { status: range ? 206 : 200, headers });
}
