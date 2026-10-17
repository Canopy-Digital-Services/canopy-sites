import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, createMember, createSite, resetDatabase } from "../../../../test/db";
import { jar, resetRequest, signInAs } from "../../../../test/next-request";

vi.mock("next/headers", () => import("../../../../test/next-request"));

// The builder stands in for its two views; the database is real.
const builder = vi.hoisted(() => ({ built: true, calls: [] as string[] }));
vi.mock("@/lib/builder-client", () => ({
  fetchSiteFile: vi.fn(async (_slug: string, view: "current" | "preview", path: string) => {
    builder.calls.push(view);
    if (!builder.built) {
      return new Response(JSON.stringify({ error: "Nothing built yet" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }
    if (path.endsWith(".css")) return new Response("body{}", { headers: { "Content-Type": "text/css; charset=utf-8" } });
    return new Response(`<html><body>${view}</body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }),
}));

const { GET } = await import("./route");

const PREVIEW_COOKIE = "canopy_demo_preview";

function get(path: string[] = [], query = "") {
  return GET(new Request(`https://sites.example.com/demo/${path.join("/")}${query}`), { params: Promise.resolve({ path }) });
}

async function demoAccount() {
  const { account, user } = await createAccount({ planCode: "SITES" });
  const site = await createSite(account.id, { slug: "demo" });
  await prisma.site.update({ where: { id: site.id }, data: { isDemo: true } });
  return { account, user };
}

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
  builder.built = true;
  builder.calls = [];
});

describe("/demo", () => {
  it("sandboxes every response: pages, assets, the preview, the concept, and the unpublished notice", async () => {
    const { user } = await demoAccount();
    const responses = [await get(), await get(["_astro", "app.css"]), await get([], "?canopy_editor_mockup=1")];
    await signInAs(user.id);
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

  it("lets only the portal frame the Editor concept, which never shows the preview", async () => {
    const { user } = await demoAccount();
    await signInAs(user.id);
    jar.set(PREVIEW_COOKIE, { name: PREVIEW_COOKIE, value: "1", options: {} });

    const res = await get([], "?canopy_editor_mockup=1");

    expect(res.headers.get("content-security-policy")).toContain("frame-ancestors 'self'");
    expect(res.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(builder.calls).toEqual(["current"]);
    expect(await res.text()).toContain("<body>current");
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
