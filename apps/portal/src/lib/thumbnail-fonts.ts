/**
 * A thumbnail is drawn as an image, and an image can't load the page's web
 * fonts: without their files inlined, every typeface falls back to the
 * browser default. This builds the @font-face CSS for the faces `el` renders
 * with, files inlined, to pass to html-to-image as `fontEmbedCSS`.
 *
 * Only faces the browser has loaded are embedded, so a family's unused
 * weights and subsets stay out.
 */
export async function thumbnailFontCss(el: HTMLElement): Promise<string> {
  await document.fonts.ready;

  const used = new Set<string>();
  for (const node of [el, ...el.querySelectorAll("*")]) {
    for (const family of getComputedStyle(node).fontFamily.split(",")) used.add(unquote(family));
  }

  const loaded = new Set<string>();
  document.fonts.forEach((face) => {
    if (face.status === "loaded" && used.has(unquote(face.family))) {
      loaded.add(faceKey(face.family, face.weight, face.style, face.unicodeRange));
    }
  });
  if (loaded.size === 0) return "";

  const rules = (await fontFaceRules()).filter(({ rule }) => {
    const s = rule.style;
    return loaded.has(
      faceKey(
        s.getPropertyValue("font-family"),
        s.getPropertyValue("font-weight"),
        s.getPropertyValue("font-style"),
        s.getPropertyValue("unicode-range")
      )
    );
  });

  // One face that won't load shouldn't cost the thumbnail its other fonts.
  const css = await Promise.all(rules.map((r) => inlineFiles(r.rule.cssText, r.base).catch(() => "")));
  return css.join("\n");
}

const unquote = (family: string) => family.trim().replace(/^["']|["']$/g, "");

// A FontFace and the rule it came from describe a face the same way, except
// that the rule leaves defaults out.
const faceKey = (family: string, weight: string, style: string, range: string) =>
  [unquote(family), weight || "normal", style || "normal", range || "U+0-10FFFF"].join("|");

type Rule = { rule: CSSFontFaceRule; base: string };

/** Every @font-face rule on the page, with the URL its files resolve against. */
async function fontFaceRules(): Promise<Rule[]> {
  const found: Rule[] = [];
  const visit = async (sheet: CSSStyleSheet, base: string) => {
    for (const rule of await readRules(sheet)) {
      if (rule instanceof CSSImportRule && rule.styleSheet) {
        await visit(rule.styleSheet, rule.href ? new URL(rule.href, base).href : base);
      } else if (rule instanceof CSSFontFaceRule) {
        found.push({ rule, base });
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    await visit(sheet, sheet.href ?? document.baseURI);
  }
  return found;
}

const fetchedSheets = new Map<string, Promise<CSSRule[]>>();

/** A cross-origin sheet (Google Fonts, @imported by /api/fonts) hides its
    rules, so it's fetched and parsed here instead. */
async function readRules(sheet: CSSStyleSheet): Promise<CSSRule[]> {
  try {
    return Array.from(sheet.cssRules);
  } catch {
    const href = sheet.href;
    if (!href) return [];
    let rules = fetchedSheets.get(href);
    if (!rules) {
      rules = fetch(href)
        .then((res) => res.text())
        .then((text) => {
          const copy = new CSSStyleSheet();
          copy.replaceSync(text);
          return Array.from(copy.cssRules);
        })
        .catch(() => []);
      fetchedSheets.set(href, rules);
    }
    return rules;
  }
}

const fontFiles = new Map<string, Promise<string>>();

async function inlineFiles(cssText: string, base: string): Promise<string> {
  const urls = [...cssText.matchAll(/url\((["']?)([^"')]+)\1\)/g)];
  let out = cssText;
  for (const [match, , url] of urls) {
    if (url.startsWith("data:")) continue;
    const href = new URL(url, base).href;
    let data = fontFiles.get(href);
    if (!data) {
      data = fetch(href)
        .then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${href}`);
          return res.blob();
        })
        .then(toDataUrl);
      data.catch(() => fontFiles.delete(href));
      fontFiles.set(href, data);
    }
    out = out.replace(match, `url("${await data}")`);
  }
  return out;
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
