import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, createMember, createSite, resetDatabase } from "../../../../../test/db";
import { resetRequest, signInAs } from "../../../../../test/next-request";

vi.mock("next/headers", () => import("../../../../../test/next-request"));

// The builder and the live site stand in over HTTP, so the portal's own
// client runs; the database is real. The builder answers every route it is
// asked for, and `requests` keeps each path.
const BUILDER = "http://builder.test:4100";
const FILES = /^\/v1\/sites\/[a-z0-9-]+\/files\/(current|preview)\/(.*)$/;
const PAGES = ["", "services", "about"];
const builder = { previewBuild: "", notFoundPage: false, calls: [] as string[], requests: [] as string[] };
const live = { requests: [] as string[] };

vi.stubEnv("BUILDER_URL", BUILDER);
vi.stubEnv("BUILDER_TOKEN", "t".repeat(32));
vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
  const url = new URL(String(input));
  if (url.origin !== BUILDER) {
    live.requests.push(url.href);
    return new Response("<html><head></head><body>live</body></html>", { headers: { "Content-Type": "text/html" } });
  }
  builder.requests.push(url.pathname);
  const files = FILES.exec(url.pathname);
  if (!files) return Response.json({ current: "b1", preview: "b2" });
  const view = files[1];
  const path = decodeURIComponent(files[2]);
  builder.calls.push(`${view}:${path}`);
  // A page the build doesn't have: its own 404 page when it has one, else the builder's plain 404.
  if (!PAGES.includes(path) && !builder.notFoundPage) return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain" } });
  const found = PAGES.includes(path);
  return new Response(`<html><head><title>t</title></head><body>${found ? view : "not found"}</body></html>`, {
    status: found ? 200 : 404,
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Canopy-Build": view === "preview" ? builder.previewBuild : "published" },
  });
});

afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const { GET } = await import("./route");

function get(siteId: string, path: string[] = [], query = "") {
  return GET(new Request(`https://evil.example.com/canvas/${siteId}/${path.join("/")}${query}`), { params: Promise.resolve({ siteId, path }) });
}

async function siteWithDraft(opts: { demo?: boolean; hostnames?: string[] } = {}) {
  const { account, user } = await createAccount({ planCode: "SITES" });
  const site = await createSite(account.id, { slug: opts.demo ? "demo" : undefined, productionHostnames: opts.hostnames ?? [] });
  await prisma.site.update({ where: { id: site.id }, data: { isDemo: Boolean(opts.demo), repoUrl: "https://github.com/example/site" } });
  const draft = await prisma.changeSet.create({ data: { siteId: site.id, source: "EDITOR", summary: "Price", ops: [], baseCommit: "a".repeat(40) } });
  const build = await prisma.build.create({ data: { siteId: site.id, changeSetId: draft.id, status: "SUCCEEDED", draftVersion: 1 } });
  builder.previewBuild = build.id;
  return { account, user, site, draft, build };
}

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
  builder.calls = [];
  builder.requests = [];
  builder.previewBuild = "";
  builder.notFoundPage = false;
  live.requests = [];
});

