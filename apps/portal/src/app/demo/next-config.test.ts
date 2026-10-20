import { describe, expect, it } from "vitest";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import nextConfig from "../../../next.config";

// /demo's and /canvas's sandbox CSP is set by their routes. A next.config
// header of the same name replaces the route's (it happened once), so no
// config rule that matches their paths may set one.
describe("next.config headers", () => {
  it("leave /demo's and /canvas's Content-Security-Policy and X-Frame-Options to the route", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    for (const path of ["/demo", "/demo/", "/demo/services", "/demo/_astro/app.css", "/canvas/site123/", "/canvas/site123/services"]) {
      const keys = rules
        .filter((r) => getPathMatch(r.source, { removeUnnamedParams: true, strict: true })(path))
        .flatMap((r) => r.headers.map((h) => h.key.toLowerCase()));
      expect(keys, path).not.toContain("content-security-policy");
      expect(keys, path).not.toContain("x-frame-options");
    }
  });

  it("still deny framing everywhere else", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    for (const path of ["/", "/quick-edit", "/editor", "/preview/site123", "/preview/site123/services", "/operator/sites", "/login", "/demonstration", "/canvasses"]) {
      const keys = rules
        .filter((r) => getPathMatch(r.source, { removeUnnamedParams: true, strict: true })(path))
        .flatMap((r) => r.headers.map((h) => h.key.toLowerCase()));
      expect(keys, path).toContain("content-security-policy");
    }
  });
});
