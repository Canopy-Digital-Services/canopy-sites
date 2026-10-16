import { describe, expect, it } from "vitest";
import { clientIPFromHeaders } from "./validation";

const h = (values: Record<string, string>) => new Headers(values);

describe("clientIPFromHeaders", () => {
  it("prefers Cloudflare's header over a client-supplied X-Forwarded-For", () => {
    expect(
      clientIPFromHeaders(h({ "cf-connecting-ip": "203.0.113.7", "x-forwarded-for": "1.2.3.4, 203.0.113.7" }))
    ).toBe("203.0.113.7");
  });

  it("falls back to X-Forwarded-For, then X-Real-IP, then unknown", () => {
    expect(clientIPFromHeaders(h({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" }))).toBe("198.51.100.1");
    expect(clientIPFromHeaders(h({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIPFromHeaders(h({}))).toBe("unknown");
  });
});
