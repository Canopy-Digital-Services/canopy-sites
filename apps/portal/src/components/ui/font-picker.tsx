"use client";

import { useEffect } from "react";
import { SearchSelect, type SearchSelectOption } from "@/components/ui/search-select";
import { CURATED_FONTS, CURATED_HEADING_FONTS, ALL_GOOGLE_FONTS } from "@/lib/google-fonts";
import { loadFonts } from "@/lib/load-fonts";

const INHERIT_VALUE = "inherit";
const INHERIT_LABEL = "Inherit from host page";

const fontOption = (font: string): SearchSelectOption => ({ value: font, label: font });
const CURATED = {
  body: { fonts: CURATED_FONTS, options: CURATED_FONTS.map(fontOption) },
  heading: { fonts: CURATED_HEADING_FONTS, options: CURATED_HEADING_FONTS.map(fontOption) },
};
const ALL_FONTS = ALL_GOOGLE_FONTS.map(fontOption);

const typeface = (font: string | undefined) => (font ? { fontFamily: `'${font}', sans-serif` } : undefined);

type FontPickerProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  /** "body" shows body-optimized fonts; "heading" shows heading/display fonts. */
  variant?: "body" | "heading";
  /**
   * Whether the "Inherit from host page" sentinel is offered. Embedded forms
   * inherit from the host page's CSS, so they get this option. Hosted forms
   * have no host page to inherit from: pass false to hide it.
   */
  showInherit?: boolean;
  /**
   * The font an unset value renders in, when it's known: Inter on a hosted
   * page, the text font for the title and labels. The trigger names it, and
   * so does the inherit option, rather than a vague "Default". Left out, an
   * unset value can only be named as the host page's font, so a picker
   * without the inherit option needs it.
   */
  unsetFont?: string;
};

/**
 * A `SearchSelect` of fonts, each drawn in its own typeface: a curated list,
 * every Google font behind the search, and on an embedded form the inherit
 * option above them.
 */
export function FontPicker({ value, onChange, id, variant = "body", showInherit = true, unsetFont }: FontPickerProps) {
  const unset = value === INHERIT_VALUE || !value;
  const curated = CURATED[variant];
  const inherit: SearchSelectOption = { value: INHERIT_VALUE, label: unsetFont ?? INHERIT_LABEL, ruleBelow: true };

  // The font the trigger shows, set or not, so it renders in its own typeface.
  const shownFont = unset ? unsetFont : value;
  useEffect(() => {
    if (shownFont) loadFonts([shownFont]);
  }, [shownFont]);

  return (
    <SearchSelect
      id={id}
      // With no inherit option to hold the tick, an unset value ticks the
      // font it renders in, which is the one the trigger names.
      value={unset ? (showInherit ? INHERIT_VALUE : unsetFont ?? "") : value}
      options={showInherit ? [inherit, ...curated.options] : curated.options}
      searchOptions={ALL_FONTS}
      onChange={onChange}
      // The curated fonts, so each option can render in its own typeface.
      onOpen={() => loadFonts(curated.fonts)}
      placeholder="Search fonts..."
      footer={`Search to browse all ${ALL_GOOGLE_FONTS.length.toLocaleString()} Google Fonts`}
      labelStyle={(option) => typeface(option.value === INHERIT_VALUE ? unsetFont : option.value)}
    />
  );
}
