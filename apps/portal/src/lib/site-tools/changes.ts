/**
 * What an edit changed, field by field (Epic 40, 4.2): the list a proposal
 * hands back to the model, so it can check its work against what the owner
 * asked for and name each change in its reply, and the canvas gets with a
 * save. Computed from the content before and after, never from the ops, so it
 * is what the site will show, whatever the ops said.
 */

import { collections, fieldInfo, isCollectionName, type RawContent } from "@canopy/site-contract";

export interface FieldChange {
  address: string;
  kind: "changed" | "set" | "cleared" | "added" | "removed" | "reordered";
  /** What the owner would call it: "Muay Thai Fundamentals: Description". */
  label: string;
  before?: string;
  after?: string;
  /** One line for the model or the owner. */
  text: string;
}

const MAX_SHOWN = 200;

const show = (v: unknown) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > MAX_SHOWN ? `${s.slice(0, MAX_SHOWN - 1)}…` : s;
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => v !== null && typeof v === "object" && !Array.isArray(v);
const isEntry = (v: unknown): v is Obj & { id: string } => isObj(v) && typeof v.id === "string";

const DAY_SHORT: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

/** An entry's own name, title, or question, when it has one. */
function ownName(e: Obj): string | null {
  for (const key of ["name", "title", "author", "question", "message"]) {
    if (typeof e[key] === "string") return e[key] as string;
  }
  return null;
}

/** What an entry is called: its own name, or a session's days and times, or its id. */
function entryName(e: Obj & { id: string }): string {
  const own = ownName(e);
  if (own) return own;
  if (Array.isArray(e.days) && typeof e.starts === "string" && typeof e.ends === "string") {
    return `${e.days.map((d) => DAY_SHORT[String(d)] ?? d).join(", ")} ${e.starts} to ${e.ends}`;
  }
  return e.id;
}

/** Who a field inside an entry belongs to: the entry's own name, or its description under its parent ("Fundamentals (Mon 19:00 to 20:00)"). */
function ownerOf(e: Obj & { id: string }, parent: string | null): string {
  const own = ownName(e);
  if (own) return own;
  return parent ? `${parent} (${entryName(e)})` : entryName(e);
}

function fieldLabel(address: string): string {
  try {
    const info = fieldInfo(address);
    if (info) return info.label;
  } catch {
    // An address the contract can't place; name it by its last segment.
  }
  const segments = address.split("/");
  if (segments.length === 1 && isCollectionName(segments[0])) return collections[segments[0]].label;
  const last = segments[segments.length - 1];
  return /^\d+$/.test(last) ? `Item ${Number(last) + 1}` : last.charAt(0).toUpperCase() + last.slice(1);
}

const withOwner = (owner: string | null, label: string) => (owner ? `${owner}: ${label}` : label);

function walk(before: unknown, after: unknown, address: string, owner: string | null, out: FieldChange[]) {
  if (JSON.stringify(before) === JSON.stringify(after)) return;

  if (isObj(before) && isObj(after)) {
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      walk(before[key], after[key], `${address}/${key}`, owner, out);
    }
    return;
  }

  if (Array.isArray(before) && Array.isArray(after) && before.every(isEntry) && after.every(isEntry) && (before.length || after.length)) {
    const list = withOwner(owner, fieldLabel(address));
    const was = new Map(before.map((e) => [e.id, e]));
    const now = new Map(after.map((e) => [e.id, e]));
    for (const e of before) {
      if (!now.has(e.id)) {
        const name = entryName(e);
        out.push({ address: `${address}/${e.id}`, kind: "removed", label: list, before: name, text: `Removed "${show(name)}" from ${list}` });
      }
    }
    for (const e of after) {
      const prior = was.get(e.id);
      if (!prior) {
        const name = entryName(e);
        out.push({ address: `${address}/${e.id}`, kind: "added", label: list, after: name, text: `Added "${show(name)}" to ${list}` });
      } else {
        // Named as it was, so a session whose time changed is the one the owner knew.
        walk(prior, e, `${address}/${e.id}`, ownerOf(prior as Obj & { id: string }, owner), out);
      }
    }
    const kept = (ids: string[], other: Map<string, unknown>) => ids.filter((id) => other.has(id)).join("\n");
    if (kept(before.map((e) => e.id), now) !== kept(after.map((e) => e.id), was)) {
      out.push({ address, kind: "reordered", label: list, text: `Reordered ${list}` });
    }
    return;
  }

  const label = withOwner(owner, fieldLabel(address));
  if (before === undefined) {
    out.push({ address, kind: "set", label, after: show(after), text: `${label}: set to "${show(after)}"` });
  } else if (after === undefined) {
    out.push({ address, kind: "cleared", label, before: show(before), text: `${label}: cleared (was "${show(before)}")` });
  } else {
    out.push({ address, kind: "changed", label, before: show(before), after: show(after), text: `${label}: "${show(before)}" to "${show(after)}"` });
  }
}

/** Every field an edit changed, and every entry it added, removed, or reordered, in content order. */
export function changedFields(before: RawContent, after: RawContent): FieldChange[] {
  const out: FieldChange[] = [];
  for (const name of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (!isCollectionName(name)) continue;
    walk(before[name], after[name], name, null, out);
  }
  return out;
}
