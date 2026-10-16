import { afterEach, describe, expect, it, vi } from "vitest";
import { appUrlFor, homePathFor, productNameFor } from "./product";

const sites = { sitesEnabled: true };
const forms = { sitesEnabled: false };

describe("homePathFor", () => {
  it("sends Sites accounts to the editor and everyone else to forms", () => {
    expect(homePathFor(sites)).toBe("/editor");
    expect(homePathFor(forms)).toBe("/forms");
  });
});

describe("appUrlFor", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses SITES_URL for Sites accounts and NEXTAUTH_URL otherwise, without a trailing slash", () => {
    vi.stubEnv("NEXTAUTH_URL", "https://forms.example.com/");
    vi.stubEnv("SITES_URL", "https://sites.example.com/");
    expect(appUrlFor(sites)).toBe("https://sites.example.com");
    expect(appUrlFor(forms)).toBe("https://forms.example.com");
  });

  it("falls back to NEXTAUTH_URL when SITES_URL is unset", () => {
    vi.stubEnv("NEXTAUTH_URL", "https://forms.example.com");
    vi.stubEnv("SITES_URL", "");
    expect(appUrlFor(sites)).toBe("https://forms.example.com");
  });
});

describe("productNameFor", () => {
  it("names the product the account has", () => {
    expect(productNameFor(sites)).toBe("Canopy Sites");
    expect(productNameFor(forms)).toBe("Canopy Forms");
  });
});
