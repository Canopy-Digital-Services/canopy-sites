import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resolveFile } from "./serve.ts";

let dir: string;
let root: string;

beforeAll(async () => {
  dir = await realpath(await mkdtemp(path.join(os.tmpdir(), "builder-serve-")));
  root = path.join(dir, "build");
  await mkdir(path.join(root, "about"), { recursive: true });
  await writeFile(path.join(root, "index.html"), "home");
  await writeFile(path.join(root, "about", "index.html"), "about");
  await writeFile(path.join(root, "contact.html"), "contact");
  await writeFile(path.join(dir, "outside.txt"), "outside");
  await symlink(path.join(dir, "outside.txt"), path.join(root, "link.txt"));
});

afterAll(() => rm(dir, { recursive: true, force: true }));

describe("resolveFile", () => {
  it("finds a file the way a static host would: exact, directory index, then .html", async () => {
    expect(await resolveFile(root, "/")).toBe(path.join(root, "index.html"));
    expect(await resolveFile(root, "/about")).toBe(path.join(root, "about", "index.html"));
    expect(await resolveFile(root, "/about/")).toBe(path.join(root, "about", "index.html"));
    expect(await resolveFile(root, "/contact")).toBe(path.join(root, "contact.html"));
    expect(await resolveFile(root, "/missing")).toBeNull();
  });

  it("treats a path with a . or .. segment as missing, however it is written", async () => {
    for (const p of [
      "/about/../index.html",
      "/about/%2e%2e/index.html",
      "/about%2F..%2Findex.html",
      "/about\\..\\index.html",
      "/about/%2E%2E%5Cindex.html",
      "/./index.html",
      "/about/.",
      "/..",
      "/../outside.txt",
    ]) {
      expect(await resolveFile(root, p), p).toBeNull();
    }
  });

  it("treats a NUL, a bad encoding, and a link out of the build as missing", async () => {
    expect(await resolveFile(root, "/index.html%00")).toBeNull();
    expect(await resolveFile(root, "/%E0%A4%A")).toBeNull();
    expect(await resolveFile(root, "/link.txt")).toBeNull();
  });
});
