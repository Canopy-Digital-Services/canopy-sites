import { afterEach, describe, expect, it, vi } from "vitest";
import { liveSite, liveUrl, sitePath } from "./site-live";

afterEach(() => vi.unstubAllEnvs());

describe("liveSite (PRD D47)", () => {
  it("is /demo for the demo and the first production hostname for a client site", () => {
    expect(liveSite({ slug: "demo", isDemo: true, productionHostnames: [] })).toEqual({ origin: "", prefix: "/demo" });
    expect(liveSite({ slug: "acme", isDemo: false, productionHostnames: ["www.acme.example", "acme.example"] })).toEqual({ origin: "https://www.acme.example", prefix: "" });
    expect(liveSite({ slug: "acme", isDemo: false, productionHostnames: [] })).toBeNull();
  });

  it("takes a development asset origin only outside production", () => {
    vi.stubEnv("SITE_ASSET_ORIGIN_ACME_CO", "http://localhost:4321");
    vi.stubEnv("NODE_ENV", "development");
    expect(liveSite({ slug: "acme-co", isDemo: false, productionHostnames: ["www.acme.example"] })?.origin).toBe("http://localhost:4321");
    vi.stubEnv("NODE_ENV", "production");
    expect(liveSite({ slug: "acme-co", isDemo: false, productionHostnames: ["www.acme.example"] })?.origin).toBe("https://www.acme.example");
  });

  it("builds live addresses and reads reported paths back as the site's own", () => {
    const demo = { origin: "", prefix: "/demo" };
    const client = { origin: "https://www.acme.example", prefix: "" };
    expect(liveUrl(demo, "/")).toBe("/demo/");
    expect(liveUrl(demo, "/services")).toBe("/demo/services");
    expect(liveUrl(client, "/")).toBe("https://www.acme.example/");
    expect(sitePath(demo, "/demo/services/#hours")).toBe("/services");
    expect(sitePath(demo, "/demo")).toBe("/");
    expect(sitePath(client, "/about?x=1")).toBe("/about");
    expect(sitePath(client, "/demo-day")).toBe("/demo-day");
  });
});
