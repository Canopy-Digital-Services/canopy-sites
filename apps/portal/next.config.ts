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
};

export default nextConfig;
