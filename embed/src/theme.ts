type ThemeTokens = {
  fontFamily?: string;
  fontUrl?: string;
  text?: string;
  background?: string;
  primary?: string;
  border?: string;
  radius?: number;
  density?: "compact" | "normal" | "comfortable";
};

const DEFAULT_THEME: Required<Omit<ThemeTokens, "fontUrl">> & {
  fontUrl?: string;
} = {
  fontFamily: "inherit",
  text: "#18181b",
  background: "#ffffff",
  primary: "#0ea5e9",
  border: "#e4e4e7",
  radius: 8,
  density: "normal",
  fontUrl: undefined,
};

const loadedFonts = new Set<string>();

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

export function applyTheme(container: HTMLElement, theme: ThemeTokens) {
  container.style.setProperty("--cof-font", theme.fontFamily || "inherit");
  container.style.setProperty("--cof-text", theme.text || DEFAULT_THEME.text);
  container.style.setProperty(
    "--cof-bg",
    theme.background || DEFAULT_THEME.background
  );
  container.style.setProperty(
    "--cof-primary",
    theme.primary || DEFAULT_THEME.primary
  );
  container.style.setProperty(
    "--cof-border",
    theme.border || DEFAULT_THEME.border
  );
  container.style.setProperty(
    "--cof-radius",
    `${theme.radius ?? DEFAULT_THEME.radius}px`
  );
}

export function getDensityClass(theme: ThemeTokens) {
  switch (theme.density) {
    case "compact":
      return "cof-density-compact";
    case "comfortable":
      return "cof-density-comfortable";
    default:
      return "cof-density-normal";
  }
}

export function ensureFontLoaded(fontUrl?: string) {
  if (!fontUrl || loadedFonts.has(fontUrl)) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = fontUrl;
  link.dataset.cofFont = "true";
  document.head.appendChild(link);
  loadedFonts.add(fontUrl);
}

export type { ThemeTokens };
