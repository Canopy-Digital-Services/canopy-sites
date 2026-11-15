/**
 * The bytes a `Range` header asks for, of a file `size` long: `null` for no
 * usable range (none sent, several at once, or not in bytes), which gets the
 * whole file, and `"unsatisfiable"` for one that starts past the end (416).
 * A video player seeks with these, and Safari plays nothing without them.
 */
export function parseRange(header: string | null, size: number): { start: number; end: number } | "unsatisfiable" | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header?.trim() ?? "");
  if (!match || (match[1] === "" && match[2] === "")) return null;
  if (match[1] === "") {
    // The last N bytes.
    const length = Number(match[2]);
    if (length === 0 || size === 0) return "unsatisfiable";
    return { start: Math.max(0, size - length), end: size - 1 };
  }
  const start = Number(match[1]);
  const end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
  if (!Number.isSafeInteger(start) || start >= size) return "unsatisfiable";
  if (end < start) return null;
  return { start, end };
}
