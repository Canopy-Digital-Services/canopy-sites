import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import type { ServerResponse } from "node:http";
import path from "node:path";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webmanifest": "application/manifest+json",
};

async function isFile(p: string) {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

/**
 * Finds the file for a request path inside a build, the way a static host
 * would: exact file, then directory index, then `.html`. Anything resolving
 * outside the build (through `..` or a symlink) is treated as missing.
 */
export async function resolveFile(root: string, urlPath: string): Promise<string | null> {
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;
  const realRoot = await realpath(root);
  const base = path.resolve(realRoot, "." + path.posix.normalize("/" + decoded));
  const candidates = decoded.endsWith("/") ? [path.join(base, "index.html")] : [base, path.join(base, "index.html"), `${base}.html`];
  for (const c of candidates) {
    if (!(await isFile(c))) continue;
    const real = await realpath(c);
    if (real === realRoot || real.startsWith(realRoot + path.sep)) return real;
  }
  return null;
}

export async function sendFile(res: ServerResponse, file: string, status = 200, headers: Record<string, string> = {}) {
  const ext = path.extname(file).toLowerCase();
  const info = await stat(file);
  res.writeHead(status, {
    "Content-Type": TYPES[ext] ?? "application/octet-stream",
    "Content-Length": String(info.size),
    // Astro fingerprints everything under _astro/; pages can change on publish.
    "Cache-Control": file.includes(`${path.sep}_astro${path.sep}`) ? "public, max-age=31536000, immutable" : "no-cache",
    ...headers,
  });
  createReadStream(file).pipe(res);
}
