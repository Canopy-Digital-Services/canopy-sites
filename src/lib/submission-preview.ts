/**
 * Smart detection of the most "identifying" field for a submission row,
 * used to render the Preview column in the submissions list.
 *
 * Ranking is type-first (NAME beats EMAIL beats PHONE, etc.) with ties
 * broken by declaration order. We skip fields whose value is empty so a
 * blank NAME doesn't win over a filled EMAIL.
 */
import {
  isCompositeFieldType,
  formatCompositeValue,
} from "@/lib/composite-format";

type PreviewField = {
  name: string;
  type: string;
  options: unknown;
};

const PREVIEW_TYPE_PRIORITY = [
  "NAME",
  "EMAIL",
  "PHONE",
  "TEXT",
  "TEXTAREA",
] as const;

const MAX_PREVIEW_LENGTH = 60;

export function buildSubmissionPreview(
  fields: PreviewField[],
  data: Record<string, unknown>
): string {
  const chosen = pickPreviewField(fields, data);
  if (!chosen) return "";

  const raw = data[chosen.name];
  const formatted = formatValue(chosen, raw);
  return truncate(formatted, MAX_PREVIEW_LENGTH);
}

function pickPreviewField(
  fields: PreviewField[],
  data: Record<string, unknown>
): PreviewField | null {
  for (const type of PREVIEW_TYPE_PRIORITY) {
    const candidates = fields.filter((f) => f.type === type);
    for (const f of candidates) {
      if (hasMeaningfulValue(data[f.name])) return f;
    }
  }
  // Last-ditch: first field with any value at all.
  return fields.find((f) => hasMeaningfulValue(data[f.name])) ?? null;
}

function hasMeaningfulValue(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") {
    return Object.values(v as Record<string, unknown>).some(
      (x) => x != null && String(x).trim().length > 0
    );
  }
  return true;
}

function formatValue(field: PreviewField, value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    if (isCompositeFieldType(field.type)) {
      return formatCompositeValue(
        field.type,
        value as Record<string, unknown>,
        field.options
      );
    }
    return "";
  }
  return String(value);
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "\u2026";
}
