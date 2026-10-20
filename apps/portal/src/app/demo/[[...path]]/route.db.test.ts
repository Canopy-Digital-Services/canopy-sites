import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, createMember, createSite, resetDatabase } from "../../../../test/db";
import { resetRequest, signInAs } from "../../../../test/next-request";

vi.mock("next/headers", () => import("../../../../test/next-request"));

// The builder stands in for its two views; the database is real.
const builder = vi.hoisted(() => ({ built: true, calls: [] as string[], onlyInPreview: [] as string[] }));
vi.mock("@/lib/builder-client", () => ({
  fetchSiteFile: vi.fn(async (_slug: string, view: "current" | "preview", path: string) => {
    builder.calls.push(view);
    if (!builder.built) {
      return new Response(JSON.stringify({ error: "Nothing built yet" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }
    if (view === "current" && builder.onlyInPreview.includes(path)) {
      return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain" } });
    }
    if (path.endsWith(".css")) return new Response("body{}", { headers: { "Content-Type": "text/css; charset=utf-8" } });
    return new Response(`<html><head><title>t</title></head><body>${view}</body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }),
}));

const { GET } = await import("./route");

function get(path: string[] = []) {
  return GET(new Request(`https://sites.example.com/demo/${path.join("/")}`), { params: Promise.resolve({ path }) });
}

async function demoAccount({ draft = true }: { draft?: boolean } = {}) {
  const { account, user } = await createAccount({ planCode: "SITES" });
  const site = await createSite(account.id, { slug: "demo" });
  await prisma.site.update({ where: { id: site.id }, data: { isDemo: true } });
  if (draft) {
    await prisma.changeSet.create({ data: { siteId: site.id, source: "EDITOR", summary: "Price", ops: [], baseCommit: "a".repeat(40) } });
  }
  return { account, user, site };
}

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
  builder.built = true;
  builder.calls = [];
  builder.onlyInPreview = [];
});

describe("/demo", () => {
  it("sandboxes every response: pages, assets, and the unpublished notice", async () => {
    await demoAccount();
    const responses = [await get(), await get(["_astro", "app.css"])];
    builder.built = false;
    responses.push(await get());

    for (const res of responses) {
      const csp = res.headers.get("content-security-policy") ?? "";
      expect(csp.startsWith("sandbox ")).toBe(true);
      expect(csp).not.toContain("allow-same-origin");
    }
    expect(responses[0].headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(responses[0].headers.get("x-frame-options")).toBe("DENY");
  });

  it("serves the published build to everyone, members with a draft included (drafts preview on /canvas)", async () => {
    const { account, user } = await demoAccount();
    const member = await createMember(account.id);
    for (const id of [user.id, member.id, null]) {
      resetRequest();
      if (id) await signInAs(id);
      const html = await (await get(["services"])).text();
      expect(html).toContain("<body>current");
      expect(html).not.toContain("canopy-canvas");
    }
    expect(builder.calls).not.toContain("preview");
  });

  it("serves a fingerprinted asset only the draft's build has, for the canvas's sessionless requests", async () => {
    await demoAccount();
    builder.onlyInPreview = ["_astro/new.css"];
    const res = await get(["_astro", "new.css"]);
    expect(res.status).toBe(200);
    expect(builder.calls).toEqual(["current", "preview"]);
    builder.calls = [];
    builder.onlyInPreview = ["about/index.html"];
    expect((await get(["about", "index.html"])).status).toBe(404);
    expect(builder.calls).toEqual(["current"]);
  });

  it("is a 404 unless the site with the demo slug is marked as the demo", async () => {
    const { account } = await createAccount({ planCode: "SITES" });
    await createSite(account.id, { slug: "demo" });
    expect((await get()).status).toBe(404);
    expect(builder.calls).toEqual([]);
  });
});
