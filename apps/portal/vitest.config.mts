import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Two projects. `unit` (*.test.ts) needs nothing. `db` (*.db.test.ts) runs
// against a separate *_test database (test/db-url.ts), migrated in global
// setup; run it in the dev container, where the Postgres host resolves
// (`docker exec canopy-portal npm test`). Files run one at a time because
// they share that database.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.db.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "db",
          environment: "node",
          include: ["src/**/*.db.test.ts", "scripts/**/*.db.test.ts"],
          globalSetup: ["test/db-global-setup.ts"],
          setupFiles: ["test/db-env.ts"],
          fileParallelism: false,
        },
      },
    ],
  },
});
