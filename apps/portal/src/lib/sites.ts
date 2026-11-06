/**
 * Operator input for a Site, and the rule each field follows (epic 29,
 * section 6; linking, PRD D49). Pure, so the operator forms validate inline
 * with the same definitions the server enforces.
 */

import { isCollectionName } from "@canopy/site-contract";
import { isValidEmail } from "../../embed/src/validation";

export const SITE_NAME_MAX_LENGTH = 100;
export const SITE_SLUG_MAX_LENGTH = 40;
export const SITE_URL_MAX_LENGTH = 300;
export const SITE_BRANCH_MAX_LENGTH = 100;
export const SITE_HOSTNAMES_MAX = 10;
export const SITE_LOCKED_FIELDS_MAX = 50;
export const SITE_LOCKED_FIELD_MAX_LENGTH = 100;
export const SITE_FIXED_LISTS_MAX = 20;
export const RUNBOOK_OVERLAY_MAX_LENGTH = 20_000;

/** Contact fields are locked by default (PRD section 4.4); a new site starts with these, as addresses (D50). */
export const DEFAULT_LOCKED_FIELDS = ["site/contact/phone", "site/contact/email", "site/contact/address"];

// A DNS label short enough to take a "-preview" suffix and stay within 63 characters.
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const HOSTNAME_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const BRANCH_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9._-]+)*$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// An address pattern (PRD D36, D50): a collection, then keys and entry ids, `*` for any one segment.
const ADDRESS_PATTERN = /^([a-z][A-Za-z0-9]*)(?:\/(?:[A-Za-z0-9_-]+|\*))*$/;

// The repo URL shape the builder accepts (apps/builder/src/git.ts).
const GITHUB_REPO = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/;

/** What the operator types to link a live site (PRD D49). */
export type LinkSiteInput = {
  email: string;
  name: string;
  repoUrl: string;
  slug: string;
  productionHostnames: string[];
  umamiWebsiteId: string;
};

export type LinkSite = {
  email: string;
  name: string;
  /** `https://github.com/<owner>/<repo>`, without `.git` or a trailing slash. */
  repoUrl: string;
  slug: string;
  productionHostnames: string[];
  umamiWebsiteId: string | null;
};

export type SiteSettingsInput = {
  name: string;
  repoUrl: string;
  defaultBranch: string;
  productionHostnames: string[];
  umamiWebsiteId: string;
  runbookOverlay: string;
  lockedFields: string[];
  fixedLists: string[];
};

export type SiteSettings = {
  name: string;
  repoUrl: string | null;
  defaultBranch: string;
  productionHostnames: string[];
  umamiWebsiteId: string | null;
  runbookOverlay: string;
  lockedFields: string[];
  fixedLists: string[];
};

export type FieldErrors<T> = Partial<Record<keyof T, string>>;
export type Parsed<T, I> = { ok: true; value: T } | { ok: false; errors: FieldErrors<I> };

/** A slug suggestion from a site name: lowercase, hyphenated, trimmed to the slug length. */
export function suggestSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, SITE_SLUG_MAX_LENGTH)
    .replace(/^-+|-+$/g, "");
}

function nameError(name: string): string | undefined {
  if (!name) return "Name is required";
  if (name.length > SITE_NAME_MAX_LENGTH) return `Name must be ${SITE_NAME_MAX_LENGTH} characters or fewer`;
}

function slugError(slug: string): string | undefined {
  if (!slug) return "Slug is required";
  if (slug.length > SITE_SLUG_MAX_LENGTH) return `Slug must be ${SITE_SLUG_MAX_LENGTH} characters or fewer`;
  if (!SLUG_PATTERN.test(slug)) return "Use lowercase letters, digits, and inner hyphens";
}

/** Lowercase hostname without a trailing dot, or null when it is not one (no scheme, port, path, or wildcard). */
export function normalizeHostname(raw: string): string | null {
  const host = raw.trim().toLowerCase().replace(/\.$/, "");
  if (host.length > 253) return null;
  const labels = host.split(".");
  if (labels.length < 2 || !labels.every((l) => HOSTNAME_LABEL.test(l))) return null;
  if (/^\d+$/.test(labels[labels.length - 1])) return null; // an IP address, not a hostname
  return host;
}

function repoUrlError(url: string): string | undefined {
  if (url.length > SITE_URL_MAX_LENGTH) return `Repository URL must be ${SITE_URL_MAX_LENGTH} characters or fewer`;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "Enter a full https:// URL";
  }
  if (parsed.protocol !== "https:" || !parsed.hostname) return "Enter a full https:// URL";
  // A token in the URL would be a secret stored in plain text and shown in the console.
  if (parsed.username || parsed.password) return "Leave credentials out of the URL";
}

/** The GitHub repo URL in the one form the builder and the site row use, or null when it isn't one. */
export function normalizeGitHubRepo(raw: string): string | null {
  const match = GITHUB_REPO.exec(raw.trim());
  return match ? `https://github.com/${match[1]}/${match[2]}` : null;
}

/** A slug suggestion from a GitHub repo URL: the repo's name, or "" when the URL isn't one yet. */
export function suggestSlugFromRepo(repoUrl: string): string {
  const repo = normalizeGitHubRepo(repoUrl);
  return repo ? suggestSlug(repo.slice(repo.lastIndexOf("/") + 1)) : "";
}

function umamiError(id: string): string | undefined {
  if (id && !UUID_PATTERN.test(id)) return "Enter the website ID from Umami (a UUID)";
}

