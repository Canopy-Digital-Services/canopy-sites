import { describe, expect, it } from "vitest";
import { choiceError, choiceList, showsAsButtons } from "../../embed/src/choices";

const sizes = { options: ["Small", "Medium", "Large"].map((s) => ({ value: s, label: s })) };
const withOther = { ...sizes, allowOther: true };

describe("choiceList", () => {
  it("reads today's options and the bare list older fields stored", () => {
    expect(choiceList(sizes)).toHaveLength(3);
    expect(choiceList([{ value: "A", label: "A" }])).toEqual([{ value: "A", label: "A" }]);
    expect(choiceList(null)).toEqual([]);
  });
});

describe("showsAsButtons", () => {
  const list = (n: number, allowOther = false) => ({
    options: Array.from({ length: n }, (_, i) => ({ value: `${i}`, label: `${i}` })),
    allowOther,
  });

  it("shows up to six choices, Other included, as buttons, and folds a longer list into a dropdown", () => {
    expect(showsAsButtons(list(2))).toBe(true);
    expect(showsAsButtons(list(6))).toBe(true);
    expect(showsAsButtons(list(5, true))).toBe(true);
    expect(showsAsButtons(list(6, true))).toBe(false);
    expect(showsAsButtons(list(7))).toBe(false);
  });
});

describe("choiceError", () => {
  it("accepts the options a field offers", () => {
    expect(choiceError("CHOOSE_ONE", "Medium", sizes, "Size")).toBeNull();
    expect(choiceError("CHOOSE_SEVERAL", ["Small", "Large"], sizes, "Sizes")).toBeNull();
  });

  it("refuses an answer off the list unless the field offers Other", () => {
    expect(choiceError("CHOOSE_ONE", "Huge", sizes, "Size")).toBe("Size must be one of its options.");
    expect(choiceError("CHOOSE_SEVERAL", ["Small", "Huge"], sizes, "Sizes")).toBe("Sizes must be one of its options.");
    expect(choiceError("CHOOSE_ONE", "Huge", withOther, "Size")).toBeNull();
    expect(choiceError("CHOOSE_SEVERAL", ["Small", "Huge"], withOther, "Sizes")).toBeNull();
  });

  it("takes one Other answer at most, of a bounded length", () => {
    expect(choiceError("CHOOSE_SEVERAL", ["Huge", "Tiny"], withOther, "Sizes")).toBe("Sizes must be one of its options.");
    expect(choiceError("CHOOSE_ONE", "x".repeat(201), withOther, "Size")).toBe("Size must be 200 characters or fewer.");
  });

  it("refuses a dropdown answer that isn't text, or checkboxes that aren't a list", () => {
    expect(choiceError("CHOOSE_ONE", ["Small"], sizes, "Size")).toBe("Size must be one of its options.");
    expect(choiceError("CHOOSE_SEVERAL", "Small", sizes, "Sizes")).toBe("Sizes must be one of its options.");
  });

  it("takes each checkbox once, and only as text", () => {
    expect(choiceError("CHOOSE_SEVERAL", ["Small", "Small"], sizes, "Sizes")).toBe("Sizes picks an option more than once.");
    expect(choiceError("CHOOSE_SEVERAL", ["Small", { junk: "x" }], withOther, "Sizes")).toBe(
      "Sizes must be one of its options."
    );
  });
});
