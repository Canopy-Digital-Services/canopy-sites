import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, createMember, createSite, resetDatabase } from "../../../../test/db";
import { jar, resetRequest, signInAs } from "../../../../test/next-request";

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

const PREVIEW_COOKIE = "canopy_demo_preview";

function get(path: string[] = [], query = "") {
  return GET(new Request(`https://sites.example.com/demo/${path.join("/")}${query}`), { params: Promise.resolve({ path }) });
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
  it("sandboxes every response: pages, assets, the preview, the editor's pages, and the unpublished notice", async () => {
    const { user } = await demoAccount();
    const responses = [await get(), await get(["_astro", "app.css"])];
    await signInAs(user.id);
    responses.push(await get(["services"], "?canopy_editor=1"));
    jar.set(PREVIEW_COOKIE, { name: PREVIEW_COOKIE, value: "1", options: {} });
    responses.push(await get());
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

  it("gives the Editor's canvas the draft with the bridge, for members of the demo account only", async () => {
    const { account, user } = await demoAccount();
    const member = await createMember(account.id);
    const { user: outsider } = await createAccount({ planCode: "SITES" });

    for (const id of [user.id, member.id]) {
      resetRequest();
      await signInAs(id);
      const res = await get(["services"], "?canopy_editor=1");
      const html = await res.text();
      expect(res.status).toBe(200);
      expect(html).toContain("<body>preview");
      expect(html).toContain('<head><base href="/demo/services"><script>document.documentElement.setAttribute("data-canopy-editor","")</script><title>');
      expect(html).toContain("canopy-canvas");
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(res.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    }
    resetRequest();
    await signInAs(outsider.id);
    expect((await get([], "?canopy_editor=1")).status).toBe(404);
    resetRequest();
    expect((await get([], "?canopy_editor=1")).status).toBe(404);
  });

  it("serves a fingerprinted asset only the other build has, for the canvas's sessionless requests", async () => {
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

  it("shows the preview only to a signed-in member of the demo account who switched it on", async () => {
    const { account, user } = await demoAccount();
    const member = await createMember(account.id);
    const { user: outsider } = await createAccount({ planCode: "SITES" });

    const seen = async (opts: { userId?: string; cookie: boolean }) => {
      resetRequest();
      if (opts.userId) await signInAs(opts.userId);
      if (opts.cookie) jar.set(PREVIEW_COOKIE, { name: PREVIEW_COOKIE, value: "1", options: {} });
      const res = await get();
      return { body: await res.text(), cache: res.headers.get("cache-control") };
    };

    expect((await seen({ userId: user.id, cookie: true })).body).toContain("<body>preview");
    expect((await seen({ userId: member.id, cookie: true })).body).toContain("Previewing unpublished changes");
    expect(await seen({ userId: user.id, cookie: true })).toMatchObject({ cache: "no-store" });
    expect((await seen({ userId: user.id, cookie: false })).body).toContain("<body>current");
    expect((await seen({ userId: outsider.id, cookie: true })).body).toContain("<body>current");
    expect((await seen({ cookie: true })).body).toContain("<body>current");
  });

  it("shows the published build, not a stale preview, once nothing is pending", async () => {
    const { user, site } = await demoAccount();
    await prisma.changeSet.updateMany({ where: { siteId: site.id }, data: { status: "DISCARDED" } });
    await signInAs(user.id);
    jar.set(PREVIEW_COOKIE, { name: PREVIEW_COOKIE, value: "1", options: {} });
    expect(await (await get()).text()).toContain("<body>current");
    expect(await (await get([], "?canopy_editor=1")).text()).toContain("<body>current");
    expect(builder.calls).not.toContain("preview");
  });

  it("sends a non-member who asks for the preview to sign in, without the cookie", async () => {
    await demoAccount();
    const res = await get(["__canopy", "preview"], "?state=on");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/login");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("is a 404 unless the site with the demo slug is marked as the demo", async () => {
    const { account } = await createAccount({ planCode: "SITES" });
    await createSite(account.id, { slug: "demo" });
    expect((await get()).status).toBe(404);
    expect(builder.calls).toEqual([]);
  });
});
