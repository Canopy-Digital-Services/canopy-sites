// Prisma configuration
// Simple config file for Prisma CLI

// Only load dotenv in development (when not in Docker)
if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv/config");
  } catch {
    // dotenv not available - that's fine in production
  }
}

module.exports = {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
};
