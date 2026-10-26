import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestHeaders, resetRequest } from "../../test/next-request";

vi.mock("next/headers", () => import("../../test/next-request"));

const {
  appUrlFor,
  homeHostRedirect,
  homePathFor,
  productFor,
  productMetadata,
  productNameFor,
  requireHomeHost,
  signupHostRedirect,
} = await import("./product");

const sites = { sitesEnabled: true };
const forms = { sitesEnabled: false };

describe("homePathFor", () => {
  it("sends Sites accounts to the editor and everyone else to forms", () => {
    expect(homePathFor(sites)).toBe("/quick-edit");
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

describe("productMetadata", () => {
  it("titles the account's product when signed in", () => {
    expect(productMetadata(productFor(sites)).title).toBe("CANOPY SITES");
    expect(productMetadata(productFor(forms)).title).toBe("CANOPY FORMS");
  });
});

describe("home host (PRD D22)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXTAUTH_URL", "https://forms.example.com/");
    vi.stubEnv("SITES_URL", "https://sites.example.com");
    resetRequest();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("sends an account on the other product's host to its own, and leaves it alone at home", () => {
    expect(homeHostRedirect(forms, "sites.example.com")).toBe("https://forms.example.com");
    expect(homeHostRedirect(forms, "forms.example.com")).toBeNull();
    expect(homeHostRedirect(sites, "forms.example.com")).toBe("https://sites.example.com");
    expect(homeHostRedirect(sites, "sites.example.com")).toBeNull();
  });

  it("ignores hosts it does not know, so a stray Host header cannot pick a destination", () => {
    expect(homeHostRedirect(forms, "evil.example.net")).toBeNull();
    expect(homeHostRedirect(sites, "")).toBeNull();
  });

  it("routes nothing when the environment has one host", () => {
    vi.stubEnv("SITES_URL", "");
    expect(homeHostRedirect(forms, "sites.example.com")).toBeNull();
    expect(signupHostRedirect("sites.example.com")).toBeNull();
    vi.stubEnv("SITES_URL", "https://forms.example.com");
    expect(homeHostRedirect(sites, "forms.example.com")).toBeNull();
  });

  it("compares ports, as local dev runs both hosts on one", () => {
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3006");
    vi.stubEnv("SITES_URL", "http://sites.localhost:3006");
    expect(homeHostRedirect(forms, "sites.localhost:3006")).toBe("http://localhost:3006");
    expect(homeHostRedirect(sites, "localhost:3006")).toBe("http://sites.localhost:3006");
  });

  it("sends signup on the Sites host to the Forms host", () => {
    expect(signupHostRedirect("sites.example.com")).toBe("https://forms.example.com/signup");
    expect(signupHostRedirect("forms.example.com")).toBeNull();
  });

  it("requireHomeHost redirects by the forwarded host the browser used", async () => {
    requestHeaders.set("host", "portal:3000");
    requestHeaders.set("x-forwarded-host", "sites.example.com");
    const err = await requireHomeHost(forms).then(() => null, (e) => e);
    expect(String(err?.digest)).toContain("NEXT_REDIRECT;replace;https://forms.example.com/;");

    requestHeaders.set("x-forwarded-host", "forms.example.com");
    await expect(requireHomeHost(forms)).resolves.toBeUndefined();
  });
});
