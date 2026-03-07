/**
 * Dynamically loads Google Fonts into the admin UI via injected <link> tags.
 * Deduplicates — will not inject a stylesheet for a family already loaded.
 * Ignores "inherit" and empty values.
 *
 * This is intentionally separate from the embed's ensureFontsLoaded (embed/src/theme.ts)
 * because the embed is a standalone compiled bundle with no imports from src/.
 */

const loadedFamilies = new Set<string>();

export function loadGoogleFonts(families: string[]): void {
  const toLoad = families.filter(
    (f) => !!f && f !== "inherit" && !loadedFamilies.has(f)
  );

  if (toLoad.length === 0) return;

  const params = toLoad
    .map((f) => `family=${encodeURIComponent(f)}:wght@300;400;700`)
    .join("&");
  const url = `https://fonts.googleapis.com/css2?${params}&display=swap`;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);

  toLoad.forEach((f) => loadedFamilies.add(f));
}
