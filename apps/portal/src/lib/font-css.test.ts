import { describe, expect, it } from "vitest";
import { buildFontCss, MAX_FAMILIES } from "./font-css";

describe("buildFontCss", () => {
  it("serves catalog families from /fonts without touching Google", () => {
    const css = buildFontCss(["Inter"]);
    expect(css).toContain("font-family:'Inter'");
    expect(css).toContain("url(/fonts/inter/inter-latin-400-normal.woff2)");
    expect(css).not.toContain("googleapis");
  });

  it("imports families outside the catalog from Google, before any @font-face", () => {
    const css = buildFontCss(["Inter", "Roboto Slab"]);
    expect(css.startsWith('@import url("https://fonts.googleapis.com/css2?family=Roboto%20Slab:wght@300;400;700&display=swap");')).toBe(true);
    expect(css).toContain("font-family:'Inter'");
  });

  it("drops names that could break out of the URL or CSS string", () => {
    expect(buildFontCss(["x');}body{display:none", 'a"b', ""])).toBe("");
  });

  it("caps and dedupes the requested families", () => {
    const many = Array.from({ length: MAX_FAMILIES + 5 }, (_, i) => `Family ${i}`);
    const css = buildFontCss([...many, "Family 0"]);
    expect(css.match(/family=/g)).toHaveLength(MAX_FAMILIES);
  });
});
