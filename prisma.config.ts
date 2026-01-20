// Prisma configuration
// Note: dotenv import removed - environment variables are injected by Docker in production
import { defineConfig } from "prisma/config";

// Only load dotenv in development (when not in Docker)
if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv/config");
  } catch {
    // dotenv not available - that's fine in production
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
