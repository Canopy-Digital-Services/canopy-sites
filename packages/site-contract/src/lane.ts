import { AddressError, addressMatches, fieldInfo, parseAddress } from "./address.js";
import { collections, isCollectionName, type RawContent } from "./collections.js";

/**
 * The lane (PRD D50): what an owner's edit may change. Three rules, checked
 * between the published content and the content after an edit:
 *
 * - **Canopy's fields** (`canopy` in the contract's field metadata: ids, page
 *   paths, navigation labels, SEO fields, eyebrows, buttons) keep their
 *   values. One goes away only with the list entry that holds it, and a new
 *   entry brings only its id.
 * - **Locks** (a site's `lockedFields`): address patterns, `*` for any one
 *   segment. A lock covers the value at its address and everything under it.
 * - **Fixed lists** (a site's own, plus `FIXED_EVERYWHERE`): an owner can't
 *   add, remove, or reorder their entries; the fields inside stay editable
 *   unless locked or Canopy's.
 */

/** Lists fixed on every site: pages and their sections are Canopy's to add, remove, or reorder. */
export const FIXED_EVERYWHERE: readonly string[] = ["pages", "pages/*/sections"];

export interface LaneRules {
  /** Address patterns whose values an owner can't change. */
  locked?: readonly string[];
  /** Address patterns of lists whose entries an owner can't add, remove, or reorder. */
  fixed?: readonly string[];
}

export type LaneReason = "canopy" | "locked" | "fixed";

export interface LaneViolation {
  address: string;
  /** The field's label, for the owner and the model. */
  label: string;
  reason: LaneReason;
  message: string;
}

export class LaneRuleError extends Error {}

interface Walked {
  /** Every value by address, as JSON, the collection roots included. */
  nodes: Map<string, string>;
  /** Canopy's fields by address, as JSON. Nothing under one is listed separately. */
  canopy: Map<string, string>;
  /** Every list by address: its entries' ids in order, or its length for a list of plain values. */
  lists: Map<string, string>;
  /** The address of every list entry that has an id. */
  entries: Set<string>;
}

const isEntry = (v: unknown): v is { id: string } =>
  v !== null && typeof v === "object" && !Array.isArray(v) && typeof (v as { id?: unknown }).id === "string";

function walk(content: RawContent): Walked {
  const out: Walked = { nodes: new Map(), canopy: new Map(), lists: new Map(), entries: new Set() };
  const visit = (node: unknown, address: string, underCanopy: boolean) => {
    out.nodes.set(address, JSON.stringify(node));
    let canopyHere = underCanopy;
    if (!underCanopy && address.includes("/")) {
      const info = safeInfo(address);
      if (info?.canopy) {
        out.canopy.set(address, JSON.stringify(node));
        canopyHere = true;
      }
    }
    if (Array.isArray(node)) {
      out.lists.set(address, node.every(isEntry) ? JSON.stringify(node.map((e) => e.id)) : `#${node.length}`);
      node.forEach((e, i) => {
        const child = `${address}/${isEntry(e) ? e.id : i}`;
        if (isEntry(e)) out.entries.add(child);
        visit(e, child, canopyHere);
      });
    } else if (node !== null && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) visit(v, `${address}/${k}`, canopyHere);
    }
  };
  for (const name of Object.keys(content)) if (isCollectionName(name)) visit(content[name], name, false);
  return out;
}

function safeInfo(address: string) {
  try {
    return fieldInfo(address);
  } catch {
    return null;
  }
}

function labelFor(address: string): string {
  const info = safeInfo(address);
  if (info) return info.label;
  const segments = address.split("/");
  if (segments.length === 1 && isCollectionName(segments[0])) return collections[segments[0]].label;
  const last = segments[segments.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

function checkPatterns(patterns: readonly string[], what: string) {
  for (const p of patterns) {
    try {
      parseAddress(p.replace(/\*/g, "x"));
    } catch (err) {
      if (err instanceof AddressError) throw new LaneRuleError(`${what} "${p}" is not an address pattern, like site/contact/phone`);
      throw err;
    }
  }
}

/** Whether a proper ancestor of `address` was a list entry before and is gone after. */
function entryRemoved(address: string, before: Walked, after: Walked): boolean {
  const segments = address.split("/");
  for (let n = segments.length - 1; n >= 2; n--) {
    const prefix = segments.slice(0, n).join("/");
    if (before.entries.has(prefix) && !after.nodes.has(prefix)) return true;
  }
  return false;
}

/**
 * Every way the content after an owner's edit leaves the lane, compared with
 * the content before it (the published content, or the draft the edit
 * started from). Empty means the edit may go ahead. Throws LaneRuleError when
 * a lock or fixed list isn't an address pattern, so a misconfigured guardrail
 * is never silently off.
 */
export function laneViolations(before: RawContent, after: RawContent, rules: LaneRules = {}): LaneViolation[] {
  const locked = rules.locked ?? [];
  const fixed = [...FIXED_EVERYWHERE, ...(rules.fixed ?? [])];
  checkPatterns(locked, "Locked field");
  checkPatterns(fixed, "Fixed list");

  const a = walk(before);
  const b = walk(after);
  const out: LaneViolation[] = [];
  const add = (address: string, reason: LaneReason) => {
    const label = labelFor(address);
    const message =
      reason === "canopy"
        ? `${label} is Canopy's to change`
        : reason === "locked"
          ? `${label} is locked: Canopy changes it`
          : `${label}: only Canopy adds, removes, or reorders these`;
    out.push({ address, label, reason, message });
  };

  for (const address of new Set([...a.canopy.keys(), ...b.canopy.keys()])) {
    const was = a.canopy.get(address);
    const now = b.canopy.get(address);
    if (was !== undefined && now !== undefined) {
      if (was !== now) add(address, "canopy");
    } else if (was !== undefined) {
      if (!entryRemoved(address, a, b)) add(address, "canopy");
    } else if (safeInfo(address)?.kind !== "id") {
      add(address, "canopy");
    }
  }

  const allNodes = new Set([...a.nodes.keys(), ...b.nodes.keys()]);
  for (const pattern of locked) {
    for (const address of allNodes) {
      if (addressMatches(pattern, address) && a.nodes.get(address) !== b.nodes.get(address)) add(address, "locked");
    }
  }

  const allLists = new Set([...a.lists.keys(), ...b.lists.keys()]);
  for (const pattern of fixed) {
    for (const address of allLists) {
      if (!addressMatches(pattern, address)) continue;
      const was = a.lists.get(address) ?? "[]";
      const now = b.lists.get(address) ?? "[]";
      if (was !== now) add(address, "fixed");
    }
  }

  // One report per address, the first reason found.
  const seen = new Set<string>();
  return out.filter((v) => (seen.has(v.address) ? false : (seen.add(v.address), true)));
}
