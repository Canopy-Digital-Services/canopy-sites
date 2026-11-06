import { describe, expect, it } from "vitest";
import {
  normalizeGitHubRepo,
  normalizeHostname,
  parseLinkSite,
  parseSiteSettings,
  suggestSlug,
  suggestSlugFromRepo,
  type LinkSiteInput,
  type SiteSettingsInput,
} from "./sites";

const valid: SiteSettingsInput = {
  name: "Fern & Fig",
  repoUrl: "https://github.com/example-org/example-site",
  defaultBranch: "main",
  productionHostnames: ["example.com", "www.example.com"],
  umamiWebsiteId: "",
  runbookOverlay: "",
  lockedFields: ["site/contact/phone"],
  fixedLists: [],
};

function errorsOf(input: Partial<SiteSettingsInput>) {
  const result = parseSiteSettings({ ...valid, ...input });
  return result.ok ? {} : result.errors;
}

const link: LinkSiteInput = {
  email: " Owner@Example.com ",
  name: " Fern & Fig ",
  repoUrl: "https://github.com/Canopy-Digital-Services/fern-and-fig.git",
  slug: " Fern-And-Fig ",
  productionHostnames: ["FernAndFig.com", " ", "www.fernandfig.com"],
  umamiWebsiteId: "",
};

function linkErrors(input: Partial<LinkSiteInput>) {
  const result = parseLinkSite({ ...link, ...input });
  return result.ok ? {} : result.errors;
}

describe("parseLinkSite", () => {
  it("normalizes the email, name, repo, slug, and hostnames; a blank Umami ID is null", () => {
    expect(parseLinkSite(link)).toEqual({
      ok: true,
      value: {
        email: "owner@example.com",
        name: "Fern & Fig",
        repoUrl: "https://github.com/Canopy-Digital-Services/fern-and-fig",
        slug: "fern-and-fig",
        productionHostnames: ["fernandfig.com", "www.fernandfig.com"],
        umamiWebsiteId: null,
      },
    });
  });

  it("requires every field but the Umami ID, and a hostname", () => {
    expect(linkErrors({ email: "", name: " ", repoUrl: "", slug: "", productionHostnames: [" "] })).toEqual({
      email: "Email is required",
      name: "Name is required",
      repoUrl: "Repository is required",
      slug: "Slug is required",
      productionHostnames: "Add the site's hostname",
    });
  });

  it("refuses an email, repo, hostname, or Umami ID in the wrong shape", () => {
    expect(linkErrors({ email: "owner@" })).toEqual({ email: "Enter a valid email address" });
    const repos = [
      "https://gitlab.com/org/repo",
      "ssh://github.com/org/repo.git",
      "https://github.com/org",
      "https://x:t@github.com/org/repo",
    ];
    for (const repoUrl of repos) {
      expect(linkErrors({ repoUrl })).toHaveProperty("repoUrl");
    }
    expect(linkErrors({ productionHostnames: ["https://fernandfig.com"] })).toHaveProperty("productionHostnames");
    expect(linkErrors({ umamiWebsiteId: "not-a-uuid" })).toHaveProperty("umamiWebsiteId");
  });

  it.each([
    ["-leading", "Use lowercase letters, digits, and inner hyphens"],
    ["has space", "Use lowercase letters, digits, and inner hyphens"],
    ["../etc", "Use lowercase letters, digits, and inner hyphens"],
    ["a".repeat(41), "Slug must be 40 characters or fewer"],
  ])("refuses slug %j", (slug, message) => {
    expect(linkErrors({ slug })).toEqual({ slug: message });
  });
});

describe("normalizeGitHubRepo and suggestSlugFromRepo", () => {
  it("keep one form of a GitHub repo URL, and suggest its name as the slug", () => {
    expect(normalizeGitHubRepo(" https://github.com/Org/My.Site.git/ ")).toBe("https://github.com/Org/My.Site");
    expect(normalizeGitHubRepo("https://github.com/org/repo/tree/main")).toBeNull();
    expect(suggestSlugFromRepo("https://github.com/Canopy-Digital-Services/toroz")).toBe("toroz");
    expect(suggestSlugFromRepo("https://github.com/org/My.Site")).toBe("my-site");
    expect(suggestSlugFromRepo("https://github.com/org")).toBe("");
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
      productionHostnames: ["Example.com", " "],
      lockedFields: ["", "site/contact/email"],
      fixedLists: [" classes ", ""],
      runbookOverlay: "Voice: warm.\r\n\r\n",
    });
    expect(result).toEqual({
      ok: true,
      value: {
        name: "Fern & Fig",
        repoUrl: null,
        defaultBranch: "main",
        productionHostnames: ["example.com"],
        umamiWebsiteId: null,
        runbookOverlay: "Voice: warm.",
        lockedFields: ["site/contact/email"],
        fixedLists: ["classes"],
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

  it("takes locked fields and fixed lists as addresses (PRD D50), refusing anything else or a repeat", () => {
    expect(errorsOf({ lockedFields: ["pages/*/hero/headline", "site/contact"], fixedLists: ["classes", "pages/home/sections/why/cards"] })).toEqual({});
    for (const bad of ["site contact", "/site/contact", "site.contact.phone", "widgets/x", "site//contact", "site/**"]) {
      expect(errorsOf({ lockedFields: [bad] })).toEqual({
        lockedFields: `"${bad}" is not a field address. Use an address such as site/contact/phone`,
      });
    }
    expect(errorsOf({ fixedLists: ["classes.sessions"] })).toEqual({
      fixedLists: `"classes.sessions" is not a list address. Use an address such as classes`,
    });
    expect(errorsOf({ lockedFields: ["site/contact/phone", "site/contact/phone"] })).toEqual({
      lockedFields: "site/contact/phone is listed twice",
    });
  });

  it("refuses an Umami ID in the wrong format, and an overlay over the cap", () => {
    expect(errorsOf({ umamiWebsiteId: "not-a-uuid" })).toHaveProperty("umamiWebsiteId");
    expect(errorsOf({ umamiWebsiteId: "3F2504E0-4F89-41D3-9A0C-0305E82C3301" })).toEqual({});
    expect(errorsOf({ runbookOverlay: "x".repeat(20_001) })).toHaveProperty("runbookOverlay");
  });
});
