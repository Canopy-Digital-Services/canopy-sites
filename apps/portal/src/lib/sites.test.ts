import { describe, expect, it } from "vitest";
import { normalizeHostname, parseNewSite, parseSiteSettings, suggestSlug, type SiteSettingsInput } from "./sites";

const valid: SiteSettingsInput = {
  name: "Fern & Fig",
  repoUrl: "https://github.com/example-org/example-site",
  defaultBranch: "main",
  productionHostnames: ["example.com", "www.example.com"],
  contractVersion: "0.1.0",
  umamiWebsiteId: "",
  runbookOverlay: "",
  lockedFields: ["site.contact.phone"],
};

function errorsOf(input: Partial<SiteSettingsInput>) {
  const result = parseSiteSettings({ ...valid, ...input });
  return result.ok ? {} : result.errors;
}

describe("parseNewSite", () => {
  it("lowercases the slug and trims both fields", () => {
    expect(parseNewSite({ name: "  Fern & Fig ", slug: " Fern-And-Fig " })).toEqual({
      ok: true,
      value: { name: "Fern & Fig", slug: "fern-and-fig" },
    });
  });

  it.each([
    ["", "Slug is required"],
    ["-leading", "Use lowercase letters, digits, and inner hyphens"],
    ["trailing-", "Use lowercase letters, digits, and inner hyphens"],
    ["has space", "Use lowercase letters, digits, and inner hyphens"],
    ["../etc", "Use lowercase letters, digits, and inner hyphens"],
    ["a".repeat(41), "Slug must be 40 characters or fewer"],
  ])("refuses slug %j", (slug, message) => {
    expect(parseNewSite({ name: "x", slug })).toEqual({ ok: false, errors: { slug: message } });
  });

  it("requires a name", () => {
    expect(parseNewSite({ name: " ", slug: "ok" })).toEqual({ ok: false, errors: { name: "Name is required" } });
  });
});

describe("suggestSlug", () => {
  it("turns a name into a slug", () => {
    expect(suggestSlug("Fern & Fig")).toBe("fern-and-fig");
    expect(suggestSlug("  Café Olé!  ")).toBe("cafe-ole");
  });
});

describe("normalizeHostname", () => {
  it("lowercases and drops a trailing dot", () => {
    expect(normalizeHostname(" WWW.Example.com. ")).toBe("www.example.com");
  });

  it.each(["https://example.com", "example.com/path", "example.com:8080", "*.example.com", "localhost", "10.0.0.1", "-bad.com"])(
    "refuses %j",
    (raw) => {
      expect(normalizeHostname(raw)).toBeNull();
    }
  );
});

describe("parseSiteSettings", () => {
  it("normalizes valid input; blank optional fields become null and blank rows drop", () => {
    const result = parseSiteSettings({
      ...valid,
      repoUrl: " ",
      contractVersion: "v0.2.1",
      productionHostnames: ["Example.com", " "],
      lockedFields: ["", "site.contact.email"],
      runbookOverlay: "Voice: warm.\r\n\r\n",
    });
    expect(result).toEqual({
      ok: true,
      value: {
        name: "Fern & Fig",
        repoUrl: null,
        defaultBranch: "main",
        productionHostnames: ["example.com"],
        contractVersion: "0.2.1",
        umamiWebsiteId: null,
        runbookOverlay: "Voice: warm.",
        lockedFields: ["site.contact.email"],
      },
    });
  });

  it("refuses a repo URL that is not https or carries credentials", () => {
    expect(errorsOf({ repoUrl: "git@github.com:org/repo.git" })).toEqual({ repoUrl: "Enter a full https:// URL" });
    expect(errorsOf({ repoUrl: "http://github.com/org/repo" })).toEqual({ repoUrl: "Enter a full https:// URL" });
    expect(errorsOf({ repoUrl: "https://x:token@github.com/org/repo" })).toEqual({
      repoUrl: "Leave credentials out of the URL",
    });
  });

  it("refuses a branch name git would not accept or a shell could misread", () => {
    for (const defaultBranch of ["", "-x", "a..b", "a b", "main;rm", "x.lock"]) {
      expect(errorsOf({ defaultBranch })).toHaveProperty("defaultBranch");
    }
    expect(errorsOf({ defaultBranch: "release/2026" })).toEqual({});
  });

  it("refuses a bad or repeated hostname", () => {
    expect(errorsOf({ productionHostnames: ["https://example.com"] })).toHaveProperty("productionHostnames");
    expect(errorsOf({ productionHostnames: ["example.com", "EXAMPLE.com"] })).toEqual({
      productionHostnames: "example.com is listed twice",
    });
  });

  it("refuses a bad or repeated locked field", () => {
    expect(errorsOf({ lockedFields: ["site contact"] })).toHaveProperty("lockedFields");
    expect(errorsOf({ lockedFields: ["/site/contact"] })).toHaveProperty("lockedFields");
    expect(errorsOf({ lockedFields: ["site.contact.phone", "site.contact.phone"] })).toEqual({
      lockedFields: "site.contact.phone is listed twice",
    });
  });

  it("refuses a contract version or Umami ID in the wrong format, and an overlay over the cap", () => {
    expect(errorsOf({ contractVersion: "1.0" })).toHaveProperty("contractVersion");
    expect(errorsOf({ umamiWebsiteId: "not-a-uuid" })).toHaveProperty("umamiWebsiteId");
    expect(errorsOf({ umamiWebsiteId: "3F2504E0-4F89-41D3-9A0C-0305E82C3301" })).toEqual({});
    expect(errorsOf({ runbookOverlay: "x".repeat(20_001) })).toHaveProperty("runbookOverlay");
  });
});
