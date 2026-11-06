import { addressMatches, AddressError, fieldInfo, parseAddress, stringValues } from "./address.js";
import { collections, isCollectionName, type CollectionName, type RawContent } from "./collections.js";

/**
 * A site guide (`SITE_GUIDE.md`, PRD D31 and D40): YAML front matter that code
 * reads, then prose for the model.
 *
 * ```yaml
 * ---
 * limits:
 *   pages/home/hero/subheadline: 60
 *   services/*\/services/*\/name: 32
 * counts:
 *   team: 6
 *   classes/*\/sessions: 6
 * formats:
 *   phone: "(530) 555-1234"
 * avoid:
 *   - em-dash
 *   - emoji
 *   - "special offer"
 * refuse:
 *   - free trial
 *   - discount*
 *   - "% off"
 * ---
 * ```
 *
 * - `limits`: maximum lengths by address pattern (`*` matches any one
 *   segment), tighter than the contract's caps.
 * - `counts`: the most entries a list may hold, by address pattern.
 * - `formats`: display formats, written as an example value.
 * - `avoid`: what the copy doesn't use, as named checks (AVOID_CHECKS) and
 *   phrases. A match in changed text is a warning: the copy is the owner's
 *   (D32), so they decide.
 * - `refuse`: phrases the site never carries. A match is a refusal.
 *
 * A phrase matches whole words, ignoring case; a trailing `*` matches any
 * ending (`discount*` matches "discounts"). The front matter is a strict
 * subset of YAML: these keys, one level deep, nothing else, so a typo is an
 * error rather than a silently ignored rule.
 */
export interface SiteGuide {
  limits: Record<string, number>;
  counts: Record<string, number>;
  formats: Partial<Record<(typeof FORMAT_KEYS)[number], string>>;
  avoid: { checks: AvoidCheck[]; phrases: string[] };
  refuse: string[];
  prose: string;
}

export const FORMAT_KEYS = ["phone", "price", "time"] as const;
export const AVOID_CHECKS = ["em-dash", "emoji", "all-caps", "exclamations"] as const;
export type AvoidCheck = (typeof AVOID_CHECKS)[number];

const MAP_KEYS = ["limits", "counts", "formats"] as const;
const LIST_KEYS = ["avoid", "refuse"] as const;
type Section = (typeof MAP_KEYS)[number] | (typeof LIST_KEYS)[number];

export class SiteGuideError extends Error {}

