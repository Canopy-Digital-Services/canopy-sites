import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Required for Docker deployment
  serverExternalPackages: ["bcrypt", "@node-rs/bcrypt", "@prisma/client", "prisma"],
};

export default nextConfig;
