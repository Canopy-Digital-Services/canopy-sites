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
 * Cloudflare caches `.mp4` by its extension, so what this sends decides who
 * else could be handed the file: `private` keeps a video out of the shared
 * cache, and `no-store` keeps a 404 from being cached and then served to the
 * person who may see it. Byte ranges let the player seek.
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
