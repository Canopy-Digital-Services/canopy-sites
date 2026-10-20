import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, createMember, createSite, resetDatabase } from "../../../../../test/db";
import { resetRequest, signInAs } from "../../../../../test/next-request";

vi.mock("next/headers", () => import("../../../../../test/next-request"));

// The builder stands in for its two views; the database is real.
const builder = vi.hoisted(() => ({ previewBuild: "", calls: [] as string[] }));
vi.mock("@/lib/builder-client", () => ({
  builderConfigured: () => true,
  fetchSiteFile: vi.fn(async (_slug: string, view: "current" | "preview", path: string) => {
    builder.calls.push(`${view}:${path}`);
    return new Response(`<html><head><title>t</title></head><body>${view}</body></html>`, {
      headers: { "Content-Type": "text/html; charset=utf-8", "X-Canopy-Build": view === "preview" ? builder.previewBuild : "published" },
    });
  }),
}));

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

const live = vi.spyOn(globalThis, "fetch");

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
  builder.calls = [];
  builder.previewBuild = "";
  live.mockReset();
  live.mockImplementation(async () => new Response("<html><head></head><body>live</body></html>", { headers: { "Content-Type": "text/html" } }));
});

afterEach(() => live.mockReset());

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
    expect(String(live.mock.calls[0][0])).toBe("https://www.client.example/about");
  });

  it("is a 404 for a client site with no live address", async () => {
    const { user, site } = await siteWithDraft();
    await signInAs(user.id);
    expect((await get(site.id)).status).toBe(404);
  });
});