const unquote = (v: string) => (/^(["']).*\1$/.test(v) ? v.slice(1, -1) : v);

function checkPattern(key: string, where: string) {
  try {
    parseAddress(key.replace(/\*/g, "x"));
  } catch (err) {
    if (err instanceof AddressError) throw new SiteGuideError(`${where}: "${key}" is not an address pattern`);
    throw err;
  }
}

/** Parses a site guide. A missing guide has no rules. */
export function parseSiteGuide(markdown: string | null | undefined): SiteGuide {
  const guide: SiteGuide = { limits: {}, counts: {}, formats: {}, avoid: { checks: [], phrases: [] }, refuse: [], prose: "" };
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

  const keys = [...MAP_KEYS, ...LIST_KEYS] as readonly string[];
  let section: Section | null = null;
  block.split("\n").forEach((raw, i) => {
    const line = raw.replace(/\s+#.*$/, "");
    if (!line.trim() || line.trim().startsWith("#")) return;
    const where = `Site guide front matter, line ${i + 2}`;
    const top = /^([A-Za-z]+):\s*$/.exec(line);
    if (top) {
      if (!keys.includes(top[1])) throw new SiteGuideError(`${where}: unknown key "${top[1]}" (only ${keys.join(", ")})`);
      section = top[1] as Section;
      return;
    }
    if (section === "avoid" || section === "refuse") {
      const item = /^\s{2,}-\s+(.+?)\s*$/.exec(line);
      if (!item) throw new SiteGuideError(`${where}: expected "  - value" under ${section}`);
      const value = unquote(item[1]).trim();
      if (!value || value.length > 60 || value === "*") throw new SiteGuideError(`${where}: "${value}" is not a phrase (1 to 60 characters)`);
      if (section === "refuse") guide.refuse.push(value);
      else if ((AVOID_CHECKS as readonly string[]).includes(value)) guide.avoid.checks.push(value as AvoidCheck);
      else guide.avoid.phrases.push(value);
      return;
    }
    const entry = /^\s{2,}("[^"]+"|'[^']+'|[^\s:][^:]*?):\s*(.+?)\s*$/.exec(line);
    if (!entry || !section) throw new SiteGuideError(`${where}: expected "  key: value" under ${MAP_KEYS.join(", ")}`);
    const key = unquote(entry[1]);
    const value = unquote(entry[2]);
    if (section === "limits" || section === "counts") {
      checkPattern(key, where);
      const max = section === "limits" ? /^[1-9]\d{0,4}$/ : /^[1-9]\d{0,2}$/;
      if (!max.test(value)) throw new SiteGuideError(`${where}: the ${section === "limits" ? "limit" : "count"} for "${key}" must be a whole number`);
      guide[section][key] = Number(value);
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

const isEntry = (v: unknown): v is { id: string } =>
  v !== null && typeof v === "object" && !Array.isArray(v) && typeof (v as { id?: unknown }).id === "string";

/** Every list in the content with its address, pointer, and length. */
function listValues(content: RawContent): Array<{ address: string; collection: CollectionName; pointer: string; length: number }> {
  const out: Array<{ address: string; collection: CollectionName; pointer: string; length: number }> = [];
  const walk = (node: unknown, collection: CollectionName, address: string[], pointer: string[]) => {
    if (Array.isArray(node)) {
      out.push({ address: address.join("/"), collection, pointer: pointer.length ? "/" + pointer.join("/") : "", length: node.length });
      node.forEach((e, i) => walk(e, collection, [...address, isEntry(e) ? e.id : String(i)], [...pointer, String(i)]));
    } else if (node !== null && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) walk(v, collection, [...address, k], [...pointer, k]);
    }
  };
  for (const name of Object.keys(content)) if (isCollectionName(name)) walk(content[name], name, [name], []);
  return out;
}

function labelOf(address: string): string {
  try {
    const info = fieldInfo(address);
    if (info) return info.label;
  } catch {
    // fall through
  }
  const segments = address.split("/");
  if (segments.length === 1 && isCollectionName(segments[0])) return collections[segments[0]].label;
  const last = segments[segments.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1);
}

/** Every list longer than a site guide count allows. Content must already be valid. */
export function countIssues(content: RawContent, counts: Record<string, number>): LimitIssue[] {
  const patterns = Object.entries(counts);
  if (!patterns.length) return [];
  const issues: LimitIssue[] = [];
  for (const list of listValues(content)) {
    let max = Infinity;
    for (const [pattern, count] of patterns) if (count < max && addressMatches(pattern, list.address)) max = count;
    if (list.length > max) issues.push({ collection: list.collection, path: list.pointer, message: `${labelOf(list.address)}: at most ${max} on this site` });
  }
  return issues;
}

/** A phrase as a pattern: whole words, ignoring case; a trailing `*` matches any ending; any run of spaces matches any whitespace. */
export function phrasePattern(phrase: string): RegExp {
  const open = phrase.endsWith("*");
  const p = open ? phrase.slice(0, -1) : phrase;
  const body = p
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  const word = /[\p{L}\p{N}]/u;
  const start = word.test(p.trim()[0] ?? "") ? "(?<![\\p{L}\\p{N}])" : "";
  const end = !open && word.test(p.trim().slice(-1)) ? "(?![\\p{L}\\p{N}])" : "";
  return new RegExp(start + body + end, "iu");
}

/** Every string that carries a phrase the site guide refuses. Content must already be valid. */
export function refusalIssues(content: RawContent, refuse: readonly string[]): LimitIssue[] {
  if (!refuse.length) return [];
  const patterns = refuse.map((phrase) => ({ phrase, re: phrasePattern(phrase) }));
  const issues: LimitIssue[] = [];
  for (const v of stringValues(content)) {
    for (const { re } of patterns) {
      const m = re.exec(v.value);
      if (m) {
        issues.push({ collection: v.collection, path: v.pointer, message: `This site doesn't say "${m[0]}": that's Canopy's call` });
        break;
      }
    }
  }
  return issues;
}

const CHECKS: Record<AvoidCheck, { re: RegExp; what: string }> = {
  "em-dash": { re: /—/u, what: "an em dash" },
  // Pictographs, not the ©, ®, and ™ signs Unicode also counts as pictographic.
  emoji: { re: /(?![©®™])\p{Extended_Pictographic}/u, what: "an emoji" },
  // Two or more words in capitals in a row: "FREE CLASS", not "IKF" or "BJJ".
  "all-caps": { re: /(?<![\p{L}\p{N}])\p{Lu}{2,}(?:\s+\p{Lu}{2,})+(?![\p{L}\p{N}])/u, what: "words in capitals" },
  exclamations: { re: /!/u, what: "an exclamation mark" },
};

export interface AvoidWarning {
  address: string;
  collection: CollectionName;
  /** JSON Pointer into the collection document. */
  path: string;
  label: string;
  message: string;
}

/**
 * What the site's copy avoids, in text an edit changed or added: warnings for
 * the owner to decide on (D32), never refusals. Text the edit didn't touch is
 * not reported. Both contents must already be valid.
 */
export function avoidWarnings(before: RawContent, after: RawContent, avoid: SiteGuide["avoid"]): AvoidWarning[] {
  const checks = avoid.checks.map((c) => CHECKS[c]);
  const phrases = avoid.phrases.map((phrase) => ({ re: phrasePattern(phrase), what: null as string | null }));
  if (!checks.length && !phrases.length) return [];
  const was = new Map(stringValues(before).map((v) => [v.address, v.value]));
  const out: AvoidWarning[] = [];
  for (const v of stringValues(after)) {
    if (was.get(v.address) === v.value) continue;
    const found: string[] = [];
    for (const c of checks) if (c.re.test(v.value)) found.push(c.what);
    for (const p of phrases) {
      const m = p.re.exec(v.value);
      if (m) found.push(`"${m[0]}"`);
    }
    if (!found.length) continue;
    const label = labelOf(v.address);
    out.push({
      address: v.address,
      collection: v.collection,
      path: v.pointer,
      label,
      message: `${label} has ${found.join(" and ")}, which this site's copy avoids`,
    });
  }
  return out;
}
