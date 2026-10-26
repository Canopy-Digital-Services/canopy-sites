// Tokens that have a default value — DEFAULT_THEME must provide all of these.
// To add a new token with a default: add it here + add the value to DEFAULT_THEME.
type ThemeDefaults = {
  fontSize: number;
  text: string;
  background: string;
  fieldBackground: string;
  primary: string;
  border: string;
  radius: number;
  density: "compact" | "normal" | "comfortable";
  buttonWidth: "full" | "auto";
  buttonAlign: "left" | "center" | "right";
  titleSize: "sm" | "md" | "lg" | "xl";
  titleWeight: "light" | "normal" | "bold";
  titleTransform: "none" | "uppercase";
  labelSize: "sm" | "md" | "lg" | "xl";
  labelWeight: "light" | "normal" | "bold";
  labelTransform: "none" | "uppercase";
};

// Tokens that are optional — no default, omitted when unset.
// To add a new optional token: add it here. No other changes needed.
type ThemeOverrides = {
  bodyFont?: string;
  titleFont?: string;
  labelFont?: string;
  buttonText?: string;
  titleColor?: string;
  labelColor?: string;
  pageBackground?: string;
  cardEnabled?: boolean;
  cardShadow?: "none" | "sm" | "md" | "lg";
  contentWidth?: "sm" | "md" | "lg";
  verticalAlign?: "top" | "center";
  /** @deprecated Sets titleFont and labelFont where they are unset. The title
      and labels shared one heading style until 2026-10. */
  headingFont?: string;
  /** @deprecated Use bodyFont instead */
  fontFamily?: string;
  /** @deprecated Use ensureFontsLoaded instead */
  fontUrl?: string;
};

// Stored themes only include tokens the user has set, so defaults are partial.
type ThemeTokens = Partial<ThemeDefaults> & ThemeOverrides;

const DEFAULT_THEME: ThemeDefaults & ThemeOverrides = {
  fontSize: 14,
  text: "#18181b",
  background: "#ffffff",
  fieldBackground: "#ffffff",
  primary: "#005F6A",
  border: "#e4e4e7",
  radius: 4,
  density: "normal",
  buttonWidth: "full",
  buttonAlign: "left",
  titleSize: "md",
  titleWeight: "normal",
  titleTransform: "none",
  labelSize: "md",
  labelWeight: "normal",
  labelTransform: "none",
};

const loadedFonts = new Set<string>();

function normalizeColor(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  if (
    /^var\(/i.test(trimmed) ||
    /^rgb/i.test(trimmed) ||
    /^hsl/i.test(trimmed) ||
    /^color\(/i.test(trimmed) ||
    /^(transparent|currentcolor|inherit)$/i.test(trimmed)
  ) {
    return trimmed;
  }

  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed)) {
    return trimmed;
  }

  if (/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed)) {
    return `#${trimmed}`;
  }

  return fallback;
}

/** Reads the legacy headingFont as both fonts, unless the theme sets them. */
function upgradeLegacy(theme: ThemeTokens | null | undefined): ThemeTokens {
  if (!theme) return {};
  const { headingFont, ...rest } = theme;
  if (!headingFont) return rest;
  return { titleFont: headingFont, labelFont: headingFont, ...rest };
}