/** Normalized hostnames, or the first problem with them. Blank rows are dropped. */
function parseHostnames(values: string[]): { hostnames: string[]; error?: string } {
  const hostnames: string[] = [];
  for (const raw of listOf(values, (h) => h.trim())) {
    const host = normalizeHostname(raw);
    if (!host) return { hostnames, error: `"${raw}" is not a hostname. Enter a domain such as example.com, without https://` };
    hostnames.push(host);
  }
  const dup = firstDuplicate(hostnames);
  if (dup) return { hostnames, error: `${dup} is listed twice` };
  if (hostnames.length > SITE_HOSTNAMES_MAX) return { hostnames, error: `At most ${SITE_HOSTNAMES_MAX} hostnames` };
  return { hostnames };
}

function branchError(branch: string): string | undefined {
  if (!branch) return "Branch is required";
  if (branch.length > SITE_BRANCH_MAX_LENGTH) return `Branch must be ${SITE_BRANCH_MAX_LENGTH} characters or fewer`;
  if (!BRANCH_PATTERN.test(branch) || branch.includes("..") || branch.endsWith(".lock")) {
    return "Enter a valid branch name";
  }
}

/** Whether a locked field or fixed list names something in the contract's terms: an address pattern. */
export function isAddressPattern(value: string): boolean {
  const m = ADDRESS_PATTERN.exec(value);
  return !!m && isCollectionName(m[1]) && value.length <= SITE_LOCKED_FIELD_MAX_LENGTH;
}

function addressListError(values: string[], what: { noun: string; example: string; max: number }): string | undefined {
  const bad = values.find((v) => !isAddressPattern(v));
  if (bad) return `"${bad}" is not ${what.noun}. Use an address such as ${what.example}`;
  const dup = firstDuplicate(values);
  if (dup) return `${dup} is listed twice`;
  if (values.length > what.max) return `At most ${what.max}`;
}

function listOf(values: string[], normalize: (v: string) => string): string[] {
  return values.map(normalize).filter((v) => v !== "");
}

function firstDuplicate(values: string[]): string | undefined {
  return values.find((v, i) => values.indexOf(v) !== i);
}

/** Validates and normalizes the Link a site form. A linked site is live, so it has a production hostname. */
export function parseLinkSite(input: LinkSiteInput): Parsed<LinkSite, LinkSiteInput> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const rawRepo = input.repoUrl.trim();
  const repoUrl = normalizeGitHubRepo(rawRepo);
  const slug = input.slug.trim().toLowerCase();
  const umamiWebsiteId = input.umamiWebsiteId.trim().toLowerCase();
  const { hostnames, error: hostnamesError } = parseHostnames(input.productionHostnames);

  const errors: FieldErrors<LinkSiteInput> = {
    email: !email ? "Email is required" : !isValidEmail(email) ? "Enter a valid email address" : undefined,
    name: nameError(name),
    repoUrl: !rawRepo
      ? "Repository is required"
      : rawRepo.length > SITE_URL_MAX_LENGTH
        ? `Repository URL must be ${SITE_URL_MAX_LENGTH} characters or fewer`
        : !repoUrl
          ? "Enter a GitHub repository URL, such as https://github.com/owner/repo"
          : undefined,
    slug: slugError(slug),
    productionHostnames: hostnamesError ?? (hostnames.length === 0 ? "Add the site's hostname" : undefined),
    umamiWebsiteId: umamiError(umamiWebsiteId),
  };
  const found = stripEmpty(errors);
  if (Object.keys(found).length > 0 || !repoUrl) return { ok: false, errors: found };
  return {
    ok: true,
    value: { email, name, repoUrl, slug, productionHostnames: hostnames, umamiWebsiteId: umamiWebsiteId || null },
  };
}

/** Validates and normalizes the site settings form. Blank optional fields become null; blank list rows are dropped. */
export function parseSiteSettings(input: SiteSettingsInput): Parsed<SiteSettings, SiteSettingsInput> {
  const name = input.name.trim();
  const repoUrl = input.repoUrl.trim();
  const defaultBranch = input.defaultBranch.trim();
  const umamiWebsiteId = input.umamiWebsiteId.trim().toLowerCase();
  const runbookOverlay = input.runbookOverlay.replace(/\r\n/g, "\n").trimEnd();
  const { hostnames: productionHostnames, error: hostnamesError } = parseHostnames(input.productionHostnames);
  const lockedFields = listOf(input.lockedFields, (f) => f.trim());
  const fixedLists = listOf(input.fixedLists, (f) => f.trim());

  const errors: FieldErrors<SiteSettingsInput> = {
    name: nameError(name),
    repoUrl: repoUrl ? repoUrlError(repoUrl) : undefined,
    defaultBranch: branchError(defaultBranch),
    productionHostnames: hostnamesError,
    umamiWebsiteId: umamiError(umamiWebsiteId),
    runbookOverlay:
      runbookOverlay.length > RUNBOOK_OVERLAY_MAX_LENGTH
        ? `Overlay must be ${RUNBOOK_OVERLAY_MAX_LENGTH.toLocaleString("en-US")} characters or fewer. (Currently ${runbookOverlay.length.toLocaleString("en-US")})`
        : undefined,
  };

  errors.lockedFields = addressListError(lockedFields, { noun: "a field address", example: "site/contact/phone", max: SITE_LOCKED_FIELDS_MAX });
  errors.fixedLists = addressListError(fixedLists, { noun: "a list address", example: "classes", max: SITE_FIXED_LISTS_MAX });

  const found = stripEmpty(errors);
  if (Object.keys(found).length > 0) return { ok: false, errors: found };

  return {
    ok: true,
    value: {
      name,
      repoUrl: repoUrl || null,
      defaultBranch,
      productionHostnames,
      umamiWebsiteId: umamiWebsiteId || null,
      runbookOverlay,
      lockedFields,
      fixedLists,
    },
  };
}

function stripEmpty<T>(errors: FieldErrors<T>): FieldErrors<T> {
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as FieldErrors<T>;
}
