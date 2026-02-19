type ThemeTokens = {
  // New font fields (family name only, e.g. "Inter" or "inherit")
  bodyFont?: string;
  headingFont?: string;
  fontSize?: number;
  text?: string;
  background?: string;
  fieldBackground?: string;
  primary?: string;
  border?: string;
  radius?: number;
  density?: "compact" | "normal" | "comfortable";
  buttonWidth?: "full" | "auto";
  buttonAlign?: "left" | "center" | "right";
  buttonText?: string;
  // Title style controls
  titleSize?: "sm" | "md" | "lg" | "xl";
  titleWeight?: "normal" | "semibold" | "bold";
  titleColor?: string;
  // Label controls
  labelWeight?: "normal" | "medium" | "semibold";
  labelTransform?: "none" | "uppercase";
  // Legacy fields — still read for backward compatibility
  fontFamily?: string;
  fontUrl?: string;
};

const DEFAULT_THEME: Required<Omit<ThemeTokens, "bodyFont" | "headingFont" | "fontUrl" | "fontFamily" | "buttonText">> & {
  bodyFont?: string;
  headingFont?: string;
  fontUrl?: string;
  fontFamily?: string;
  buttonText?: string;
} = {
  fontSize: 14,
  text: "#18181b",
  background: "#ffffff",
  fieldBackground: "#ffffff",
  primary: "#005F6A",
  border: "#e4e4e7",
  radius: 8,
  density: "normal",
  buttonWidth: "full",
  buttonAlign: "left",
  bodyFont: undefined,
  headingFont: undefined,
  fontUrl: undefined,
  fontFamily: undefined,
  buttonText: undefined,
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

export function resolveTheme(
  formTheme: ThemeTokens | null | undefined,
  overrideTheme: ThemeTokens | null | undefined
) {
  return {
    ...DEFAULT_THEME,
    ...(formTheme ?? {}),
    ...(overrideTheme ?? {}),
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

  // Resolve heading font: prefer new headingFont, fall back to body font
  const headingFontFamily = resolveFont(theme.headingFont);
  container.style.setProperty(
    "--canopy-heading-font",
    headingFontFamily === "inherit" ? "var(--canopy-font)" : headingFontFamily
  );

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

  const titleSizeMap = { sm: "1em", md: "1.25em", lg: "1.5em", xl: "1.875em" };
  container.style.setProperty("--canopy-title-size", titleSizeMap[theme.titleSize ?? "md"]);

  const titleWeightMap = { normal: "400", semibold: "600", bold: "700" };
  container.style.setProperty("--canopy-title-weight", titleWeightMap[theme.titleWeight ?? "semibold"]);

  const resolvedTitleColor = theme.titleColor ? normalizeColor(theme.titleColor, "") : "";
  if (resolvedTitleColor) {
    container.style.setProperty("--canopy-title-color", resolvedTitleColor);
  } else {
    container.style.removeProperty("--canopy-title-color");
  }

  const labelWeightMap = { normal: "400", medium: "500", semibold: "600" };
  container.style.setProperty("--canopy-label-weight", labelWeightMap[theme.labelWeight ?? "medium"]);
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
 * Loads Google Fonts for the given family names in a single combined request.
 * Deduplicates — will not inject a stylesheet for a family already loaded.
 * Ignores "inherit" and empty values.
 */
export function ensureFontsLoaded(families: (string | undefined)[]) {
  const toLoad = families.filter(
    (f): f is string => !!f && f !== "inherit" && !loadedFonts.has(f)
  );

  if (toLoad.length === 0) return;

  const params = toLoad
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join("&");
  const url = `https://fonts.googleapis.com/css2?${params}&display=swap`;

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
