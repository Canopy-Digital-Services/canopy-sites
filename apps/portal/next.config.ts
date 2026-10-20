import path from "node:path";
import type { NextConfig } from "next";

// npm workspaces hoist dependencies to the repo root, so tracing and
// Turbopack must both resolve from there, not from apps/portal.
const workspaceRoot = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  output: "standalone", // Required for Docker deployment
  outputFileTracingRoot: workspaceRoot,
  turbopack: { root: workspaceRoot },
  serverExternalPackages: ["bcrypt", "@node-rs/bcrypt", "@prisma/client", "prisma"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Reset links carry their token in the URL; never send it onward.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Self-hosted fonts load from customer sites via /api/fonts, and
        // cross-origin @font-face requires CORS.
        source: "/fonts/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=2592000" },
        ],
      },
      {
        // Nothing may frame the admin, operator, or sign-in pages
        // (clickjacking). Hosted forms (/f/*), the embed script, and the
        // public submission endpoints are meant to be used from other sites.
        // /demo and /canvas set their own CSP (sandbox plus frame-ancestors):
        // a header set here would replace the route's.
        source: "/((?!f/|api/embed/|api/submit/|embed\\.js|demo(?:/|$)|canvas/).*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
    ];
  },
};

export default nextConfig;
