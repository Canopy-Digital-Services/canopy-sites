/**
 * Operator input for a Site, and the rule each field follows (epic 29,
 * section 6). Pure, so the operator form validates inline with the same
 * definitions the server actions enforce.
 */

export const SITE_NAME_MAX_LENGTH = 100;
export const SITE_SLUG_MAX_LENGTH = 40;
export const SITE_URL_MAX_LENGTH = 300;
export const SITE_BRANCH_MAX_LENGTH = 100;
export const SITE_HOSTNAMES_MAX = 10;
export const SITE_LOCKED_FIELDS_MAX = 50;
export const SITE_LOCKED_FIELD_MAX_LENGTH = 100;
export const RUNBOOK_OVERLAY_MAX_LENGTH = 20_000;

/** Contact fields are locked by default (PRD section 4.4); a new site starts with these. */
export const DEFAULT_LOCKED_FIELDS = ["site.contact.phone", "site.contact.email", "site.contact.address"];

// A DNS label short enough to prefix with "preview-" and stay within 63 characters.
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const HOSTNAME_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const BRANCH_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9._-]+)*$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOCKED_FIELD_PATTERN = /^[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)*$/;

export type NewSiteInput = { name: string; slug: string };
export type NewSite = { name: string; slug: string };

export type SiteSettingsInput = {
  name: string;
  repoUrl: string;
  defaultBranch: string;
  productionHostnames: string[];
  contractVersion: string;
  umamiWebsiteId: string;
  runbookOverlay: string;
  lockedFields: string[];
};

export type SiteSettings = {
  name: string;
  repoUrl: string | null;
  defaultBranch: string;
  productionHostnames: string[];
  contractVersion: string | null;
  umamiWebsiteId: string | null;
  runbookOverlay: string;
  lockedFields: string[];
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

function branchError(branch: string): string | undefined {
  if (!branch) return "Branch is required";
  if (branch.length > SITE_BRANCH_MAX_LENGTH) return `Branch must be ${SITE_BRANCH_MAX_LENGTH} characters or fewer`;
  if (!BRANCH_PATTERN.test(branch) || branch.includes("..") || branch.endsWith(".lock")) {
    return "Enter a valid branch name";
  }
}

function listOf(values: string[], normalize: (v: string) => string): string[] {
  return values.map(normalize).filter((v) => v !== "");
}

function firstDuplicate(values: string[]): string | undefined {
  return values.find((v, i) => values.indexOf(v) !== i);
}

export function parseNewSite(input: NewSiteInput): Parsed<NewSite, NewSiteInput> {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  const errors: FieldErrors<NewSiteInput> = { name: nameError(name), slug: slugError(slug) };
  if (errors.name || errors.slug) return { ok: false, errors: stripEmpty(errors) };
  return { ok: true, value: { name, slug } };
}

/** Validates and normalizes the site settings form. Blank optional fields become null; blank list rows are dropped. */
export function parseSiteSettings(input: SiteSettingsInput): Parsed<SiteSettings, SiteSettingsInput> {
  const name = input.name.trim();
  const repoUrl = input.repoUrl.trim();
  const defaultBranch = input.defaultBranch.trim();
  const contractVersion = input.contractVersion.trim().replace(/^v/, "");
  const umamiWebsiteId = input.umamiWebsiteId.trim().toLowerCase();
  const runbookOverlay = input.runbookOverlay.replace(/\r\n/g, "\n").trimEnd();
  const rawHostnames = listOf(input.productionHostnames, (h) => h.trim());
  const lockedFields = listOf(input.lockedFields, (f) => f.trim());

  const errors: FieldErrors<SiteSettingsInput> = {
    name: nameError(name),
    repoUrl: repoUrl ? repoUrlError(repoUrl) : undefined,
    defaultBranch: branchError(defaultBranch),
    contractVersion:
      contractVersion && !VERSION_PATTERN.test(contractVersion) ? "Use MAJOR.MINOR.PATCH, such as 0.1.0" : undefined,
    umamiWebsiteId: umamiWebsiteId && !UUID_PATTERN.test(umamiWebsiteId) ? "Enter the website ID from Umami (a UUID)" : undefined,
    runbookOverlay:
      runbookOverlay.length > RUNBOOK_OVERLAY_MAX_LENGTH
        ? `Overlay must be ${RUNBOOK_OVERLAY_MAX_LENGTH.toLocaleString("en-US")} characters or fewer. (Currently ${runbookOverlay.length.toLocaleString("en-US")})`
        : undefined,
  };

  const productionHostnames: string[] = [];
  for (const raw of rawHostnames) {
    const host = normalizeHostname(raw);
    if (!host) {
      errors.productionHostnames = `"${raw}" is not a hostname. Enter a domain such as example.com, without https://`;
      break;
    }
    productionHostnames.push(host);
  }
  if (!errors.productionHostnames) {
    const dup = firstDuplicate(productionHostnames);
    if (dup) errors.productionHostnames = `${dup} is listed twice`;
    else if (productionHostnames.length > SITE_HOSTNAMES_MAX) {
      errors.productionHostnames = `At most ${SITE_HOSTNAMES_MAX} hostnames`;
    }
  }

  const badField = lockedFields.find(
    (f) => f.length > SITE_LOCKED_FIELD_MAX_LENGTH || !LOCKED_FIELD_PATTERN.test(f)
  );
  if (badField) errors.lockedFields = `"${badField}" is not a field path. Use dotted paths such as site.contact.phone`;
  else if (firstDuplicate(lockedFields)) errors.lockedFields = `${firstDuplicate(lockedFields)} is listed twice`;
  else if (lockedFields.length > SITE_LOCKED_FIELDS_MAX) errors.lockedFields = `At most ${SITE_LOCKED_FIELDS_MAX} locked fields`;

  const found = stripEmpty(errors);
  if (Object.keys(found).length > 0) return { ok: false, errors: found };

  return {
    ok: true,
    value: {
      name,
      repoUrl: repoUrl || null,
      defaultBranch,
      productionHostnames,
      contractVersion: contractVersion || null,
      umamiWebsiteId: umamiWebsiteId || null,
      runbookOverlay,
      lockedFields,
    },
  };
}

function stripEmpty<T>(errors: FieldErrors<T>): FieldErrors<T> {
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as FieldErrors<T>;
}
