import { NextRequest } from "next/server";
import { buildFontCss } from "@/lib/font-css";

// GET /api/fonts?family=Inter&family=Bungee
// Loaded as a <link rel="stylesheet"> by the embed (on customer sites) and the
// admin font picker. Stylesheet links need no CORS; the woff2 files under
// /fonts get Access-Control-Allow-Origin in next.config.ts.
export function GET(request: NextRequest) {
  const css = buildFontCss(request.nextUrl.searchParams.getAll("family"));
  return new Response(css, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