describe("/canvas (PRD D47)", () => {
  it("gives members the draft's build with the bridge, a <base> at the live address, and the build's id", async () => {
    const { account, user, site, build } = await siteWithDraft({ demo: true });
    const member = await createMember(account.id);
    for (const id of [user.id, member.id]) {
      resetRequest();
      await signInAs(id);
      const res = await get(site.id, ["services"]);
      const html = await res.text();
      expect(res.status).toBe(200);
      expect(html).toContain("<body>preview");
      expect(html).toContain('<head><base href="/demo/services"><script>document.documentElement.setAttribute("data-canopy-editor","")</script><title>');
      expect(html).toContain("canopy-canvas");
      expect(html).toContain("[data-canopy-field]{cursor:pointer");
      expect(res.headers.get("x-canopy-build")).toBe(build.id);
      expect(res.headers.get("cache-control")).toBe("no-store");
    }
  });

  it("is a 404 for anyone outside the site's account, without asking the builder", async () => {
    const { site } = await siteWithDraft({ demo: true });
    const { user: outsider } = await createAccount({ planCode: "SITES" });
    await signInAs(outsider.id);
    expect((await get(site.id)).status).toBe(404);
    resetRequest();
    expect((await get(site.id)).status).toBe(404);
    expect((await get("no-such-site")).status).toBe(404);
    expect(builder.calls).toEqual([]);
  });

  it("sandboxes every response, the 404 included", async () => {
    const { user, site } = await siteWithDraft({ demo: true });
    const responses = [await get(site.id)];
    await signInAs(user.id);
    responses.push(await get(site.id), await get(site.id, [], "?view=preview"));
    for (const res of responses) {
      const csp = res.headers.get("content-security-policy") ?? "";
      expect(csp.startsWith("sandbox ")).toBe(true);
      expect(csp).not.toContain("allow-same-origin");
      expect(csp).toContain("frame-ancestors 'none'");
    }
  });

  it("serves the preview page in view mode: the preview flag, no marks", async () => {
    const { user, site } = await siteWithDraft({ demo: true });
    await signInAs(user.id);
    const html = await (await get(site.id, [], "?view=preview")).text();
    expect(html).toContain('setAttribute("data-canopy-preview","")');
    expect(html).not.toContain("data-canopy-editor");
    expect(html).not.toContain("[data-canopy-field]{cursor:pointer");
    expect(html).toContain("var VIEW = true");
  });

  it("shows the live page when the builder's preview is another change's build, or there is no draft", async () => {
    const { user, site, draft } = await siteWithDraft({ demo: true });
    await signInAs(user.id);
    builder.previewBuild = "someone-elses-build";
    let res = await get(site.id);
    expect(await res.text()).toContain("<body>current");
    expect(res.headers.get("x-canopy-build")).toBeNull();
    await prisma.changeSet.update({ where: { id: draft.id }, data: { status: "DISCARDED" } });
    builder.calls = [];
    res = await get(site.id);
    expect(await res.text()).toContain("<body>current");
    expect(builder.calls).toEqual(["current:"]);
  });

  it("loads a client site's assets from its production hostname, never the request's host", async () => {
    const { user, site, draft } = await siteWithDraft({ hostnames: ["www.client.example"] });
    await signInAs(user.id);
    const html = await (await get(site.id, ["about"])).text();
    expect(html).toContain('<base href="https://www.client.example/about">');
    expect(html).not.toContain("evil.example.com");
    // With no draft, the page itself comes from the live site.
    await prisma.changeSet.update({ where: { id: draft.id }, data: { status: "PUBLISHED" } });
    const page = await (await get(site.id, ["about"])).text();
    expect(page).toContain("<body>live");
    expect(live.requests).toEqual(["https://www.client.example/about"]);
  });

  it("is a 404 for a path that isn't a page's own, and asks the builder for nothing outside the site's files", async () => {
    const demo = await siteWithDraft({ demo: true });
    const client = await siteWithDraft({ hostnames: ["www.client.example"] });
    for (const { user, site } of [demo, client]) {
      resetRequest();
      await signInAs(user.id);
      // Segments as the route's params give them: decoded once.
      for (const path of [
        ["..", "..", "..", "demo", "status"],
        ["services", ".."],
        [".", "services"],
        ["../../../demo/status"],
        ["..\\..\\..\\demo\\status"],
        ["services\0"],
        // The same, still percent-encoded after that one decode.
        ["%2e%2e", "%2e%2e", "%2e%2e", "demo", "status"],
        ["%2E%2E", "%2e%2e", "preview", "index.html"],
        ["..%2F..%2F..%2Fdemo%2Fstatus"],
        ["..%5c..%5Cdemo%5cstatus"],
        ["services%00"],
      ]) {
        expect((await get(site.id, path)).status, JSON.stringify(path)).toBe(404);
      }
    }
    expect(builder.requests).toEqual([]);
    expect(live.requests).toEqual([]);

    // Any other name is sent as it is, encoded once, under the site's files; the site's own 404 page answers.
    resetRequest();
    await signInAs(demo.user.id);
    builder.notFoundPage = true;
    expect((await get(demo.site.id, ["a b", "50%", "café"])).status).toBe(404);
    expect(builder.requests).toEqual([
      "/v1/sites/demo/files/preview/a%20b/50%25/caf%C3%A9",
      "/v1/sites/demo/files/current/a%20b/50%25/caf%C3%A9",
    ]);
  });

  it("is a 404 for a client site with no live address", async () => {
    const { user, site } = await siteWithDraft();
    await signInAs(user.id);
    expect((await get(site.id)).status).toBe(404);
  });
});
