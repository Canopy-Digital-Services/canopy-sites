type ThemeTokens = {
  fontFamily?: string;
  fontSize?: number;
  fontUrl?: string;
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
};

const DEFAULT_THEME: Required<Omit<ThemeTokens, "fontUrl" | "buttonText">> & {
  fontUrl?: string;
  buttonText?: string;
} = {
  fontFamily: "inherit",
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
  fontUrl: undefined,
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
  container.style.setProperty("--canopy-font", theme.fontFamily || "inherit");
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

export function ensureFontLoaded(fontUrl?: string) {
  if (!fontUrl || loadedFonts.has(fontUrl)) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = fontUrl;
  link.dataset.canopyFont = "true";
  document.head.appendChild(link);
  loadedFonts.add(fontUrl);
}

export type { ThemeTokens };
