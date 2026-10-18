import { z } from "zod";
import { collections, isCollectionName, type CollectionName, type RawContent } from "./collections.js";
import type { FieldMeta } from "./schemas.js";

/**
 * Addresses (PRD D36) name one value in a site's content: the collection, then
 * each list entry's id and each object key on the way down, joined by "/"
 * (`pages/home/sections/featured/heading`, `services/hair/services/haircut/priceLabel`,
 * `site/hours`). A list of plain values, such as a section's paragraphs, is
 * addressed by position. Unlike a JSON Pointer, an address still names the
 * same value after its list is reordered, so a draft survives other edits.
 */

export class AddressError extends Error {}

const SEGMENT = /^[A-Za-z0-9_-]+$/;
const FORBIDDEN = new Set(["__proto__", "prototype", "constructor"]);

export function parseAddress(address: string): { collection: CollectionName; segments: string[] } {
  if (typeof address !== "string" || address.length > 300) throw new AddressError(`"${String(address)}" is not an address`);
  const [collection, ...segments] = address.split("/");
  if (!isCollectionName(collection)) throw new AddressError(`"${address}" doesn't start with a collection name`);
  for (const s of segments) {
    if (!SEGMENT.test(s) || FORBIDDEN.has(s)) throw new AddressError(`"${address}" is not an address`);
  }
  return { collection, segments };
}

const isEntry = (v: unknown): v is { id: unknown } => v !== null && typeof v === "object" && !Array.isArray(v) && "id" in v;

/** Position of the entry with this id, or of a plain value by its position; -1 if neither. */
export function entryIndex(list: unknown[], segment: string): number {
  const byId = list.findIndex((e) => isEntry(e) && e.id === segment);
  if (byId >= 0) return byId;
  if (/^(0|[1-9]\d*)$/.test(segment)) {
    const i = Number(segment);
    if (i < list.length && !isEntry(list[i])) return i;
  }
  return -1;
}

export interface ResolvedAddress {
  collection: CollectionName;
  /** JSON Pointer into the collection document. */
  pointer: string;
  /** The value there, when it exists. */
  node: unknown;
  /** False only for an object key that isn't set yet. */
  exists: boolean;
}

/**
 * Resolves an address against content to a JSON Pointer into its collection
 * document. The last segment may name an object key that isn't set yet; every
 * other segment, and any list entry, must exist.
 */
export function resolveAddress(content: RawContent, address: string): ResolvedAddress {
  const { collection, segments } = parseAddress(address);
  if (!Object.hasOwn(content, collection)) throw new AddressError(`This site has no "${collection}" collection`);
  let node: unknown = content[collection];
  const tokens: string[] = [];
  for (const [i, seg] of segments.entries()) {
    const last = i === segments.length - 1;
    if (Array.isArray(node)) {
      const index = entryIndex(node, seg);
      if (index < 0) throw new AddressError(`Nothing at "${address}": no entry "${seg}"`);
      tokens.push(String(index));
      node = node[index];
    } else if (node !== null && typeof node === "object") {
      if (!Object.hasOwn(node, seg)) {
        if (last) return { collection, pointer: "/" + [...tokens, seg].join("/"), node: undefined, exists: false };
        throw new AddressError(`Nothing at "${address}"`);
      }
      tokens.push(seg);
      node = (node as Record<string, unknown>)[seg];
    } else {
      throw new AddressError(`Nothing at "${address}"`);
    }
  }
  return { collection, pointer: tokens.length ? "/" + tokens.join("/") : "", node, exists: true };
}

/** Whether `address` matches `pattern`, where a `*` segment matches any one segment. */
export function addressMatches(pattern: string, address: string): boolean {
  const p = pattern.split("/");
  const a = address.split("/");
  return p.length === a.length && p.every((seg, i) => seg === "*" || seg === a[i]);
}

/** Every string value in the content with its address and pointer. Content must be valid, so entries have ids. */
export function stringValues(content: RawContent): Array<{ address: string; collection: CollectionName; pointer: string; value: string }> {
  const out: Array<{ address: string; collection: CollectionName; pointer: string; value: string }> = [];
  const walk = (node: unknown, collection: CollectionName, address: string[], pointer: string[]) => {
    if (typeof node === "string") {
      out.push({ address: address.join("/"), collection, pointer: pointer.length ? "/" + pointer.join("/") : "", value: node });
    } else if (Array.isArray(node)) {
      node.forEach((e, i) => walk(e, collection, [...address, isEntry(e) ? String(e.id) : String(i)], [...pointer, String(i)]));
    } else if (node !== null && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) walk(v, collection, [...address, k], [...pointer, k]);
    }
  };
  for (const name of Object.keys(content)) {
    if (isCollectionName(name)) walk(content[name], name, [name], []);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Field metadata by address

type AnySchema = z.ZodType;

function unwrap(schema: AnySchema): AnySchema {
  let s = schema;
  while (s instanceof z.ZodOptional || s instanceof z.ZodNullable) s = s.unwrap() as AnySchema;
  return s;
}

function metaOf(schema: AnySchema): FieldMeta | null {
  let s: AnySchema = schema;
  for (;;) {
    const meta = s.meta() as Partial<FieldMeta> | undefined;
    if (meta && typeof meta.kind === "string" && typeof meta.label === "string") return meta as FieldMeta;
    if (s instanceof z.ZodOptional || s instanceof z.ZodNullable) s = s.unwrap() as AnySchema;
    else return null;
  }
}

export interface FieldInfo extends FieldMeta {
  /** The contract's cap on a text field's length, shared by every site. */
  maxLength?: number;
}

/**
 * The kind, label, description, and length cap of the field at an address,
 * from the contract's schemas (PRD D36); null for a value with none, such as
 * an object that only groups fields. Content is not consulted: list segments
 * may be any id. A site guide may set a tighter limit (fieldLimit).
 */
export function fieldInfo(address: string): FieldInfo | null {
  const { collection, segments } = parseAddress(address);
  let schema: AnySchema | undefined = collections[collection].schema;
  for (const seg of segments) {
    const s: AnySchema = unwrap(schema);
    if (s instanceof z.ZodArray) schema = s.element as AnySchema;
    else if (s instanceof z.ZodObject) schema = (s.shape as Record<string, AnySchema>)[seg];
    else return null;
    if (!schema) return null;
  }
  const meta = metaOf(schema);
  if (!meta) return null;
  const inner = unwrap(schema);
  const maxLength = inner instanceof z.ZodString && typeof inner.maxLength === "number" ? inner.maxLength : undefined;
  return maxLength === undefined ? { ...meta } : { ...meta, maxLength };
}

/** The most characters a field may hold on this site: the tighter of a site guide limit and the contract's cap. */
export function fieldLimit(address: string, limits: Record<string, number> = {}): number | undefined {
  let max = fieldInfo(address)?.maxLength;
  for (const [pattern, limit] of Object.entries(limits)) {
    if (addressMatches(pattern, address) && (max === undefined || limit < max)) max = limit;
  }
  return max;
}

/**
 * The attributes a template puts on the element it renders an editable value
 * into, which the visual editor reads to mark the field (PRD D35). Pass the
 * address whole or in parts: `field("pages", page.id, "hero", "subheadline")`.
 */
export function field(...parts: string[]): { "data-canopy-field": string } {
  const address = parts.join("/");
  parseAddress(address);
  return { "data-canopy-field": address };
}
