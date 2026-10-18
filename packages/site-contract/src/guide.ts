import { addressMatches, AddressError, parseAddress, stringValues } from "./address.js";
import type { RawContent } from "./collections.js";

/**
 * A site guide (`SITE_GUIDE.md`, PRD D31 and D40): YAML front matter that code
 * reads, then prose for the model.
 *
 * ```yaml
 * ---
 * limits:
 *   pages/home/hero/subheadline: 60
 *   services/*\/services/*\/name: 32
 * formats:
 *   phone: "(530) 555-1234"
 * ---
 * ```
 *
 * Limits are maximum lengths by address pattern (`*` matches any one segment),
 * tighter than the contract's caps. Formats are display formats, written as an
 * example value. The front matter is a strict subset of YAML: the two maps
 * above, one level deep, nothing else, so a typo is an error rather than a
 * silently ignored rule.
 */
export interface SiteGuide {
  limits: Record<string, number>;
  formats: Partial<Record<(typeof FORMAT_KEYS)[number], string>>;
  prose: string;
}

export const FORMAT_KEYS = ["phone", "price", "time"] as const;

export class SiteGuideError extends Error {}

const unquote = (v: string) => (/^(["']).*\1$/.test(v) ? v.slice(1, -1) : v);

/** Parses a site guide. A missing guide has no limits and no formats. */
export function parseSiteGuide(markdown: string | null | undefined): SiteGuide {
  const guide: SiteGuide = { limits: {}, formats: {}, prose: "" };
  if (!markdown) return guide;
  const text = markdown.replace(/\r\n/g, "\n");
  const open = /^---\n/.exec(text);
  if (!open) {
    guide.prose = text.trim();
    return guide;
  }
  const close = text.indexOf("\n---", 3);
  if (close < 0 || !/^\n---(\n|$)/.test(text.slice(close, close + 5))) throw new SiteGuideError("The site guide's front matter has no closing ---");
  const block = text.slice(4, close + 1);
  guide.prose = text.slice(close + 4).trim();

  let section: "limits" | "formats" | null = null;
  block.split("\n").forEach((raw, i) => {
    const line = raw.replace(/\s+#.*$/, "");
    if (!line.trim() || line.trim().startsWith("#")) return;
    const where = `Site guide front matter, line ${i + 2}`;
    const top = /^([A-Za-z]+):\s*$/.exec(line);
    if (top) {
      if (top[1] !== "limits" && top[1] !== "formats") throw new SiteGuideError(`${where}: unknown key "${top[1]}" (only limits and formats)`);
      section = top[1] as "limits" | "formats";
      return;
    }
    const entry = /^\s{2,}("[^"]+"|'[^']+'|[^\s:][^:]*?):\s*(.+?)\s*$/.exec(line);
    if (!entry || !section) throw new SiteGuideError(`${where}: expected "  key: value" under limits or formats`);
    const key = unquote(entry[1]);
    const value = unquote(entry[2]);
    if (section === "limits") {
      try {
        parseAddress(key.replace(/\*/g, "x"));
      } catch (err) {
        if (err instanceof AddressError) throw new SiteGuideError(`${where}: "${key}" is not an address pattern`);
        throw err;
      }
      if (!/^[1-9]\d{0,4}$/.test(value)) throw new SiteGuideError(`${where}: the limit for "${key}" must be a whole number of characters`);
      guide.limits[key] = Number(value);
    } else {
      if (!(FORMAT_KEYS as readonly string[]).includes(key)) throw new SiteGuideError(`${where}: unknown format "${key}" (${FORMAT_KEYS.join(", ")})`);
      guide.formats[key as (typeof FORMAT_KEYS)[number]] = value;
    }
  });
  return guide;
}

export interface LimitIssue {
  collection: string;
  path: string;
  message: string;
}

/**
 * Every string longer than a site guide limit allows. Content must already be
 * valid against the contract, so every list entry has its id.
 */
export function limitIssues(content: RawContent, limits: Record<string, number>): LimitIssue[] {
  const patterns = Object.entries(limits);
  if (!patterns.length) return [];
  const issues: LimitIssue[] = [];
  for (const v of stringValues(content)) {
    let max = Infinity;
    for (const [pattern, limit] of patterns) if (limit < max && addressMatches(pattern, v.address)) max = limit;
    if (v.value.length > max) issues.push({ collection: v.collection, path: v.pointer, message: `Must be ${max} characters or fewer on this site` });
  }
  return issues;
}
