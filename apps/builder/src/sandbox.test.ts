import { mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { pagesDir } from "./sandbox.ts";

async function build(files: string[], links: Array<[string, string]> = []) {
  const dist = path.join(await mkdtemp(path.join(tmpdir(), "builder-dist-")), "dist");
  for (const f of files) {
    await mkdir(path.dirname(path.join(dist, f)), { recursive: true });
    await writeFile(path.join(dist, f), "x");
  }
  for (const [from, to] of links) await symlink(to, path.join(dist, from));
  return dist;
}

describe("pagesDir", () => {
  it("is dist for a static site", async () => {
    const dist = await build(["index.html", "about/index.html", "_astro/a.css"]);
    expect(await pagesDir(dist)).toBe(dist);
  });

  it("is dist/client for a site with a server, whose pages are built beside the server's code", async () => {
    const dist = await build(["client/index.html", "client/contact/index.html", "client/_astro/a.css", "server/entry.mjs"]);
    expect(await pagesDir(dist)).toBe(path.join(dist, "client"));
  });

  it("stays dist for a static site that happens to have pages named client and server", async () => {
    const dist = await build(["index.html", "client/index.html", "server/index.html"]);
    expect(await pagesDir(dist)).toBe(dist);
  });

  it("stays dist when only one of the two directories is there", async () => {
    expect(await pagesDir(await build(["client/index.html"]))).toMatch(/dist$/);
    expect(await pagesDir(await build(["server/entry.mjs"]))).toMatch(/dist$/);
  });

  it("never follows a link: a client or server that is a symlink is not a server build", async () => {
    const dist = await build(["server/entry.mjs", "elsewhere/index.html"], [["client", "elsewhere"]]);
    expect(await pagesDir(dist)).toBe(dist);
  });
});
