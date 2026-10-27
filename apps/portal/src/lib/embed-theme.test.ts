import { describe, expect, it } from "vitest";
import { applyTheme, resolveTheme, type ThemeTokens } from "../../embed/src/theme";

/** The CSS variables applyTheme sets, read back from a stand-in element. */
function applied(theme: ThemeTokens) {
  const vars = new Map<string, string>();
  const container = {
    style: {
      setProperty: (k: string, v: string) => vars.set(k, v),
      removeProperty: (k: string) => vars.delete(k),
    },
  } as unknown as HTMLElement;
  applyTheme(container, theme);
  return vars;
}

describe("embed theme: title and labels", () => {
  it("styles the title without touching the labels", () => {
    const vars = applied(
      resolveTheme({ titleFont: "Lora", titleWeight: "bold", titleColor: "#112233", titleAlign: "center" }, null)
    );
    expect(vars.get("--canopy-title-font")).toBe("'Lora', sans-serif");
    expect(vars.get("--canopy-title-weight")).toBe("700");
    expect(vars.get("--canopy-title-color")).toBe("#112233");
    expect(vars.get("--canopy-title-align")).toBe("center");
    expect(vars.get("--canopy-label-font")).toBe("var(--canopy-font)");
    expect(vars.get("--canopy-label-weight")).toBe("400");
    expect(vars.has("--canopy-label-color")).toBe(false);
    expect(vars.get("--canopy-label-transform")).toBe("none");
  });

  it("reads a legacy headingFont as both fonts", () => {
    const theme = resolveTheme({ headingFont: "Lora" }, null);
    expect(theme.titleFont).toBe("Lora");
    expect(theme.labelFont).toBe("Lora");
  });

  it("lets an explicit font in the same theme win over a legacy headingFont", () => {
    const theme = resolveTheme({ headingFont: "Lora", labelFont: "Inter" }, null);
    expect(theme.titleFont).toBe("Lora");
    expect(theme.labelFont).toBe("Inter");
  });

  it("lets a legacy headingFont in data-theme override both saved fonts", () => {
    const theme = resolveTheme({ titleFont: "Lora", labelFont: "Inter" }, { headingFont: "Lato" });
    expect(theme.titleFont).toBe("Lato");
    expect(theme.labelFont).toBe("Lato");
  });
});

describe("embed theme: title size", () => {
  it("sizes the title in pixels, 28 by default", () => {
    expect(applied(resolveTheme({ titleSize: 36 }, null)).get("--canopy-title-size")).toBe("36px");
    expect(applied(resolveTheme(null, null)).get("--canopy-title-size")).toBe("28px");
  });

  it("sets text at 16px by default, where iOS doesn't zoom into fields", () => {
    expect(applied(resolveTheme(null, null)).get("--canopy-font-size")).toBe("16px");
  });

  it("still reads a legacy size key from data-theme as a multiple of the text size", () => {
    const vars = applied(resolveTheme({ titleSize: 28 }, { titleSize: "xl" }));
    expect(vars.get("--canopy-title-size")).toBe("2.25em");
  });
});
