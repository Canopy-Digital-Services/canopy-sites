/**
 * The ChangeSet op format: a JSON Patch operation (RFC 6902 subset) aimed at
 * one collection document. The portal applies ops to propose and check a
 * change; the builder applies the same ops to the working tree. Both use this
 * function, so the two can never disagree about what an op does.
 */
export interface ChangeOp {
  collection: string;
  op: "add" | "remove" | "replace" | "move";
  /** JSON Pointer into the collection document, e.g. /0/services/1/priceLabel */
  path: string;
  value?: unknown;
  /** Source pointer for `move`. */
  from?: string;
}

export class PatchError extends Error {}

const FORBIDDEN = new Set(["__proto__", "prototype", "constructor"]);

function parsePointer(pointer: string): string[] {
  if (pointer === "") return [];
  if (!pointer.startsWith("/")) throw new PatchError(`"${pointer}" is not a JSON Pointer (it must start with /)`);
  return pointer
    .slice(1)
    .split("/")
    .map((t) => {
      const token = t.replace(/~1/g, "/").replace(/~0/g, "~");
      if (FORBIDDEN.has(token)) throw new PatchError(`"${pointer}" is not an allowed path`);
      return token;
    });
}

type Container = Record<string, unknown> | unknown[];

function parentOf(doc: unknown, tokens: string[], pointer: string): { parent: Container; key: string } {
  if (tokens.length === 0) throw new PatchError("An op can't replace a whole collection; target a field inside it");
  let node: unknown = doc;
  for (const token of tokens.slice(0, -1)) {
    if (Array.isArray(node)) {
      const i = arrayIndex(node, token, pointer, false);
      node = node[i];
    } else if (node !== null && typeof node === "object" && Object.hasOwn(node, token)) {
      node = (node as Record<string, unknown>)[token];
    } else {
      throw new PatchError(`Nothing at "${pointer}"`);
    }
  }
  if (node === null || typeof node !== "object") throw new PatchError(`Nothing at "${pointer}"`);
  return { parent: node as Container, key: tokens[tokens.length - 1] };
}

function arrayIndex(arr: unknown[], token: string, pointer: string, allowEnd: boolean): number {
  if (allowEnd && token === "-") return arr.length;
  if (!/^(0|[1-9]\d*)$/.test(token)) throw new PatchError(`"${token}" in "${pointer}" is not a list position`);
  const i = Number(token);
  if (i > arr.length || (!allowEnd && i === arr.length)) throw new PatchError(`Position ${i} in "${pointer}" is past the end of the list`);
  return i;
}

function remove(doc: unknown, pointer: string): unknown {
  const { parent, key } = parentOf(doc, parsePointer(pointer), pointer);
  if (Array.isArray(parent)) {
    const i = arrayIndex(parent, key, pointer, false);
    return parent.splice(i, 1)[0];
  }
  if (!Object.hasOwn(parent, key)) throw new PatchError(`Nothing at "${pointer}"`);
  const value = parent[key];
  delete parent[key];
  return value;
}

function add(doc: unknown, pointer: string, value: unknown) {
  const { parent, key } = parentOf(doc, parsePointer(pointer), pointer);
  if (Array.isArray(parent)) parent.splice(arrayIndex(parent, key, pointer, true), 0, value);
  else parent[key] = value;
}

function replace(doc: unknown, pointer: string, value: unknown) {
  const { parent, key } = parentOf(doc, parsePointer(pointer), pointer);
  if (Array.isArray(parent)) parent[arrayIndex(parent, key, pointer, false)] = value;
  else {
    if (!Object.hasOwn(parent, key)) throw new PatchError(`Nothing at "${pointer}" to replace; use add`);
    parent[key] = value;
  }
}

/**
 * Applies ops in order to a deep copy of `content` (collection name → document)
 * and returns the copy. Throws PatchError with a readable reason on the first
 * op that can't apply; `content` is never modified.
 */
export function applyChanges<T extends Record<string, unknown>>(content: T, ops: readonly ChangeOp[]): T {
  const out = structuredClone(content) as Record<string, unknown>;
  ops.forEach((op, n) => {
    const where = `Change ${n + 1} (${op.collection} ${op.path})`;
    if (!Object.hasOwn(out, op.collection)) throw new PatchError(`${where}: this site has no "${op.collection}" collection`);
    try {
      const doc = out[op.collection];
      switch (op.op) {
        case "add":
          if (op.value === undefined) throw new PatchError("add needs a value");
          add(doc, op.path, structuredClone(op.value));
          break;
        case "replace":
          if (op.value === undefined) throw new PatchError("replace needs a value");
          replace(doc, op.path, structuredClone(op.value));
          break;
        case "remove":
          remove(doc, op.path);
          break;
        case "move": {
          if (typeof op.from !== "string") throw new PatchError("move needs from");
          const value = remove(doc, op.from);
          add(doc, op.path, value);
          break;
        }
        default:
          throw new PatchError(`Unknown op "${(op as { op: string }).op}"`);
      }
    } catch (err) {
      if (err instanceof PatchError) throw new PatchError(`${where}: ${err.message}`);
      throw err;
    }
  });
  return out as T;
}