export function resolveTheme(
  formTheme: ThemeTokens | null | undefined,
  overrideTheme: ThemeTokens | null | undefined
) {
  return {
    ...DEFAULT_THEME,
    ...upgradeLegacy(formTheme),
    ...upgradeLegacy(overrideTheme),
  };
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastingTextColor(hex: string): string {
  try {
    const rgb = hexToRgb(hex);
    if (!rgb) return "#ffffff";
    return relativeLuminance(...rgb) > 0.179 ? "#18181b" : "#ffffff";
  } catch {
    return "#ffffff";
  }
}

export function applyTheme(container: HTMLElement, theme: ThemeTokens) {
  // Resolve body font: prefer new bodyFont, fall back to legacy fontFamily
  const bodyFontFamily = resolveFont(theme.bodyFont, theme.fontFamily);
  container.style.setProperty("--canopy-font", bodyFontFamily);

  // Title and label fonts fall back to the body font
  for (const [prop, font] of [
    ["--canopy-title-font", theme.titleFont],
    ["--canopy-label-font", theme.labelFont],
  ] as const) {
    const family = resolveFont(font);
    container.style.setProperty(prop, family === "inherit" ? "var(--canopy-font)" : family);
  }

  container.style.setProperty(
    "--canopy-font-size",
    `${theme.fontSize ?? DEFAULT_THEME.fontSize}px`
  );
  container.style.setProperty(
    "--canopy-text",
    normalizeColor(theme.text, DEFAULT_THEME.text)
  );
  container.style.setProperty(
    "--canopy-bg",
    normalizeColor(theme.background, DEFAULT_THEME.background)
  );
  container.style.setProperty(
    "--canopy-field-bg",
    normalizeColor(theme.fieldBackground, DEFAULT_THEME.fieldBackground)
  );
  const resolvedPrimary = normalizeColor(theme.primary, DEFAULT_THEME.primary);
  container.style.setProperty("--canopy-primary", resolvedPrimary);
  container.style.setProperty(
    "--canopy-button-text",
    contrastingTextColor(resolvedPrimary)
  );
  container.style.setProperty(
    "--canopy-border",
    normalizeColor(theme.border, DEFAULT_THEME.border)
  );
  container.style.setProperty(
    "--canopy-radius",
    `${theme.radius ?? DEFAULT_THEME.radius}px`
  );
  container.style.setProperty(
    "--canopy-button-width",
    theme.buttonWidth === "auto" ? "auto" : "100%"
  );
  container.style.setProperty(
    "--canopy-button-align",
    theme.buttonAlign || DEFAULT_THEME.buttonAlign
  );

  const sizeMap = { sm: "1.25em", md: "1.5em", lg: "1.875em", xl: "2.25em" };
  container.style.setProperty("--canopy-title-size", sizeMap[theme.titleSize ?? "md"]);
  container.style.setProperty("--canopy-label-size", sizeMap[theme.labelSize ?? "md"]);

  // Legacy: stored themes may have "semibold" (title) or "medium" (label)
  const weightMap: Record<string, string> = {
    light: "300",
    normal: "400",
    medium: "500",
    bold: "700",
    semibold: "700",
  };
  container.style.setProperty("--canopy-title-weight", weightMap[theme.titleWeight ?? "normal"] ?? "400");
  container.style.setProperty("--canopy-label-weight", weightMap[theme.labelWeight ?? "normal"] ?? "400");

  for (const [prop, color] of [
    ["--canopy-title-color", theme.titleColor],
    ["--canopy-label-color", theme.labelColor],
  ] as const) {
    const resolved = color ? normalizeColor(color, "") : "";
    if (resolved) {
      container.style.setProperty(prop, resolved);
    } else {
      container.style.removeProperty(prop);
    }
  }

  container.style.setProperty("--canopy-title-transform", theme.titleTransform === "uppercase" ? "uppercase" : "none");
  container.style.setProperty("--canopy-label-transform", theme.labelTransform === "uppercase" ? "uppercase" : "none");
}

export function getDensityClass(theme: ThemeTokens) {
  switch (theme.density) {
    case "compact":
      return "canopy-density-compact";
    case "comfortable":
      return "canopy-density-comfortable";
    default:
      return "canopy-density-normal";
  }
}

/**
 * Resolves a font value to a CSS font-family string.
 * "inherit" or absent → "inherit"
 * A Google Font name → "'Font Name', sans-serif"
 */
function resolveFont(font?: string, legacyFontFamily?: string): string {
  if (font && font !== "inherit") {
    return `'${font}', sans-serif`;
  }
  // Fall back to legacy fontFamily if provided (old stored format)
  if (legacyFontFamily && legacyFontFamily !== "inherit") {
    return legacyFontFamily;
  }
  return "inherit";
}

/**
 * Loads the given font families in a single combined request to the portal's
 * /api/fonts, which serves self-hosted families and falls back to Google for
 * the rest. Deduplicates — will not inject a stylesheet for a family already
 * loaded. Ignores "inherit" and empty values.
 */
export function ensureFontsLoaded(families: (string | undefined)[], baseUrl: string) {
  const toLoad = families.filter(
    (f): f is string => !!f && f !== "inherit" && !loadedFonts.has(f)
  );

  if (toLoad.length === 0) return;

  const params = toLoad.map((f) => `family=${encodeURIComponent(f)}`).join("&");
  const url = `${baseUrl}/api/fonts?${params}`;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.dataset.canopyFont = "true";
  document.head.appendChild(link);

  toLoad.forEach((f) => loadedFonts.add(f));
}

/**
 * @deprecated Use ensureFontsLoaded instead.
 * Kept for backward compatibility with any external callers.
 */
export function ensureFontLoaded(fontUrl?: string) {
  if (!fontUrl || loadedFonts.has(fontUrl)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = fontUrl;
  link.dataset.canopyFont = "true";
  document.head.appendChild(link);
  loadedFonts.add(fontUrl);
}

export type { ThemeTokens };
