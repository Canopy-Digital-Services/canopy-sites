/**
 * Formatting utilities for composite field types (NAME, ADDRESS).
 * Used in submission viewer and potentially other display contexts.
 */

export function isCompositeFieldType(type: string): boolean {
  return type === "NAME" || type === "ADDRESS";
}

/**
 * Render any submitted value as human-readable text: booleans as Yes/No,
 * multi-selects comma-joined, composites through their own formatter.
 * Returns "" for empty values and for objects we have no formatter for, so
 * callers can decide how to present "nothing here".
 */
export function formatFieldValue(
  type: string,
  value: unknown,
  options?: unknown
): string {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") {
    if (isCompositeFieldType(type)) {
      return formatCompositeValue(type, value as Record<string, unknown>, options);
    }
    return "";
  }
  return String(value);
}

export function formatCompositeValue(
  type: string,
  value: Record<string, unknown>,
  options?: unknown
): string {
  if (type === "NAME") {
    return formatNameValue(value, options);
  }
  if (type === "ADDRESS") {
    return formatAddressValue(value);
  }
  return JSON.stringify(value);
}

function formatNameValue(
  value: Record<string, unknown>,
  options?: unknown
): string {
  const opts = options as { parts?: string[] } | null;
  const parts = opts?.parts || ["first", "last"];

  const formatted = parts
    .map((part) => {
      const v = String(value[part] || "").trim();
      if (!v) return "";
      // Add period after middle initial
      if (part === "middleInitial" && v.length <= 2 && !v.endsWith(".")) {
        return `${v}.`;
      }
      return v;
    })
    .filter(Boolean);

  return formatted.join(" ");
}

function formatAddressValue(value: Record<string, unknown>): string {
  const line1 = String(value.line1 || "").trim();
  const line2 = String(value.line2 || "").trim();
  const city = String(value.city || "").trim();
  const region = String(value.region || "").trim();
  const postalCode = String(value.postalCode || "").trim();

  const parts: string[] = [];
  if (line1) parts.push(line1);
  if (line2) parts.push(line2);
  if (city) parts.push(city);

  // Region and postalCode are joined with a space, not comma
  const regionZip = [region, postalCode].filter(Boolean).join(" ");
  if (regionZip) parts.push(regionZip);

  return parts.join(", ");
}
