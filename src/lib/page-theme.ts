/** Shared constants and extraction for page-level theme tokens. */

export const CONTENT_WIDTH_MAP = {
  sm: "480px",
  md: "640px",
  lg: "768px",
} as const;

export const CARD_SHADOW_MAP = {
  none: "none",
  sm: "0 2px 6px -1px rgb(0 0 0 / 0.1)",
  md: "0 6px 16px -4px rgb(0 0 0 / 0.16)",
  lg: "0 14px 32px -8px rgb(0 0 0 / 0.24)",
} as const;

export type PageTheme = {
  pageBackground: string | null;
  cardEnabled: boolean;
  cardShadow: keyof typeof CARD_SHADOW_MAP;
  contentWidth: keyof typeof CONTENT_WIDTH_MAP;
  verticalAlign: "top" | "center";
  /** Form-level background color, used as the card's background. */
  formBackground: string;
  /** Form-level border radius, used as the card's border radius. */
  formRadius: number;
};

/** Extract page-level tokens from a theme object, applying defaults. */
export function extractPageTheme(
  themeObj: Record<string, unknown> | null | undefined,
): PageTheme {
  const defaults: PageTheme = {
    pageBackground: null,
    cardEnabled: true,
    cardShadow: "md",
    contentWidth: "md",
    verticalAlign: "top",
    formBackground: "#ffffff",
    formRadius: 8,
  };

  if (!themeObj) return defaults;

  const pageBackground =
    typeof themeObj.pageBackground === "string" ? themeObj.pageBackground : null;

  const cardEnabled =
    typeof themeObj.cardEnabled === "boolean" ? themeObj.cardEnabled : true;

  const cardShadow =
    typeof themeObj.cardShadow === "string" &&
    themeObj.cardShadow in CARD_SHADOW_MAP
      ? (themeObj.cardShadow as PageTheme["cardShadow"])
      : "md";

  const contentWidth =
    typeof themeObj.contentWidth === "string" &&
    themeObj.contentWidth in CONTENT_WIDTH_MAP
      ? (themeObj.contentWidth as PageTheme["contentWidth"])
      : "md";

  const verticalAlign =
    themeObj.verticalAlign === "center" ? "center" : "top";

  const formBackground =
    typeof themeObj.background === "string" ? themeObj.background : "#ffffff";

  const formRadius =
    typeof themeObj.radius === "number" ? themeObj.radius : 8;

  return {
    pageBackground, cardEnabled, cardShadow, contentWidth, verticalAlign,
    formBackground, formRadius,
  };
}

/** Returns the inline style for the card wrapper, or undefined when card is off. */
export function cardWrapperStyle(page: PageTheme): React.CSSProperties | undefined {
  if (!page.cardEnabled) return undefined;
  return {
    backgroundColor: page.formBackground,
    borderRadius: `${page.formRadius}px`,
    boxShadow: CARD_SHADOW_MAP[page.cardShadow],
    overflow: "hidden",
    padding: "1.5rem",
  };
}
