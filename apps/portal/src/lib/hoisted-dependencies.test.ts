import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// apps/portal/Dockerfile copies only the root node_modules into the image, so
// a package npm nests under apps/portal/node_modules is missing in production.
// An install over the existing lockfile can nest one. The way back is in
// docs/tools/nextjs-16.md, "Upgrading `next` in this repo".
describe("package-lock.json", () => {
  it("keeps the portal's dependencies in the root node_modules", () => {
    const lock = JSON.parse(
      readFileSync(
        new URL("../../../../package-lock.json", import.meta.url),
        "utf8",
      ),
    ) as { packages: Record<string, unknown> };
    const paths = Object.keys(lock.packages);

    expect(paths).toContain("node_modules/next");
    expect(
      paths.filter((path) => path.startsWith("apps/portal/node_modules/")),
    ).toEqual([]);
  });
});
